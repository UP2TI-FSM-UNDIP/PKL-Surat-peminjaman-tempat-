<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentLog;
use App\Models\Sign;
use App\Models\User;
use App\Models\WorkflowStep;
use App\Models\Unit;
use App\Services\DocumentGenerationService;
use App\Models\RoomBooking;
use Illuminate\Support\Facades\DB;

class WorkflowEngine
{
    /**
     * Logika Utama: Approve & Oper ke orang berikutnya
     */
    public function approveDocument(Document $document, User $actor, $note = null, $signaturePath = null)
    {
        return DB::transaction(function () use ($document, $actor, $note, $signaturePath) {
            // 1. Catat Log "APPROVED"
            DocumentLog::create([
                'document_id' => $document->id,
                'user_id' => $actor->id,
                'action' => 'APPROVED',
                'note' => $note,
                'step_snapshot' => $document->current_step_order
            ]);

            try {
                $document->load(['unit', 'workflow']);
                $organizationType = DocumentGenerationService::organizationTypeForCategory($document->unit->category ?? null);

                \Log::info("[WorkflowEngine] Regenerating approval sheet after approve", [
                    'document_id' => $document->id,
                    'approver' => $actor->name,
                    'organization_type' => $organizationType
                ]);

                $generationService = app(DocumentGenerationService::class);
                
                // 1. Regenerate Lembar Pengesahan (Standard for all approvers)
                $filePathApproval = $generationService->generateFromTemplate(
                    $document,
                    'lembar_pengesahan',
                    $organizationType
                );
                
                $updateData = ['file_approval_sheet' => $filePathApproval];

                // 2. Jika approver adalah Wadek 1, regenerate juga Executive Summary
                // Karena Wadek 1 wajib tanda tangan di kedua tempat
                if ($actor->role && $actor->role->slug === 'wadek1') {
                    \Log::info("[WorkflowEngine] Wadek 1 detected, also regenerating executive summary");
                    $filePathExecutive = $generationService->generateFromTemplate(
                        $document,
                        'executive_summary',
                        null
                    );
                    $updateData['file_executive_summary'] = $filePathExecutive;
                }

                $document->update($updateData);

                \Log::info("[WorkflowEngine] ✅ Documents regenerated successfully");
            } catch (\Exception $e) {
                // Don't fail the approval if regeneration fails, just log
                \Log::error("[WorkflowEngine] Failed to regenerate approval sheet", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            // 3. Cari Langkah Selanjutnya
            $nextStepOrder = $document->current_step_order + 1;
            $nextStepConfig = WorkflowStep::where('workflow_id', $document->workflow_id)
                                          ->where('step_order', $nextStepOrder)
                                          ->first();

            // 4. Jika TIDAK ADA langkah selanjutnya -> SELESAI
            if (!$nextStepConfig) {
                $this->finalizeRoomBookings($document, $actor);

                $document->update([
                    'status' => 'APPROVED',
                    'completed_at' => now(),
                    'current_holder_id' => null,
                ]);

                return 'Dokumen telah disetujui sepenuhnya dan proses selesai.';
            }

            // 5. Jika ADA, Cari SIAPA Orangnya (Logic Swimlane/Cross-Unit)
            $nextUser = $this->findApprover($document, $nextStepConfig);

            if (!$nextUser) {
                throw new \Exception("User untuk langkah selanjutnya tidak ditemukan. Cek konfigurasi Unit/Role.");
            }

            // Load role relationship
            $nextUser->load('role');

            // 6. Update Dokumen (Oper Bola)
            $document->update([
                'current_holder_id' => $nextUser->id,
                'current_step_order' => $nextStepOrder,
                'status' => 'IN_PROGRESS'
            ]);

            $roleName = $nextUser->role ? $nextUser->role->name : 'Unknown Role';
            return "Dokumen diteruskan ke: " . $nextUser->name . " (" . $roleName . ")";
        });
    }

    /**
     * Setujui semua booking ruangan milik dokumen yang sudah disetujui penuh.
     *
     * - Semua booking PENDING dokumen ini disetujui (bukan hanya yang pertama).
     * - Booking CANCELLED/REJECTED lama tidak dihidupkan kembali.
     * - Ketersediaan ruangan dicek ulang; jika bentrok dengan booking lain yang
     *   sudah APPROVED, persetujuan dibatalkan (exception, transaksi rollback).
     * - Jika dokumen belum pernah punya booking tapi content berisi data ruangan,
     *   booking dibuat dari content.
     */
    public function finalizeRoomBookings(Document $document, User $actor): void
    {
        $pending = RoomBooking::with('room')
            ->where('document_id', $document->id)
            ->where('status', 'PENDING')
            ->lockForUpdate()
            ->get();

        foreach ($pending as $booking) {
            if (!$booking->approve($actor)) {
                throw new \Exception(
                    "Ruangan {$booking->room?->name} pada " . $booking->booking_date->format('d-m-Y') .
                    ' ' . substr($booking->start_time, 0, 5) . '-' . substr($booking->end_time, 0, 5) .
                    ' sudah dipakai booking lain yang disetujui. Kembalikan dokumen untuk revisi jadwal/ruangan.',
                    400
                );
            }
        }

        // Booking dari content hanya dibuat jika dokumen belum pernah punya
        // booking sama sekali (booking yang dibatalkan pengguna tidak dihidupkan lagi).
        $hasAnyBooking = RoomBooking::where('document_id', $document->id)->exists();

        $content = $document->content ?? [];
        if ($hasAnyBooking || empty($content['room_id']) || empty($content['booking_date'])) {
            return;
        }

        $startTime = $content['start_time'] ?? '09:00';
        $endTime = $content['end_time'] ?? '17:00';

        $room = \App\Models\Room::find($content['room_id']);
        if (!$room) {
            throw new \Exception('Ruangan pada dokumen tidak ditemukan.', 400);
        }
        if (!$room->isAvailable($content['booking_date'], $startTime, $endTime, null, $document->id)) {
            throw new \Exception(
                "Ruangan {$room->name} pada {$content['booking_date']} {$startTime}-{$endTime} sudah dipakai booking lain. " .
                'Kembalikan dokumen untuk revisi jadwal/ruangan.',
                400
            );
        }

        RoomBooking::create([
            'document_id' => $document->id,
            'room_id' => $room->id,
            'booked_by' => $document->creator_id,
            'booking_date' => $content['booking_date'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'purpose' => $content['event_name'] ?? ($document->title ?? 'Booking'),
            'status' => 'APPROVED',
            'approved_by' => $actor->id,
            'approved_at' => now(),
        ]);
    }

    /**
     * Logika Reject: Tolak dokumen secara final, hentikan alur.
     */
    public function rejectDocument(Document $document, User $actor, string $note)
    {
        return DB::transaction(function () use ($document, $actor, $note) {
            // 1. Catat Log "REJECTED"
            DocumentLog::create([
                'document_id' => $document->id,
                'user_id' => $actor->id,
                'action' => 'REJECTED',
                'note' => $note,
                'step_snapshot' => $document->current_step_order,
            ]);

            // 2. Set dokumen sebagai final ditolak
            $document->update([
                'status' => 'REJECTED',
                'completed_at' => now(),
                'current_holder_id' => null,
            ]);

            // 3. Ikut tolak SEMUA booking ruangan terkait yang masih PENDING
            //    (satu dokumen bisa punya beberapa booking lewat batch)
            RoomBooking::where('document_id', $document->id)
                ->where('status', 'PENDING')
                ->get()
                ->each(fn (RoomBooking $booking) => $booking->reject($actor, $note));

            return 'Dokumen ditolak.';
        });
    }

    /**
     * Logika Revisi: Kembalikan ke masa lalu
     */
    public function reviseDocument(Document $document, User $actor, $targetUserId, $note)
    {
        return DB::transaction(function () use ($document, $actor, $targetUserId, $note) {
            // 1. Validasi: Apakah target benar-benar pernah pegang surat ini?
            $isValidTarget = DocumentLog::where('document_id', $document->id)
                                        ->where('user_id', $targetUserId)
                                        ->exists();

            if (!$isValidTarget && $document->creator_id != $targetUserId) {
                throw new \Exception("User target tidak ada dalam riwayat dokumen ini.");
            }

            // 2. Tentukan langkah tujuan. Jika dikembalikan ke approver sebelumnya
            //    (bukan pembuat), posisi langkah harus mundur ke langkah milik approver
            //    tersebut. Kalau tidak, saat ia approve lagi dokumen akan meloncati
            //    langkah-langkah di antaranya. (Jika dikembalikan ke pembuat,
            //    submitDocument yang menentukan langkah saat diajukan ulang.)
            $targetStep = null;
            if ((int) $targetUserId !== (int) $document->creator_id) {
                $targetStep = DocumentLog::where('document_id', $document->id)
                    ->where('user_id', $targetUserId)
                    ->where('action', 'APPROVED')
                    ->where('step_snapshot', '>', 0)
                    ->latest('id')
                    ->value('step_snapshot');
            }

            // 3. Catat Log "RETURNED". step_snapshot = langkah tujuan, dipakai untuk
            //    menganggap persetujuan langkah >= tujuan sudah tidak berlaku.
            DocumentLog::create([
                'document_id' => $document->id,
                'user_id' => $actor->id, // Manager
                'action' => 'RETURNED',
                'note' => $note, // "Salah ketik, tolong perbaiki"
                'step_snapshot' => $targetStep,
            ]);

            // 4. Kembalikan Bola (Update Master)
            $updates = [
                'current_holder_id' => $targetUserId,
                'status' => 'REVISION',
            ];
            if ($targetStep) {
                $updates['current_step_order'] = (int) $targetStep;
            }

            $document->update($updates);

            return "Dokumen dikembalikan untuk revisi.";
        });
    }

    /**
     * Logic Pencarian User (Swimlanes & Cross-Unit)
     */
    public function findApprover(Document $doc, WorkflowStep $step)
    {
        $originUnit = $doc->unit; // Unit pembuat surat (misal: HIMA)

        if (!$originUnit) {
            throw new \Exception("Dokumen tidak memiliki unit. Tidak dapat menentukan approver.");
        }

        // Query Builder Awal
        $query = User::query()->whereHas('role', function($q) use ($step) {
            $q->where('slug', $step->target_role_slug);
        });

        $approver = null;

        // --- PRE-QUERY FALLBACK LOGIC ---
        // If target role is 'senat', we first try to find the user with slug 'senat'.
        // If that fails, we will try 'ketua-ormawa' as a fallback within the logic below.

        switch ($step->scope_type) {
            case 'SELF':
                // Cari di unit pengirim (HIMA)
                $approver = $query->where('unit_id', $originUnit->id)->first();

                if (!$approver && $step->target_role_slug === 'senat') {
                    \Log::info("[WorkflowEngine] Fallback (SELF): 'senat' role not found in {$originUnit->name}, trying 'ketua-ormawa'");
                    $approver = User::where('unit_id', $originUnit->id)
                                    ->whereHas('role', function($q) { $q->where('slug', 'ketua-ormawa'); })
                                    ->first();
                }

                if (!$approver) {
                    throw new \Exception(
                        "Tidak dapat menemukan approver untuk langkah '{$step->step_name}'. " .
                        "Diperlukan user dengan role '{$step->target_role_slug}' di unit '{$originUnit->name}'. " .
                        "Silakan hubungi admin untuk menambahkan user dengan role tersebut."
                    );
                }
                return $approver;

            case 'PARENT':
                // Cari di induk (Prodi)
                if (!$originUnit->parent_id) {
                    throw new \Exception("Unit {$originUnit->name} tidak memiliki parent unit. Tidak dapat menentukan approver untuk scope PARENT.");
                }
                $approver = $query->where('unit_id', $originUnit->parent_id)->first();

                if (!$approver) {
                    $parentUnit = Unit::find($originUnit->parent_id);
                    throw new \Exception(
                        "Tidak dapat menemukan approver untuk langkah '{$step->step_name}'. " .
                        "Diperlukan user dengan role '{$step->target_role_slug}' di unit parent '{$parentUnit->name}'. " .
                        "Silakan hubungi admin untuk menambahkan user dengan role tersebut."
                    );
                }
                return $approver;

            case 'FACULTY_LEADER':
                // Cari di Fakultas (Unit tanpa parent / Root)
                $facultyUnit = Unit::where('category', 'FAKULTAS')->first();
                if (!$facultyUnit) {
                    throw new \Exception("Unit dengan category FAKULTAS tidak ditemukan.");
                }
                $approver = $query->where('unit_id', $facultyUnit->id)->first();

                if (!$approver) {
                    throw new \Exception(
                        "Tidak dapat menemukan approver untuk langkah '{$step->step_name}'. " .
                        "Diperlukan user dengan role '{$step->target_role_slug}' di unit fakultas '{$facultyUnit->name}'. " .
                        "Silakan hubungi admin untuk menambahkan user dengan role tersebut."
                    );
                }
                return $approver;

            case 'SPECIFIC_CATEGORY':
                // Cari Unit lain (Misal: SENAT)
                if (!$step->target_category_lookup) {
                    throw new \Exception("target_category_lookup tidak didefinisikan untuk step dengan scope SPECIFIC_CATEGORY.");
                }

                $targetUnit = Unit::whereRaw('LOWER(category) = ?', [strtolower($step->target_category_lookup)])->first();
                if (!$targetUnit) {
                    throw new \Exception("Unit dengan category {$step->target_category_lookup} tidak ditemukan.");
                }

                $approver = $query->where('unit_id', $targetUnit->id)->first();

                if (!$approver && $step->target_role_slug === 'senat') {
                    \Log::info("[WorkflowEngine] Fallback: 'senat' role not found in {$targetUnit->name}, trying 'ketua-ormawa'");
                    $approver = User::where('unit_id', $targetUnit->id)
                                    ->whereHas('role', function($q) { $q->where('slug', 'ketua-ormawa'); })
                                    ->first();
                }

                if (!$approver) {
                    throw new \Exception(
                        "Tidak dapat menemukan approver untuk langkah '{$step->step_name}'. " .
                        "Diperlukan user dengan role '{$step->target_role_slug}' di unit '{$targetUnit->name}'."
                    );
                }
                return $approver;

            default:
                return null;
        }
    }
}

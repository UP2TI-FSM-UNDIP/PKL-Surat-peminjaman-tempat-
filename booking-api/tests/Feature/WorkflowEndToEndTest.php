<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Role;
use App\Models\RoomBooking;
use App\Models\Sign;
use App\Models\Unit;
use App\Models\User;
use App\Services\DocumentGenerationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Uji end-to-end alur pengajuan peminjaman ruangan lewat API:
 * buat dokumen -> booking -> submit -> approval berjenjang -> revisi/tolak -> selesai.
 *
 * WAJIB dijalankan terhadap database uji terpisah yang sudah di-migrate + seed
 * (DB_DATABASE=booking_e2e, DB_PORT=55432). Test menolak jalan di database lain.
 */
class WorkflowEndToEndTest extends TestCase
{
    use DatabaseTransactions;

    private const HMD_WORKFLOW_ID = 1;

    protected function setUp(): void
    {
        if (getenv('DB_DATABASE') !== 'booking_e2e' || getenv('DB_PORT') !== '55432') {
            $this->markTestSkipped('E2E test hanya boleh jalan di database uji booking_e2e:55432');
        }

        parent::setUp();

        $conn = config('database.connections.' . config('database.default'));
        if (($conn['database'] ?? null) !== 'booking_e2e' || (string) ($conn['port'] ?? '') !== '55432') {
            $this->fail('Koneksi database bukan database uji. Dihentikan.');
        }

        Storage::fake('private');
        Storage::fake(config('filesystems.default'));
    }

    // ---------------------------------------------------------------- helpers

    private function user(string $roleSlug, string $unitCode): User
    {
        return User::whereHas('role', fn ($q) => $q->where('slug', $roleSlug))
            ->whereHas('unit', fn ($q) => $q->where('code', $unitCode))
            ->firstOrFail();
    }

    private function withSignature(User $user): User
    {
        $path = "signatures/test_{$user->id}.png";
        Storage::disk('private')->put($path, 'fake-png');
        Sign::create(['user_id' => $user->id, 'signature' => $path, 'signed_at' => now()]);
        return $user;
    }

    private function nextValidSaturday(int $extraWeeks = 0): string
    {
        $d = Carbon::today()->addDays(config('booking.min_booking_days', 8));
        while (!$d->isSaturday()) {
            $d->addDay();
        }
        return $d->addWeeks($extraWeeks)->toDateString();
    }

    private function createDocument(User $creator, array $content, int $workflowId = self::HMD_WORKFLOW_ID)
    {
        Sanctum::actingAs($creator);
        return $this->postJson('/api/documents', [
            'workflow_id' => $workflowId,
            'title' => 'Uji E2E ' . ($content['event_name'] ?? ''),
            'content' => $content,
        ]);
    }

    private function content(int $roomId, string $date, string $start = '09:00', string $end = '12:00'): array
    {
        return [
            'event_name' => 'Seminar E2E',
            'room_id' => $roomId,
            'booking_date' => $date,
            'start_time' => $start,
            'end_time' => $end,
        ];
    }

    private function book(User $user, int $docId, int $roomId, string $date, string $start = '09:00', string $end = '12:00')
    {
        Sanctum::actingAs($user);
        return $this->postJson('/api/room-bookings', [
            'document_id' => $docId,
            'room_id' => $roomId,
            'booking_date' => $date,
            'start_time' => $start,
            'end_time' => $end,
            'purpose' => 'Seminar E2E',
        ]);
    }

    private function submit(User $user, int $docId)
    {
        Sanctum::actingAs($user);
        return $this->postJson("/api/documents/{$docId}/submit");
    }

    private function approveAsHolder(int $docId)
    {
        $holder = User::findOrFail(Document::findOrFail($docId)->current_holder_id);
        Sanctum::actingAs($holder);
        return $this->postJson("/api/documents/{$docId}/approve", ['note' => 'ok']);
    }

    /** Approve terus sampai dokumen APPROVED; kembalikan urutan langkah yang dilewati. */
    private function approveUntilDone(int $docId, int $maxSteps = 12): array
    {
        $steps = [];
        for ($i = 0; $i < $maxSteps; $i++) {
            $doc = Document::findOrFail($docId);
            if ($doc->status === 'APPROVED') {
                return $steps;
            }
            $steps[] = $doc->current_step_order;
            $this->approveAsHolder($docId)->assertOk();
        }
        $this->fail('Dokumen tidak selesai setelah ' . $maxSteps . ' kali approve');
    }

    /** Siapkan dokumen HMD yang sudah disubmit dan booking PENDING. */
    private function submittedHmdDocument(int $roomId = 1, ?string $date = null): array
    {
        $date ??= $this->nextValidSaturday();
        $creator = $this->user('sekretaris', 'HIMASTA');

        $docId = $this->createDocument($creator, $this->content($roomId, $date))->assertCreated()->json('data.id');
        $this->book($creator, $docId, $roomId, $date)->assertCreated();
        $this->submit($creator, $docId)->assertOk();

        return [$docId, $creator, $date];
    }

    private function signAllApprovers(): void
    {
        foreach ([
            ['ketua-ormawa', 'HIMASTA'], ['ketua-ormawa', 'SENAT-FSM'], ['dosen-pendamping', 'HIMASTA'],
            ['ketua-departemen', 'STAT'], ['wadek1', 'FSM'],
        ] as [$role, $unit]) {
            $this->withSignature($this->user($role, $unit));
        }
    }

    // ------------------------------------------------------------------ tests

    public function test_alur_lengkap_hmd_sampai_booking_disetujui(): void
    {
        $this->signAllApprovers();
        [$docId] = $this->submittedHmdDocument();

        // Sekretaris auto-approve langkah 1, dokumen ke Ketua HMD (langkah 2)
        $doc = Document::find($docId);
        $this->assertSame('IN_PROGRESS', $doc->status);
        $this->assertSame(2, $doc->current_step_order);
        $this->assertSame($this->user('ketua-ormawa', 'HIMASTA')->id, $doc->current_holder_id);

        // Langkah 3 (Senat) fallback ke Ketua Ormawa unit Senat
        $this->approveAsHolder($docId)->assertOk();
        $this->assertSame($this->user('ketua-ormawa', 'SENAT-FSM')->id, Document::find($docId)->current_holder_id);

        $steps = $this->approveUntilDone($docId);
        $this->assertSame([3, 4, 5, 6, 7, 8], $steps, 'Semua langkah harus dilalui berurutan');

        $doc = Document::find($docId);
        $this->assertSame('APPROVED', $doc->status);
        $this->assertNotNull($doc->completed_at);
        $this->assertNull($doc->current_holder_id);

        $bookings = RoomBooking::where('document_id', $docId)->get();
        $this->assertCount(1, $bookings);
        $this->assertSame('APPROVED', $bookings->first()->status);
    }

    public function test_submit_tanpa_booking_membuat_booking_pending_dari_content(): void
    {
        $creator = $this->user('sekretaris', 'HIMASTA');
        $date = $this->nextValidSaturday();
        $docId = $this->createDocument($creator, $this->content(2, $date))->assertCreated()->json('data.id');

        $this->submit($creator, $docId)->assertOk();

        $booking = RoomBooking::where('document_id', $docId)->sole();
        $this->assertSame('PENDING', $booking->status);
        $this->assertSame(2, $booking->room_id);
        $this->assertSame($date, $booking->booking_date->toDateString());
    }

    public function test_batch_booking_semua_disetujui_saat_final(): void
    {
        $this->signAllApprovers();
        $creator = $this->user('sekretaris', 'HIMASTA');
        $date = $this->nextValidSaturday();
        $docId = $this->createDocument($creator, $this->content(1, $date))->assertCreated()->json('data.id');

        Sanctum::actingAs($creator);
        $this->postJson('/api/room-bookings/batch', [
            'document_id' => $docId,
            'bookings' => [
                ['room_id' => 1, 'booking_date' => $date, 'start_time' => '09:00', 'end_time' => '12:00', 'purpose' => 'Sesi 1'],
                ['room_id' => 2, 'booking_date' => $date, 'start_time' => '13:00', 'end_time' => '16:00', 'purpose' => 'Sesi 2'],
            ],
        ])->assertSuccessful();

        $this->submit($creator, $docId)->assertOk();
        $this->approveUntilDone($docId);

        $statuses = RoomBooking::where('document_id', $docId)->pluck('status')->all();
        $this->assertSame(['APPROVED', 'APPROVED'], $statuses);
    }

    public function test_reject_menolak_semua_booking_pending(): void
    {
        $creator = $this->user('sekretaris', 'HIMASTA');
        $date = $this->nextValidSaturday();
        $docId = $this->createDocument($creator, $this->content(1, $date))->assertCreated()->json('data.id');

        Sanctum::actingAs($creator);
        $this->postJson('/api/room-bookings/batch', [
            'document_id' => $docId,
            'bookings' => [
                ['room_id' => 1, 'booking_date' => $date, 'start_time' => '09:00', 'end_time' => '12:00', 'purpose' => 'Sesi 1'],
                ['room_id' => 2, 'booking_date' => $date, 'start_time' => '09:00', 'end_time' => '12:00', 'purpose' => 'Sesi 2'],
            ],
        ])->assertSuccessful();
        $this->submit($creator, $docId)->assertOk();

        Sanctum::actingAs(User::find(Document::find($docId)->current_holder_id));
        $this->postJson("/api/documents/{$docId}/reject", ['note' => 'Tidak sesuai'])->assertOk();

        $this->assertSame('REJECTED', Document::find($docId)->status);
        $this->assertSame(['REJECTED', 'REJECTED'], RoomBooking::where('document_id', $docId)->pluck('status')->all());
    }

    public function test_dikembalikan_ke_approver_sebelumnya_tidak_meloncati_langkah(): void
    {
        $this->signAllApprovers();
        [$docId] = $this->submittedHmdDocument();

        // Approve sampai langkah 5 (Ketua Departemen)
        while (Document::find($docId)->current_step_order < 5) {
            $this->approveAsHolder($docId)->assertOk();
        }
        $ketuaHmd = $this->user('ketua-ormawa', 'HIMASTA');

        Sanctum::actingAs(User::find(Document::find($docId)->current_holder_id));
        $this->postJson("/api/documents/{$docId}/revise", [
            'target_user_id' => $ketuaHmd->id,
            'note' => 'Perbaiki rundown',
        ])->assertOk();

        $doc = Document::find($docId);
        $this->assertSame('REVISION', $doc->status);
        $this->assertSame(2, $doc->current_step_order, 'Harus mundur ke langkah Ketua HMD');

        // Persetujuan langkah >= 2 tidak berlaku lagi (untuk tanda tangan)
        $effectiveSteps = DocumentGenerationService::effectiveApprovalLogs($doc)->pluck('step_snapshot')->all();
        $this->assertSame([1], $effectiveSteps);

        // Ketua HMD approve lagi -> lanjut ke langkah 3, bukan 6
        $this->approveAsHolder($docId)->assertOk();
        $doc = Document::find($docId);
        $this->assertSame(3, $doc->current_step_order);
        $this->assertSame('IN_PROGRESS', $doc->status);

        $this->assertSame([3, 4, 5, 6, 7, 8], $this->approveUntilDone($docId));
        $this->assertSame('APPROVED', RoomBooking::where('document_id', $docId)->sole()->status);
    }

    public function test_revisi_ganti_ruangan_langsung_ke_sumber_daya(): void
    {
        $this->signAllApprovers();
        [$docId, $creator, $date] = $this->submittedHmdDocument(1);

        $this->approveAsHolder($docId)->assertOk(); // langkah 2 -> 3

        Sanctum::actingAs(User::find(Document::find($docId)->current_holder_id));
        $this->postJson("/api/documents/{$docId}/revise", [
            'target_user_id' => $creator->id,
            'note' => 'Ganti ruangan',
        ])->assertOk();

        // Pembuat tidak boleh approve dokumen revisinya sendiri
        Sanctum::actingAs($creator);
        $this->postJson("/api/documents/{$docId}/approve")->assertStatus(400);

        // Alur frontend: update dokumen, update booking, lalu submit
        $this->putJson("/api/documents/{$docId}", ['content' => ['room_id' => 2]])->assertOk();
        $bookingId = RoomBooking::where('document_id', $docId)->sole()->id;
        $this->putJson("/api/room-bookings/{$bookingId}", [
            'room_id' => 2, 'booking_date' => $date, 'start_time' => '09:00', 'end_time' => '12:00', 'purpose' => 'Seminar E2E',
        ])->assertOk();
        $this->submit($creator, $docId)->assertOk();

        $doc = Document::find($docId);
        $this->assertSame(8, $doc->current_step_order, 'Ganti ruangan harus langsung ke Sumber Daya');
        $this->assertSame($this->user('sumber-daya', 'FSM')->id, $doc->current_holder_id);

        $this->approveAsHolder($docId)->assertOk();
        $booking = RoomBooking::where('document_id', $docId)->sole();
        $this->assertSame('APPROVED', Document::find($docId)->status);
        $this->assertSame(['APPROVED', 2], [$booking->status, $booking->room_id]);
    }

    public function test_revisi_ganti_tanggal_ulang_dari_awal(): void
    {
        [$docId, $creator] = $this->submittedHmdDocument(1);
        $this->withSignature($this->user('ketua-ormawa', 'HIMASTA'));
        $this->approveAsHolder($docId)->assertOk(); // 2 -> 3

        Sanctum::actingAs(User::find(Document::find($docId)->current_holder_id));
        $this->postJson("/api/documents/{$docId}/revise", ['target_user_id' => $creator->id, 'note' => 'Ganti tanggal'])->assertOk();

        $newDate = $this->nextValidSaturday(1);
        Sanctum::actingAs($creator);
        $this->putJson("/api/documents/{$docId}", ['content' => ['booking_date' => $newDate]])->assertOk();
        // Sengaja TIDAK meng-update booking: submit harus menyinkronkannya sendiri
        $this->submit($creator, $docId)->assertOk();

        $doc = Document::find($docId);
        $this->assertSame(2, $doc->current_step_order, 'Ganti tanggal: ulang dari awal (sekretaris auto-approve -> langkah 2)');
        $this->assertSame($newDate, RoomBooking::where('document_id', $docId)->sole()->booking_date->toDateString());
    }

    public function test_approve_final_gagal_jika_ruangan_bentrok(): void
    {
        $this->signAllApprovers();
        [$docId, , $date] = $this->submittedHmdDocument(3);

        while (Document::find($docId)->current_step_order < 8) {
            $this->approveAsHolder($docId)->assertOk();
        }

        // Booking lain sudah disetujui di slot yang sama (mis. booking manual admin)
        $otherDoc = Document::create([
            'workflow_id' => 1, 'title' => 'Lain', 'unit_id' => Unit::where('code', 'FSM')->value('id'),
            'creator_id' => $this->user('admin', 'FSM')->id, 'status' => 'APPROVED', 'current_step_order' => 999,
        ]);
        RoomBooking::create([
            'document_id' => $otherDoc->id, 'room_id' => 3, 'booked_by' => $otherDoc->creator_id,
            'booking_date' => $date, 'start_time' => '10:00', 'end_time' => '11:00', 'purpose' => 'Lain', 'status' => 'APPROVED',
        ]);

        $this->approveAsHolder($docId)->assertStatus(400)->assertJsonPath('success', false);

        $this->assertSame('IN_PROGRESS', Document::find($docId)->status, 'Transaksi harus rollback');
        $this->assertSame('PENDING', RoomBooking::where('document_id', $docId)->sole()->status);
    }

    public function test_booking_tidak_bisa_diubah_saat_dokumen_diproses(): void
    {
        [$docId, $creator, $date] = $this->submittedHmdDocument(1);
        $bookingId = RoomBooking::where('document_id', $docId)->sole()->id;

        Sanctum::actingAs($creator);
        $this->putJson("/api/room-bookings/{$bookingId}", [
            'room_id' => 2, 'booking_date' => $date, 'start_time' => '09:00', 'end_time' => '12:00', 'purpose' => 'x',
        ])->assertStatus(400);

        $this->assertSame(1, RoomBooking::find($bookingId)->room_id);
    }

    public function test_workflow_harus_sesuai_unit_pembuat(): void
    {
        $fsmSekretaris = User::create([
            'name' => 'Sekretaris Fakultas Uji', 'email' => 'sekre-fsm-e2e@example.test', 'password' => bcrypt('x'),
            'role_id' => Role::where('slug', 'sekretaris')->value('id'), 'unit_id' => Unit::where('code', 'FSM')->value('id'),
        ]);

        $this->createDocument($fsmSekretaris, $this->content(1, $this->nextValidSaturday()))
            ->assertStatus(422)
            ->assertJsonPath('errors.workflow_id.0', 'Workflow tidak sesuai dengan kategori unit Anda');
    }

    public function test_user_senat_melihat_workflow_senat_meski_beda_huruf(): void
    {
        Sanctum::actingAs($this->user('sekretaris', 'SENAT-FSM'));
        $ids = collect($this->getJson('/api/workflows')->assertOk()->json('data'))->pluck('id')->all();
        $this->assertSame([3], $ids);
    }

    public function test_admin_bisa_membuat_unit_dengan_kategori_yang_benar(): void
    {
        Sanctum::actingAs($this->user('admin', 'FSM'));
        $this->postJson('/api/units', [
            'name' => 'Himpunan Uji', 'code' => 'HM-E2E', 'category' => 'HMD',
            'parent_id' => Unit::where('code', 'STAT')->value('id'),
        ])->assertCreated();

        $this->postJson('/api/units', ['name' => 'X', 'code' => 'HM-E2E-2', 'category' => 'HIMA'])->assertStatus(422);
    }

    public function test_detail_booking_hanya_untuk_yang_berhak(): void
    {
        [$docId, $creator] = $this->submittedHmdDocument(1);
        $bookingId = RoomBooking::where('document_id', $docId)->sole()->id;

        Sanctum::actingAs($this->user('ketua-ormawa', 'SENAT-FSM'));
        $this->getJson("/api/room-bookings/{$bookingId}")->assertForbidden();

        Sanctum::actingAs($creator);
        $this->getJson("/api/room-bookings/{$bookingId}")->assertOk();

        Sanctum::actingAs($this->user('sumber-daya', 'FSM'));
        $this->getJson("/api/room-bookings/{$bookingId}")->assertOk();
    }

    public function test_hold_kadaluarsa_tidak_melepas_booking_dokumen_yang_diproses(): void
    {
        [$inProgressId, $creator, $date] = $this->submittedHmdDocument(1);

        $draftId = $this->createDocument($creator, $this->content(2, $date))->assertCreated()->json('data.id');
        $this->book($creator, $draftId, 2, $date)->assertCreated();

        RoomBooking::query()->update(['created_at' => now()->subDays(30)]);

        // Hold lama milik dokumen yang masih diproses tetap menahan ruangan
        $this->book($creator, $draftId, 1, $date)->assertStatus(400);

        $this->artisan('room:release-expired')->assertSuccessful();

        $this->assertSame('PENDING', RoomBooking::where('document_id', $inProgressId)->sole()->status);
        $this->assertSame('CANCELLED', RoomBooking::where('document_id', $draftId)->sole()->status);
    }
}

<?php

namespace Database\Seeders;

use App\Models\Document;
use App\Models\DocumentLog;
use App\Models\DocumentTemplate;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\Sign;
use App\Models\User;
use App\Models\Workflow;
use App\Services\DocumentService;
use App\Services\WorkflowEngine;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Data demo untuk mencoba alur peminjaman ruang dari awal sampai akhir:
 * - tanda tangan untuk semua akun (syarat generate surat & approve),
 * - ruangan aktif, template dokumen aktif,
 * - contoh surat di semua status dan di setiap langkah persetujuan,
 *   untuk HMD, BEM, Senat, dan UKM, lengkap dengan booking di kalender.
 *
 * Alur surat dibuat lewat service aplikasi (submit / approve / revisi / tolak),
 * sehingga riwayat, posisi langkah, dan booking konsisten.
 *
 * Jalankan:  php artisan db:seed --class=DemoDataSeeder
 * Aman dijalankan ulang: data demo sebelumnya (meta_data.demo = true) dihapus dulu.
 * Tidak jalan di production kecuali DEMO_SEED_ALLOW_PRODUCTION=true.
 */
class DemoDataSeeder extends Seeder
{
    private WorkflowEngine $engine;
    private DocumentService $documents;

    /** Penghitung slot jam per (ruangan, tanggal) agar booking demo tidak bentrok */
    private array $usedSlots = [];

    public function run(): void
    {
        if (app()->environment('production') && !filter_var(env('DEMO_SEED_ALLOW_PRODUCTION'), FILTER_VALIDATE_BOOLEAN)) {
            $this->command?->error('DemoDataSeeder tidak dijalankan di production. Set DEMO_SEED_ALLOW_PRODUCTION=true jika memang disengaja.');
            return;
        }

        $this->engine = app(WorkflowEngine::class);
        $this->documents = app(DocumentService::class);

        $this->ensureBaseData();
        $this->removePreviousDemoData();
        $rooms = $this->ensureRooms();
        $this->ensureSignatures();

        $this->seedScenarios($rooms);

        $this->printSummary();
    }

    // ------------------------------------------------------------------ setup

    private function ensureBaseData(): void
    {
        if (!Workflow::exists() || !User::whereHas('role', fn ($q) => $q->where('slug', 'sekretaris'))->exists()) {
            $this->call([RoleSeeder::class, UnitSeeder::class, UserSeeder::class, WorkflowSeeder::class]);
        }

        if (!DocumentTemplate::where('is_active', true)->exists()) {
            $this->call(DocumentTemplateSeeder::class);
        }
    }

    private function removePreviousDemoData(): void
    {
        $ids = Document::withTrashed()
            ->get(['id', 'meta_data'])
            ->filter(fn ($d) => ($d->meta_data['demo'] ?? false) === true)
            ->pluck('id');

        if ($ids->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($ids) {
            RoomBooking::withTrashed()->whereIn('document_id', $ids)->forceDelete();
            DocumentLog::whereIn('document_id', $ids)->delete();
            Document::withTrashed()->whereIn('id', $ids)->forceDelete();
        });

        $this->command?->info("Data demo lama dihapus: {$ids->count()} surat.");
    }

    /** @return array<string, Room> ruangan aktif, dikunci dengan kode */
    private function ensureRooms(): array
    {
        $defs = [
            ['AU-01', 'Aula Utama FSM', 200, ['Proyektor', 'Sound System', 'AC', 'Wifi', 'Panggung'], 'Aula utama untuk acara besar fakultas - Gedung A Lantai 1'],
            ['LK-01', 'Lab Komputer 1', 40, ['Proyektor', 'AC', 'Wifi', '40 PC'], 'Lab komputer untuk praktikum - Gedung B Lantai 2'],
            ['RR-A01', 'Ruang Rapat A', 20, ['Proyektor', 'AC', 'Wifi', 'Whiteboard', 'Meja Conference'], 'Ruang rapat untuk pertemuan - Gedung A Lantai 2'],
            ['LE-01', 'Lab Elektronika', 30, ['Proyektor', 'AC', 'Peralatan Lab'], 'Lab untuk praktikum elektronika - Gedung C Lantai 1'],
            ['RS-B01', 'Ruang Seminar B', 80, ['Proyektor', 'Sound System', 'AC', 'Wifi'], 'Ruang seminar - Gedung B Lantai 1'],
        ];

        $rooms = [];
        foreach ($defs as [$code, $name, $capacity, $facilities, $description]) {
            $room = Room::firstOrCreate(['code' => $code], [
                'name' => $name,
                'capacity' => $capacity,
                'facilities' => $facilities,
                'description' => $description,
                'status' => 'ACTIVE',
            ]);
            if ($room->status === 'ACTIVE') {
                $rooms[$code] = $room;
            }
        }

        if (count($rooms) < 2) {
            throw new \RuntimeException('Minimal 2 ruangan berstatus ACTIVE diperlukan untuk data demo.');
        }

        return $rooms;
    }

    /**
     * Tanda tangan untuk akun demo yang belum punya (syarat generate surat & approve).
     * Hanya akun demo bawaan UserSeeder (email @fsm.undip.ac.id / @student.undip.ac.id);
     * akun orang sungguhan (@students / @lecturer, dll.) tidak dibuatkan tanda tangan.
     */
    private function ensureSignatures(): void
    {
        $users = User::whereNotIn('id', Sign::query()->select('user_id'))
            ->where(fn ($q) => $q->where('email', 'like', '%@fsm.undip.ac.id')
                ->orWhere('email', 'like', '%@student.undip.ac.id'))
            ->get();
        foreach ($users as $user) {
            $path = "signatures/demo/signature_{$user->id}.png";
            Storage::disk('private')->put($path, $this->signaturePng($user->name));
            Sign::create(['user_id' => $user->id, 'signature' => $path, 'signed_at' => now()]);
        }
        $this->command?->info("Tanda tangan demo dibuat untuk {$users->count()} akun.");
    }

    /** Gambar tanda tangan sederhana (coretan + inisial) berlatar transparan. */
    private function signaturePng(string $name): string
    {
        $w = 300;
        $h = 120;
        $img = imagecreatetruecolor($w, $h);
        imagesavealpha($img, true);
        imagefill($img, 0, 0, imagecolorallocatealpha($img, 0, 0, 0, 127));
        $ink = imagecolorallocate($img, 20, 40, 120);
        imagesetthickness($img, 3);

        $seed = crc32($name);
        $prevX = 20;
        $prevY = 70;
        for ($x = 20; $x <= 280; $x += 4) {
            $y = (int) (70 + 25 * sin(($x + $seed % 50) / 18) * cos($x / (40 + $seed % 20)));
            imageline($img, $prevX, $prevY, $x, $y, $ink);
            [$prevX, $prevY] = [$x, $y];
        }
        imageline($img, 40, 100, 260, 95, $ink);

        $initials = collect(preg_split('/\s+/', preg_replace('/[^A-Za-z ]/', '', $name)))
            ->filter()->map(fn ($p) => strtoupper($p[0]))->take(3)->implode('');
        imagestring($img, 5, 230, 10, $initials, $ink);

        ob_start();
        imagepng($img);
        imagedestroy($img);
        return ob_get_clean();
    }

    // -------------------------------------------------------------- scenarios

    private function seedScenarios(array $rooms): void
    {
        $roomCodes = array_keys($rooms);
        $room = fn (int $i) => $rooms[$roomCodes[$i % count($roomCodes)]];

        // [unit, judul kegiatan, ruangan, minggu ke-, aksi]
        // Aksi: 'draft' | angka = jumlah approve setelah submit | array khusus
        $scenarios = [
            // ---- HMD: satu surat di setiap langkah persetujuan
            ['HMMATH', 'Seminar Nasional Matematika Terapan',          $room(0), 0, 'draft'],
            ['HIMASTA', 'Pelatihan Analisis Data dengan R',            $room(1), 0, 0],  // di Ketua HMD
            ['HMF', 'Workshop Fisika Komputasi',                       $room(2), 0, 1],  // di Senat
            ['HMK', 'Lomba Karya Tulis Ilmiah Kimia',                  $room(3), 1, 2],  // di Dosen Pendamping
            ['HMB', 'Seminar Konservasi Keanekaragaman Hayati',        $room(0), 1, 3],  // di Ketua Departemen
            ['HMIF', 'Workshop Pengembangan Aplikasi Mobile',          $room(1), 1, 4],  // di Kemahasiswaan
            ['HIMASTA', 'Rapat Kerja Pengurus HIMASTA',                $room(2), 2, 5],  // di Wadek 1
            ['HMMATH', 'Olimpiade Matematika SMA se-Jawa Tengah',      $room(3), 2, 6],  // di Sumber Daya
            ['HMIF', 'Hackathon Informatika 2026',                     $room(0), 3, 'approved'],

            // ---- BEM
            ['BEM-FSM', 'Musyawarah Besar BEM FSM',                    $room(1), 3, ['revise_creator_after' => 2]],
            ['BEM-FSM', 'Dialog Terbuka Mahasiswa dan Dekanat',        $room(2), 4, 'approved'],

            // ---- Senat (alur Senat sendiri)
            ['SENAT-FSM', 'Sidang Umum Senat Mahasiswa',               $room(3), 4, 1],

            // ---- UKM
            ['MADANI', 'Kajian Keislaman Bulanan',                     $room(0), 5, ['revise_to_ketua_after' => 3]],
            ['PKM', 'Pelatihan Penulisan Proposal PKM',                $room(1), 5, 'approved'],
            ['POTLOT', 'Pameran Karya Seni Rupa Mahasiswa',            $room(2), 6, ['reject_after' => 2]],
            ['VOSC', 'Konser Paduan Suara Akhir Tahun',                $room(3), 6, 3],
            ['RIC', 'Seminar Riset Mahasiswa',                         $room(0), -1, 'completed'], // sudah lewat
        ];

        foreach ($scenarios as $i => [$unitCode, $title, $roomModel, $week, $action]) {
            $this->seedOne($i, $unitCode, $title, $roomModel, $week, $action);
        }
    }

    private function seedOne(int $i, string $unitCode, string $title, Room $room, int $week, $action): void
    {
        // Pengaju = akun sekretaris demo di unit tsb (bukan akun orang sungguhan)
        $creator = User::whereHas('role', fn ($q) => $q->where('slug', 'sekretaris'))
            ->whereHas('unit', fn ($q) => $q->where('code', $unitCode))
            ->where('email', 'like', '%@student.undip.ac.id')
            ->orderBy('id')
            ->first();
        if (!$creator) {
            $this->command?->warn("Lewati '{$title}': tidak ada sekretaris di unit {$unitCode}.");
            return;
        }

        $creator->load('unit');
        $workflow = Workflow::all()->first(
            fn ($w) => strcasecmp($w->applies_to_category, $creator->unit->category) === 0
        );
        if (!$workflow) {
            $this->command?->warn("Lewati '{$title}': tidak ada workflow untuk kategori {$creator->unit->category}.");
            return;
        }

        $date = $this->saturday($week);
        [$start, $end] = $this->nextSlot($room->id, $date);

        $content = [
            'room_id' => $room->id,
            'room_code' => $room->code,
            'room_name' => $room->name,
            'booking_date' => $date,
            'start_time' => $start,
            'end_time' => $end,
            'event_name' => $title,
            'purpose' => $title,
            'ketua_pelaksana_nama' => "Ketua Pelaksana {$creator->unit->code}",
            'ketua_pelaksana_nim' => '24060' . str_pad((string) (121120100 + $i), 9, '0', STR_PAD_LEFT),
            'ketua_pelaksana_hp' => '0812' . str_pad((string) (34560000 + $i), 8, '0', STR_PAD_LEFT),
            'peminjam_nama' => $creator->name,
            'equipment' => 'Proyektor, sound system',
        ];

        $doc = Document::create([
            'workflow_id' => $workflow->id,
            'title' => "Peminjaman Ruang - {$title}",
            'content' => $content,
            'meta_data' => ['type' => 'room_reservation', 'step' => 'reservation', 'demo' => true],
            'unit_id' => $creator->unit_id,
            'creator_id' => $creator->id,
            'status' => 'DRAFT',
            'current_step_order' => 1,
        ]);
        DocumentLog::create(['document_id' => $doc->id, 'user_id' => $creator->id, 'action' => 'CREATED', 'note' => 'Dokumen dibuat']);

        RoomBooking::create([
            'document_id' => $doc->id,
            'room_id' => $room->id,
            'booked_by' => $creator->id,
            'booking_date' => $date,
            'start_time' => $start,
            'end_time' => $end,
            'purpose' => $title,
            'special_requirements' => $content['equipment'],
            'expected_participants' => min($room->capacity ?? 50, 30 + 5 * $i),
            'status' => 'PENDING',
        ]);

        // Seperti di aplikasi: pengaju men-generate executive summary & lembar
        // pengesahan sebelum mengajukan, agar approver bisa mem-preview dokumennya.
        $this->generateDocuments($doc);

        if ($action === 'draft') {
            return;
        }

        $this->documents->submitDocument($doc->fresh(), $creator);

        if (is_int($action)) {
            $this->approveTimes($doc, $action);
        } elseif ($action === 'approved' || $action === 'completed') {
            $this->approveTimes($doc, 20);
            if ($action === 'completed') {
                RoomBooking::where('document_id', $doc->id)->update(['status' => 'COMPLETED']);
            }
        } elseif (isset($action['revise_creator_after'])) {
            $this->approveTimes($doc, $action['revise_creator_after']);
            $this->engine->reviseDocument($doc->fresh(), $this->holder($doc), $creator->id, 'Mohon lengkapi rundown acara dan susunan panitia.');
        } elseif (isset($action['revise_to_ketua_after'])) {
            $this->approveTimes($doc, $action['revise_to_ketua_after']);
            $ketua = DocumentLog::where('document_id', $doc->id)->where('action', 'APPROVED')
                ->where('step_snapshot', 2)->value('user_id');
            $this->engine->reviseDocument($doc->fresh(), $this->holder($doc), $ketua, 'Mohon tinjau ulang anggaran kegiatan.');
        } elseif (isset($action['reject_after'])) {
            $this->approveTimes($doc, $action['reject_after']);
            $this->engine->rejectDocument($doc->fresh(), $this->holder($doc), 'Jadwal bertabrakan dengan agenda fakultas.');
        }
    }

    private function generateDocuments(Document $doc): void
    {
        foreach (['executive_summary' => 'file_executive_summary', 'lembar_pengesahan' => 'file_approval_sheet'] as $type => $column) {
            try {
                $path = $this->documents->generateFromTemplate($doc->fresh(['unit']), $type);
                $doc->update([$column => $path]);
            } catch (\Throwable $e) {
                $this->command?->warn("Generate {$type} untuk surat #{$doc->id} gagal: {$e->getMessage()}");
            }
        }
    }

    private function approveTimes(Document $doc, int $times): void
    {
        for ($n = 0; $n < $times; $n++) {
            $doc->refresh();
            if ($doc->status !== 'IN_PROGRESS' || !$doc->current_holder_id) {
                return;
            }
            $this->engine->approveDocument($doc, $this->holder($doc), 'Disetujui');
        }
    }

    private function holder(Document $doc): User
    {
        return User::with('role')->findOrFail($doc->fresh()->current_holder_id);
    }

    /** Sabtu ke-$week setelah batas minimal pengajuan; minggu negatif = Sabtu yang sudah lewat. */
    private function saturday(int $week): string
    {
        if ($week < 0) {
            return Carbon::today()->previous(Carbon::SATURDAY)->subWeeks(-$week - 1)->toDateString();
        }

        $d = Carbon::today()->addDays((int) config('booking.min_booking_days', 8));
        while (!$d->isSaturday()) {
            $d->addDay();
        }

        return $d->addWeeks($week)->toDateString();
    }

    /** Slot jam yang belum dipakai di ruangan & tanggal tsb (juga cek booking lain di database). */
    private function nextSlot(int $roomId, string $date): array
    {
        $slots = [['09:00', '11:00'], ['13:00', '15:00'], ['15:00', '17:00'], ['11:00', '13:00']];
        $room = Room::find($roomId);

        foreach ($slots as $k => [$start, $end]) {
            $key = "{$roomId}|{$date}|{$k}";
            if (isset($this->usedSlots[$key])) {
                continue;
            }
            if ($room->isAvailable($date, $start, $end)) {
                $this->usedSlots[$key] = true;
                return [$start, $end];
            }
        }

        throw new \RuntimeException("Tidak ada slot kosong untuk ruangan {$room->code} pada {$date}.");
    }

    // ---------------------------------------------------------------- summary

    private function printSummary(): void
    {
        $docs = Document::all()->filter(fn ($d) => ($d->meta_data['demo'] ?? false) === true);
        $byStatus = $docs->groupBy('status')->map->count()->sortKeys();

        $this->command?->info('');
        $this->command?->info('Data demo dibuat: ' . $docs->count() . ' surat');
        foreach ($byStatus as $status => $count) {
            $this->command?->line("  - {$status}: {$count}");
        }

        $this->command?->info('');
        $this->command?->info('Akun sekretaris demo untuk mencoba mengajukan:');
        User::whereHas('role', fn ($q) => $q->where('slug', 'sekretaris'))
            ->whereHas('unit', fn ($q) => $q->whereIn('category', ['HMD', 'BEM', 'SENAT', 'UKM']))
            ->where('email', 'like', '%@student.undip.ac.id')
            ->with('unit')->orderBy('unit_id')->get()
            ->unique('unit_id')
            ->each(fn ($u) => $this->command?->line("  - {$u->email}  ({$u->unit->name})"));
    }
}

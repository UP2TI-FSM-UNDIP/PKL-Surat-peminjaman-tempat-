<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RoomBooking;

class ReleaseExpiredRoomHolds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'room:release-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Release PENDING room bookings older than configured hold days';

    public function handle()
    {
        $holdDays = config('booking.hold_days', 14);
        $threshold = now()->subDays($holdDays);

        $this->info("Releasing PENDING bookings older than {$holdDays} days (before {$threshold})");

        // Hanya lepas booking yang dokumennya tidak sedang diproses
        // (mis. draft yang tidak pernah diajukan). Booking milik dokumen
        // IN_PROGRESS/REVISION tetap ditahan sampai alur persetujuan selesai.
        $expired = RoomBooking::where('status', 'PENDING')
            ->where('created_at', '<', $threshold)
            ->where(function ($q) {
                $q->whereNull('document_id')
                  ->orWhereDoesntHave('document', function ($d) {
                      $d->whereIn('status', ['IN_PROGRESS', 'REVISION']);
                  });
            })
            ->get();

        $count = $expired->count();

        foreach ($expired as $b) {
            $b->update([
                'status' => 'CANCELLED',
                'rejection_reason' => "Otomatis dibatalkan: tidak diproses lebih dari {$holdDays} hari",
            ]);
            \Log::info('[ReleaseExpiredRoomHolds] Released booking', ['booking_id' => $b->id]);
        }

        $this->info("Released {$count} bookings");

        return 0;
    }
}

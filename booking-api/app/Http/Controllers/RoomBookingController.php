<?php

namespace App\Http\Controllers;

use App\Models\RoomBooking;
use App\Models\Document;
use App\Services\RoomBookingService;
use Illuminate\Http\Request;
use App\Http\Requests\RoomBooking\StoreRoomBookingRequest;
use App\Http\Requests\RoomBooking\UpdateRoomBookingRequest;
use App\Http\Requests\RoomBooking\RejectRoomBookingRequest;
use App\Http\Requests\RoomBooking\CancelRoomBookingRequest;

class RoomBookingController extends Controller
{
    protected RoomBookingService $bookingService;

    public function __construct(RoomBookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    public function index(Request $request)
    {
        $bookings = $this->bookingService->listBookings($request->user(), $request->all());

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    public function show(Request $request, $id)
    {
        $booking = RoomBooking::with([
            'room',
            'document.workflow',
            'bookedBy.unit',
            'approvedBy',
        ])->findOrFail($id);

        if (!$this->canViewBooking($booking, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melihat booking ini',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    public function store(StoreRoomBookingRequest $request)
    {
        $user = $request->user();
        $document = null;

        try {
            $document = Document::findOrFail($request->document_id);

            $booking = $this->bookingService->createBooking($user, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Booking ruangan berhasil dibuat',
                'data' => $booking->load(['room', 'document', 'bookedBy']),
            ], 201);

        } catch (\Throwable $e) {
            // Catatan: dokumen draft yang menyertai booking ini SENGAJA tidak dihapus
            // saat booking gagal dibuat (mis. tanggal terlalu dekat, ruangan hanya
            // boleh hari tertentu, dsb). Sebelumnya kegagalan apapun langsung
            // menghapus permanen dokumen yang baru dibuat, memaksa pengguna mengisi
            // ulang seluruh form dari awal hanya karena salah pilih tanggal/ruangan.
            // Dokumen DRAFT tanpa booking tidak berbahaya dibiarkan ada — pengguna
            // tinggal memperbaiki tanggal/ruangan dan mencoba lagi dengan
            // document_id yang sama.

            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            $statusCode = $e->getCode();
            if ($statusCode < 100 || $statusCode > 599) $statusCode = 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    public function update(UpdateRoomBookingRequest $request, $id)
    {
        $booking = RoomBooking::findOrFail($id);
        $user = $request->user();

        // Authorization
        if ($booking->booked_by !== $user->id && $user->role->slug !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengupdate booking ini',
            ], 403);
        }

        // Status check
        if (in_array($booking->status, ['APPROVED', 'REJECTED', 'COMPLETED'])) {
            return response()->json([
                'success' => false,
                'message' => 'Booking dengan status ' . $booking->status . ' tidak bisa diupdate',
            ], 400);
        }

        // Jadwal/ruangan tidak boleh diubah saat dokumen sedang dalam proses
        // persetujuan, karena approver menyetujui jadwal yang tertulis di dokumen.
        // Perubahan hanya lewat revisi (dokumen DRAFT/REVISION).
        $documentStatus = $booking->document?->status;
        if ($user->role->slug !== 'admin' && $documentStatus && !in_array($documentStatus, ['DRAFT', 'REVISION'])) {
            return response()->json([
                'success' => false,
                'message' => 'Booking tidak bisa diubah karena dokumen sedang diproses (' . $documentStatus . '). Minta approver mengembalikan dokumen untuk revisi.',
            ], 400);
        }

        try {
            $booking = $this->bookingService->updateBooking($booking, $request->validated(), $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Booking berhasil diupdate',
                'data' => $booking->load(['room', 'document', 'bookedBy']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 400);
        }
    }

    public function approve(Request $request, $id)
    {
        $booking = RoomBooking::findOrFail($id);
        $user = $request->user();

        // Authorization
        if ($user->role->slug !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menyetujui booking ini',
            ], 403);
        }

        // Status check
        if ($booking->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking dengan status PENDING yang bisa disetujui',
            ], 400);
        }

        try {
            $this->bookingService->approveBooking($booking, $user);

            return response()->json([
                'success' => true,
                'message' => 'Booking berhasil disetujui',
                'data' => $booking->fresh()->load(['room', 'document', 'bookedBy', 'approvedBy']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 500);
        }
    }

    public function reject(RejectRoomBookingRequest $request, $id)
    {
        $booking = RoomBooking::findOrFail($id);
        $user = $request->user();

        // Authorization
        if ($user->role->slug !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menolak booking ini',
            ], 403);
        }

        // Status check
        if ($booking->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking dengan status PENDING yang bisa ditolak',
            ], 400);
        }

        $this->bookingService->rejectBooking($booking, $user, $request->reason);

        return response()->json([
            'success' => true,
            'message' => 'Booking ditolak',
            'data' => $booking->fresh()->load(['room', 'document', 'bookedBy', 'approvedBy']),
        ]);
    }

    public function cancel(CancelRoomBookingRequest $request, $id)
    {
        $booking = RoomBooking::findOrFail($id);
        $user = $request->user();

        // Authorization
        if ($booking->booked_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk membatalkan booking ini',
            ], 403);
        }

        // Status check
        if (in_array($booking->status, ['COMPLETED', 'REJECTED', 'CANCELLED'])) {
            return response()->json([
                'success' => false,
                'message' => 'Booking dengan status ' . $booking->status . ' tidak bisa dibatalkan',
            ], 400);
        }

        $this->bookingService->cancelBooking($booking, $request->reason);

        return response()->json([
            'success' => true,
            'message' => 'Booking berhasil dibatalkan',
            'data' => $booking->fresh()->load(['room', 'document', 'bookedBy']),
        ]);
    }

    public function complete(Request $request, $id)
    {
        $booking = RoomBooking::findOrFail($id);
        $user = $request->user();

        // Authorization
        $isAdmin = $user->role->slug === 'admin';
        $isBooker = $booking->booked_by === $user->id;

        if (!$isAdmin && !$isBooker) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menyelesaikan booking ini',
            ], 403);
        }

        // Status check
        if ($booking->status !== 'APPROVED') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking dengan status APPROVED yang bisa diselesaikan',
            ], 400);
        }

        $this->bookingService->completeBooking($booking);

        return response()->json([
            'success' => true,
            'message' => 'Booking berhasil diselesaikan',
            'data' => $booking->fresh()->load(['room', 'document', 'bookedBy']),
        ]);
    }

    public function destroy($id)
    {
        $booking = RoomBooking::findOrFail($id);
        $user = request()->user();

        // Authorization
        if ($booking->booked_by !== $user->id && $user->role->slug !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menghapus booking ini',
            ], 403);
        }

        try {
            $this->bookingService->deleteBooking($booking);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getCode() ?: 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking berhasil dihapus',
        ]);
    }

    public function statistics(Request $request)
    {
        $stats = $this->bookingService->getStatistics($request->user());

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    public function weeklyReport(Request $request)
    {
        $report = $this->bookingService->weeklyReport($request->all());

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    public function batchStore(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'document_id' => 'required|exists:documents,id',
            'bookings' => 'required|array|min:1',
            'bookings.*.room_id' => 'required|exists:rooms,id',
            'bookings.*.booking_date' => 'required|date',
            'bookings.*.start_time' => 'required|date_format:H:i',
            'bookings.*.end_time' => 'required|date_format:H:i|after:bookings.*.start_time',
            'bookings.*.purpose' => 'required|string',
            'bookings.*.special_requirements' => 'nullable|string',
            'bookings.*.expected_participants' => 'nullable|integer|min:1',
        ]);

        try {
            $result = $this->bookingService->batchCreateBookings(
                $user,
                $request->document_id,
                $request->bookings
            );

            return response()->json([
                'success' => true,
                'message' => count($result['created']) . ' booking berhasil dibuat',
                'data' => [
                    'created' => collect($result['created'])->map(fn($b) => $b->load(['room', 'document', 'bookedBy'])),
                    'errors' => $result['errors'],
                ],
            ], 201);
        } catch (\Exception $e) {
            $code = $e->getCode() ?: 500;
            if ($code < 100 || $code > 599) $code = 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }

    public function receipt(Request $request, $id)
    {
        $booking = RoomBooking::findOrFail($id);
        $user = $request->user();

        if (!$this->canViewBooking($booking, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melihat bukti peminjaman ini',
            ], 403);
        }

        $receiptData = $this->bookingService->getReceiptData($booking);

        return response()->json([
            'success' => true,
            'data' => $receiptData,
        ]);
    }

    public function qrcode(Request $request, $id)
    {
        $booking = RoomBooking::findOrFail($id);

        if (!$this->canViewBooking($booking, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke bukti peminjaman ini',
            ], 403);
        }

        if (!in_array($booking->status, ['APPROVED', 'COMPLETED'])) {
            return response()->json([
                'success' => false,
                'message' => 'QR code bukti peminjaman hanya tersedia untuk peminjaman yang sudah disetujui',
            ], 400);
        }

        $verificationUrl = $booking->verificationUrl();

        $qrCode = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('png')
            ->size(300)
            ->margin(2)
            ->errorCorrection('M')
            ->generate($verificationUrl);

        return response($qrCode, 200, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'inline; filename="bukti-peminjaman-' . $booking->id . '.png"',
            'Cache-Control' => 'private, max-age=3600',
            'X-Verification-Url' => $verificationUrl,
        ]);
    }

    /**
     * Halaman verifikasi publik (tujuan QR code). Tidak butuh login, tetapi
     * wajib membawa token HMAC yang hanya ada di QR code. Hanya mengembalikan
     * data yang diperlukan untuk memverifikasi peminjaman (tanpa data pribadi).
     */
    public function verify(Request $request, $id)
    {
        $booking = RoomBooking::with(['room', 'bookedBy.unit', 'approvedBy', 'document'])->find($id);

        if (!$booking || !$booking->isValidVerificationToken($request->query('token'))) {
            return response()->json([
                'success' => false,
                'message' => 'Bukti peminjaman tidak valid atau tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $booking->id,
                'status' => $booking->status,
                'room' => $booking->room ? [
                    'name' => $booking->room->name,
                    'code' => $booking->room->code,
                ] : null,
                'booking_date' => $booking->booking_date->toDateString(),
                'day' => $booking->booking_date->translatedFormat('l'),
                'start_time' => substr($booking->start_time, 0, 5),
                'end_time' => substr($booking->end_time, 0, 5),
                'purpose' => $booking->purpose,
                'event_name' => $booking->document?->content['event_name'] ?? null,
                'unit' => $booking->bookedBy?->unit?->name,
                'approved_by' => $booking->approvedBy?->name,
                'approved_at' => $booking->approved_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Siapa yang boleh melihat detail / bukti / QR booking: peminjam, admin,
     * sumber daya, approver booking, atau pihak yang punya akses ke dokumennya.
     */
    private function canViewBooking(RoomBooking $booking, $user): bool
    {
        return $booking->booked_by === $user->id
            || in_array($user->role?->slug, ['admin', 'sumber-daya'])
            || $booking->approved_by === $user->id
            || ($booking->document && app(\App\Services\DocumentService::class)->checkDocumentAccess($booking->document, $user));
    }
}

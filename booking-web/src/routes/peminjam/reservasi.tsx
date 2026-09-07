import { createFileRoute } from '@tanstack/react-router';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button/button';
import { useReservation } from '@/hooks/useReservation';
import { ReservationForm } from '@/features/bookings/ReservationForm';
import { BookingScheduleTable } from '@/features/bookings/BookingScheduleTable';
import { RoomDetailModal } from '@/features/bookings/RoomDetailModal';

export const Route = createFileRoute('/peminjam/reservasi')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      roomId: search.roomId as number | undefined,
      roomCode: search.roomCode as string | undefined,
      bookingDate: search.bookingDate as string | undefined,
      startTime: search.startTime as string | undefined,
      endTime: search.endTime as string | undefined,
      purpose: search.purpose as string | undefined,
      ketuaNama: search.ketuaNama as string | undefined,
      ketuaNim: search.ketuaNim as string | undefined,
      ketuaHp: search.ketuaHp as string | undefined,
    };
  },
});

function RouteComponent() {
  const searchParams = Route.useSearch();
  const reservation = useReservation(searchParams);

  // Full-screen loading state (only when rooms are loading initially)
  if (reservation.isLoadingRooms && !reservation.showRoomDetails) {
    return (
      <div className='p-6 flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <div className='text-lg font-semibold text-gray-700'>
            Memuat data...
          </div>
        </div>
      </div>
    );
  }

  // Full-screen error state
  if (reservation.roomsError && !reservation.showRoomDetails) {
    return (
      <div className='p-6 flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <div className='text-lg font-semibold text-red-600 mb-4'>
            {reservation.roomsError}
          </div>
          <Button onClick={() => reservation.refetchRooms()}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Room Selector */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-3'>
        <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center'>
          <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center w-fit'>
            <Select
              value={reservation.selectedRoomId?.toString()}
              onValueChange={(value) => reservation.selectRoom(Number(value))}
            >
              <SelectTrigger className='w-full sm:w-64'>
                <SelectValue placeholder='Pilih ruangan...' />
              </SelectTrigger>
              <SelectContent>
                {reservation.rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    {room.code} - {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={reservation.searchRoom}
              disabled={!reservation.selectedRoomId || reservation.isLoadingDetails}
            >
              {reservation.isLoadingDetails ? 'Memuat...' : 'Cari'}
            </Button>
          </div>
        </div>
      </div>

      {/* Room Details + Schedule */}
      {reservation.showRoomDetails && reservation.selectedRoom && (
        <div className='flex flex-col lg:flex-row gap-6'>
          <ReservationForm
            room={reservation.selectedRoom}
            form={reservation.form}
            updateForm={reservation.updateForm}
            validation={reservation.validation}
            availability={reservation.availability}
            onSubmit={reservation.handleSubmit}
            isSubmitting={reservation.isSubmitting}
            formError={reservation.formError}
            submitError={reservation.submitError}
            successMessage={reservation.successMessage}
            onShowRoomDetail={() => reservation.setShowRoomDetailModal(true)}
          />

          <BookingScheduleTable
            roomCode={reservation.selectedRoom.code}
            bookings={reservation.bookings}
            isLoading={reservation.isLoadingSchedule}
          />
        </div>
      )}

      {/* Room Detail Modal */}
      <RoomDetailModal
        open={reservation.showRoomDetailModal}
        onOpenChange={reservation.setShowRoomDetailModal}
        room={reservation.selectedRoom}
      />
    </div>
  );
}

export default RouteComponent;

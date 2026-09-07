import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import { roomService } from '@/services/room.service';
import { documentService } from '@/services/document.service';
import { authService } from '@/services/auth.service';
import { BookingForm } from '@/features/bookings/BookingForm';
import type { ReservationContent } from '@/types/booking';
import type { UserShort } from '@/types/document';

export const Route = createFileRoute('/peminjam/pinjam/detail-tempat')({
  validateSearch: (search: Record<string, unknown>) => ({
    editId: Number(search.editId) || undefined,
    roomId: search.roomId ? Number(search.roomId) : undefined,
    bookingDate: search.bookingDate as string | undefined,
    startTime: search.startTime as string | undefined,
    endTime: search.endTime as string | undefined,
    purpose: search.purpose as string | undefined,
    ketuaNama: search.ketuaNama as string | undefined,
    ketuaNim: search.ketuaNim as string | undefined,
    ketuaHp: search.ketuaHp as string | undefined,
  }),
  beforeLoad: async () => {
    try {
      await authService.getUser();
    } catch (error) {
      throw redirect({ to: '/' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const { editId } = searchParams;

  // FETCH CURRENT USER
  const {
    data: currentUser,
    isLoading: authLoading,
  } = useQuery<UserShort>({
    queryKey: ['current-user'],
    queryFn: () => authService.getUser(),
    retry: false,
  });

  // FETCH ROOMS
  const {
    data: rooms = [],
    isLoading: loadingRooms,
    isError: isRoomsError,
    refetch: refetchRooms,
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomService.getRooms({ status: 'ACTIVE' }),
  });

  // FETCH DOCUMENT (Edit Mode)
  const {
    data: existingDoc,
    isLoading: loadingDoc,
    isError: isDocError,
  } = useQuery({
    queryKey: ['document', editId],
    queryFn: () => documentService.getDocument(editId!),
    enabled: !!editId && !!currentUser,
  });

  // ACCESS AUTHORIZATION (derived)
  const accessError = useMemo(() => {
    if (!editId || !existingDoc || !currentUser) return null;

    const isOwner = existingDoc.creator_id === currentUser.id;
    const isCurrentHolder = existingDoc.current_holder_id === currentUser.id;
    const isAdmin = currentUser.role?.slug === 'admin';

    if (!isOwner && !isCurrentHolder && !isAdmin) {
      return 'Anda tidak memiliki akses untuk mengedit dokumen ini. Hanya pemilik dokumen atau approver yang sedang memegang dokumen yang dapat melakukan edit.';
    }
    if (existingDoc.status && !['DRAFT', 'REVISION'].includes(existingDoc.status)) {
      return 'Dokumen sudah tidak dapat diedit. Dokumen hanya dapat diedit dengan status DRAFT atau REVISION.';
    }
    return null;
  }, [editId, existingDoc, currentUser]);

  // --- LOADING ---
  if (authLoading || loadingRooms || loadingDoc) {
    return (
      <div className='p-6 flex justify-center items-center min-h-screen'>
        <div className='text-center text-gray-600'>Memuat data...</div>
      </div>
    );
  }

  // --- ACCESS ERROR ---
  if (accessError) {
    return (
      <div className='p-6 flex justify-center items-center min-h-screen'>
        <div className='text-center max-w-md'>
          <div className='text-red-600 mb-4'>
            <AlertCircle className='w-12 h-12 mx-auto mb-3' />
            <h3 className='font-semibold mb-2'>Akses Ditolak</h3>
            <p className='text-sm'>{accessError}</p>
          </div>
          <Button onClick={() => navigate({ to: '/peminjam/pinjam', search: { status: 'ALL' } })}>
            Kembali ke Daftar Peminjaman
          </Button>
        </div>
      </div>
    );
  }

  // --- FETCH ERROR ---
  if (isRoomsError || isDocError) {
    return (
      <div className='p-6 flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <AlertCircle className='w-12 h-12 text-red-400 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-gray-700 mb-2'>
            Gagal Memuat Data
          </h3>
          <p className='text-sm text-gray-500 mb-4'>
            Terjadi kesalahan saat memuat data. Silakan coba lagi.
          </p>
          <Button onClick={() => refetchRooms()} variant='outline'>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // --- RENDER FORM ---
  return (
    <BookingForm
      key={editId || 'new'}
      rooms={rooms}
      initialData={
        existingDoc
          ? (existingDoc.content as unknown as ReservationContent)
          : undefined
      }
      searchParams={searchParams}
      editId={editId}
      existingDocument={existingDoc}
    />
  );
}

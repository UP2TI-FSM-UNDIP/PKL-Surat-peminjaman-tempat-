import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { roomService, type RoomBooking } from '@/services/room.service';

export type PeminjamanSearch = {
    status: string;
    search: string;
};

export function useAdminBookings(fullPath: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { status, search } = useSearch({ from: fullPath as any }) as PeminjamanSearch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigate = useNavigate({ from: fullPath as any });
    const queryClient = useQueryClient();

    // Modals state
    const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState<RoomBooking | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Queries
    const { data: bookings = [], isLoading, isError, refetch } = useQuery<RoomBooking[], AxiosError>({
        queryKey: ['bookings'],
        queryFn: () => roomService.getBookings(),
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (id: number) => roomService.deleteBooking(id),
        onSuccess: () => {
            toast.success('Peminjaman berhasil dihapus');
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            setIsDeleteDialogOpen(false);
            if (selectedBooking) {
                setIsDetailOpen(false);
                setSelectedBooking(null);
            }
        },
        onError: (err: AxiosError<{ message: string }>) => {
            const message = err.response?.data?.message || 'Gagal menghapus peminjaman';
            toast.error(message);
        },
    });

    // Filter logic
    const filteredBookings = useMemo(() => {
        return bookings.filter((item: RoomBooking) => {
            // Status filter
            if (status !== 'ALL' && item.status !== status) return false;

            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                const unitCode = item.booked_by_user?.unit_code || item.bookedBy?.unit?.code || '';
                const borrowerName = item.booked_by_user?.name || item.bookedBy?.name || '';
                const roomName = item.room?.code || item.room?.name || '';

                return [
                    unitCode,
                    borrowerName,
                    roomName,
                    item.booking_date,
                    item.purpose || '',
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(searchLower);
            }
            return true;
        });
    }, [bookings, status, search]);

    // Handlers
    const handleStatusChange = (newStatus: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const navOptions: any = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            search: (prev: any) => ({ ...prev, status: newStatus }),
        };
        navigate(navOptions);
    };

    const handleSearchChange = (newSearch: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const navOptions: any = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            search: (prev: any) => ({ ...prev, search: newSearch }),
        };
        navigate(navOptions);
    };

    const handleDetail = (booking: RoomBooking) => {
        setSelectedBooking(booking);
        setIsDetailOpen(true);
    };

    const handleDeleteClick = (booking: RoomBooking) => {
        setBookingToDelete(booking);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (bookingToDelete) {
            deleteMutation.mutate(bookingToDelete.id);
        }
    };

    return {
        // State
        status,
        search,
        bookings,
        filteredBookings,
        isLoading,
        isError,
        isDeleting: deleteMutation.isPending,
        selectedBooking,
        isDetailOpen,
        isDeleteDialogOpen,
        bookingToDelete,

        // Actions
        refetch,
        handleStatusChange,
        handleSearchChange,
        handleDetail,
        handleDeleteClick,
        confirmDelete,
        setIsDetailOpen,
        setIsDeleteDialogOpen
    };
}

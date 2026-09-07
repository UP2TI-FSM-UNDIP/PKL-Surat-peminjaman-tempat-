import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button/button';
import {
    useAdminBookings,
    BookingTable,
    BookingDetailModal,
    DeleteConfirmationDialog
} from '@/features/admin-peminjaman';

type PeminjamanSearch = {
    status: string;
    search: string;
};

export const Route = createFileRoute('/admin/peminjaman')({
    validateSearch: (search: Record<string, unknown>): PeminjamanSearch => {
        return {
            status: (search.status as string) || 'ALL',
            search: (search.search as string) || '',
        };
    },
    component: RouteComponent,
});

function RouteComponent() {
    const {
        status,
        search,
        bookings,
        filteredBookings,
        isLoading,
        isError,
        isDeleting,
        selectedBooking,
        isDetailOpen,
        isDeleteDialogOpen,
        bookingToDelete,
        handleStatusChange,
        handleSearchChange,
        handleDetail,
        handleDeleteClick,
        confirmDelete,
        setIsDetailOpen,
        setIsDeleteDialogOpen,
        refetch
    } = useAdminBookings(Route.fullPath);

    const getStatusBadge = (statusStr: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
            CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
            COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
        };
        const config = statusConfig[statusStr] || statusConfig.PENDING;
        return (
            <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    if (isError) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <div className='text-center'>
                    <p className='text-red-600 mb-4 font-semibold'>Gagal memuat data peminjaman</p>
                    <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded">Coba Lagi</button>
                </div>
            </div>
        );
    }

    return (
        <div className='container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-7xl'>
            {/* Header */}
            <div className='mb-4 sm:mb-6'>
                <h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2'>
                    Daftar Peminjaman Ruangan
                </h1>
                <p className='text-sm sm:text-base text-gray-600'>
                    Kelola data peminjaman ruangan
                </p>
            </div>

            {/* Actions Bar */}
            <div className='space-y-3 mb-4 sm:mb-6'>
                <div className='flex items-center gap-2 w-full'>
                    <div className='relative flex-1'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <Input
                            type='text'
                            placeholder='Cari peminjaman...'
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className='pl-10 text-sm h-11 border-gray-200 focus:ring-blue-500 rounded-xl shadow-sm w-full bg-white'
                        />
                    </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                    {[
                        { value: 'ALL', label: 'Semua Status' },
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'APPROVED', label: 'Approved' },
                    ].map((item) => {
                        const isActive = status === item.value;
                        const baseStyles = "px-3 py-1.5 h-auto text-xs sm:text-sm rounded-full transition-all duration-200 border";

                        const activeStyles: Record<string, string> = {
                            ALL: "bg-blue-600 border-blue-600 text-white shadow-md hover:bg-blue-700",
                            PENDING: "bg-yellow-500 border-yellow-500 text-white shadow-md hover:bg-yellow-600",
                            APPROVED: "bg-green-600 border-green-600 text-white shadow-md hover:bg-green-700",
                        };

                        const inactiveStyles = "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300";

                        return (
                            <Button
                                key={item.value}
                                variant='outline'
                                onClick={() => handleStatusChange(item.value)}
                                className={`${baseStyles} ${isActive ? activeStyles[item.value] : inactiveStyles}`}
                            >
                                {item.label}
                                {isActive && <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Table Section */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative'>
                {/* Loading Overlay */}
                {isLoading && (
                    <div className='absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center'>
                        <div className='bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-gray-100'>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                            <span className='text-xs font-medium text-gray-600'>Memperbarui data...</span>
                        </div>
                    </div>
                )}

                <div className='overflow-x-auto'>
                    <BookingTable
                        bookings={filteredBookings}
                        onDetail={handleDetail}
                        onDelete={handleDeleteClick}
                        isDeleting={isDeleting}
                        deletingId={bookingToDelete?.id ?? null}
                        statusBadge={getStatusBadge}
                        search={search}
                        statusFilter={status}
                    />
                </div>
            </div>

            {/* Footer Info */}
            <div className='mt-4 flex items-center justify-between bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm'>
                <div className='text-xs sm:text-sm text-gray-600 font-medium'>
                    Menampilkan{' '}
                    <span className='font-bold text-blue-600'>{filteredBookings.length}</span>{' '}
                    dari <span className='font-bold text-blue-600'>{bookings.length}</span> entri
                </div>
            </div>

            {/* Modals */}
            <BookingDetailModal
                isOpen={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                booking={selectedBooking}
                onDeleteClick={handleDeleteClick}
                isDeleting={isDeleting}
                statusBadge={getStatusBadge}
            />

            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}

export default RouteComponent;

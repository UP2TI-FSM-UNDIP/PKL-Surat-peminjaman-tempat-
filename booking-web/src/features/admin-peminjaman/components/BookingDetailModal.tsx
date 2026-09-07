import React from 'react';
import { Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button/button';
import type { RoomBooking } from '@/services/room.service';

interface BookingDetailModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    booking: RoomBooking | null;
    onDeleteClick: (booking: RoomBooking) => void;
    isDeleting: boolean;
    statusBadge: (status: string) => React.ReactNode;
}

export function BookingDetailModal({
    isOpen,
    onOpenChange,
    booking,
    onDeleteClick,
    isDeleting,
    statusBadge
}: BookingDetailModalProps) {
    if (!booking) return null;

    const unitCode = booking.booked_by_user?.unit_code || booking.bookedBy?.unit?.code || '-';
    const borrowerName = booking.booked_by_user?.name || booking.bookedBy?.name || '-';
    const roomName = booking.room?.code || booking.room?.name || '-';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-125'>
                <DialogHeader>
                    <DialogTitle>Detail Peminjaman</DialogTitle>
                    <DialogDescription>
                        Informasi lengkap tentang peminjaman ruangan
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <p className='text-sm font-medium text-gray-500'>ID Booking</p>
                            <p className='text-sm text-gray-900'>{booking.id}</p>
                        </div>
                        <div>
                            <p className='text-sm font-medium text-gray-500'>Status</p>
                            {statusBadge(booking.status)}
                        </div>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Ruangan</p>
                        <p className='text-sm text-gray-900'>{roomName}</p>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Kode Unit</p>
                        <p className='text-sm text-gray-900'>{unitCode}</p>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Nama Peminjam</p>
                        <p className='text-sm text-gray-900'>{borrowerName}</p>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Tanggal</p>
                        <p className='text-sm text-gray-900'>
                            {new Date(booking.booking_date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Waktu</p>
                        <p className='text-sm text-gray-900'>
                            {booking.start_time} - {booking.end_time}
                        </p>
                    </div>
                    <div>
                        <p className='text-sm font-medium text-gray-500'>Keperluan</p>
                        <p className='text-sm text-gray-900'>{booking.purpose || '-'}</p>
                    </div>
                    {booking.document && (
                        <div>
                            <p className='text-sm font-medium text-gray-500'>Dokumen</p>
                            <p className='text-sm text-gray-900'>{booking.document.title || '-'}</p>
                        </div>
                    )}
                    {booking.status !== 'APPROVED' && (
                        <div className='pt-2 border-t'>
                            <Button
                                variant='destructive'
                                size='sm'
                                onClick={() => onDeleteClick(booking)}
                                disabled={isDeleting}
                                className='w-full'
                            >
                                <Trash2 className='w-4 h-4 mr-2' />
                                Hapus Peminjaman
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

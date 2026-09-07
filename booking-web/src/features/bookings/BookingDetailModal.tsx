'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { RoomBooking } from '@/services/booking.service';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: RoomBooking | null;
}

const statusMap = {
  approved: { text: 'Disetujui', variant: 'success' },
  pending: { text: 'Menunggu', variant: 'warning' },
  rejected: { text: 'Ditolak', variant: 'destructive' },
  cancelled: { text: 'Dibatalkan', variant: 'secondary' },
  completed: { text: 'Selesai', variant: 'default' },
} as const;

export function BookingDetailModal({ open, onOpenChange, booking }: Props) {
  if (!booking) return null;

  // Format date
  const formattedDate = new Date(booking.booking_date).toLocaleDateString(
    'id-ID',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );

  // Format time range
  const timeRange = `${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)}`;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 bg-black/50 z-40' />

        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 w-[95%] max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50',
            'focus:outline-none',
            'flex flex-col',
          )}
        >
          <div className='flex items-start justify-between gap-4 p-6 md:p-8 pb-4 shrink-0'>
            <div>
              <Dialog.Title className='text-lg font-semibold'>
                Detail Peminjaman
              </Dialog.Title>
              <Dialog.Description className='text-sm text-gray-500'>
                Informasi detail permintaan peminjaman ruang
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className='rounded p-1 text-gray-600 hover:text-gray-900 -mt-1 -mr-1'>
                <X className='w-5 h-5' />
              </button>
            </Dialog.Close>
          </div>

          <div className='overflow-y-auto px-6 md:px-8 flex-1'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6'>
              <DetailRow label='Tujuan / Kegiatan' className='sm:col-span-2'>
                {booking.purpose}
              </DetailRow>

              {booking.room && (
                <DetailRow label='Ruangan' className='sm:col-span-2'>
                  {booking.room.name}
                  {booking.room.capacity &&
                    ` (Kapasitas: ${booking.room.capacity} orang)`}
                </DetailRow>
              )}

              <DetailRow label='Tanggal'>{formattedDate}</DetailRow>
              <DetailRow label='Waktu'>{timeRange}</DetailRow>

              {booking.expected_participants && (
                <DetailRow label='Jumlah Peserta'>
                  {booking.expected_participants} orang
                </DetailRow>
              )}

              <DetailRow label='Status'>
                <BookingStatus status={booking.status} />
              </DetailRow>

              {booking.special_requirements && (
                <DetailRow label='Kebutuhan Khusus' className='sm:col-span-2'>
                  {booking.special_requirements}
                </DetailRow>
              )}

              {booking.rejection_reason && (
                <DetailRow label='Alasan Penolakan' className='sm:col-span-2'>
                  <span className='text-red-600'>{booking.rejection_reason}</span>
                </DetailRow>
              )}

              {booking.booked_by_user && (
                <DetailRow label='Peminjam'>
                  {booking.booked_by_user.name}
                </DetailRow>
              )}

              {booking.document && (
                <DetailRow label='Dokumen Terkait'>
                  {booking.document.title}
                </DetailRow>
              )}
            </div>
          </div>

          <div className='p-6 md:p-8 pt-4 flex justify-end gap-2 shrink-0 border-t'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='w-full md:w-auto'
            >
              Tutup
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-3 bg-gray-50/80 rounded border',
        className,
      )}
    >
      <div className='text-xs text-gray-500'>{label}</div>
      <div className='text-sm font-semibold text-gray-900 wrap-break-words'>
        {children}
      </div>
    </div>
  );
}

function BookingStatus({
  status,
}: {
  status: string;
}) {
  // Normalize status ke lowercase untuk matching
  const normalizedStatus = status?.toLowerCase() as keyof typeof statusMap;
  const statusInfo = statusMap[normalizedStatus] || {
    text: status || 'Unknown',
    variant: 'secondary',
  };

  const { text, variant } = statusInfo;

  return (
    <Badge
      variant={
        variant as
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning'
      }
    >
      {text}
    </Badge>
  );
}

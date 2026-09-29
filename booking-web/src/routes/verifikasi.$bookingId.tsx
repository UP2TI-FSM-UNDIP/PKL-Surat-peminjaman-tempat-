import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, DoorOpen, Users, BadgeCheck, ShieldX, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import api from '@/lib/axios';

/**
 * Halaman verifikasi bukti peminjaman ruang (tujuan QR code).
 * Publik — tidak perlu login, tetapi URL wajib membawa token dari QR code.
 */
export const Route = createFileRoute('/verifikasi/$bookingId')({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: VerifikasiPeminjamanPage,
});

interface VerifiedBooking {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  room: { name: string; code: string } | null;
  booking_date: string;
  day: string;
  start_time: string;
  end_time: string;
  purpose: string;
  event_name: string | null;
  unit: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

const STATUS_INFO: Record<VerifiedBooking['status'], { label: string; valid: boolean; className: string }> = {
  APPROVED: { label: 'Disetujui', valid: true, className: 'bg-green-100 text-green-800 border-green-200' },
  COMPLETED: { label: 'Selesai', valid: true, className: 'bg-blue-100 text-blue-800 border-blue-200' },
  PENDING: { label: 'Menunggu Persetujuan', valid: false, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  REJECTED: { label: 'Ditolak', valid: false, className: 'bg-red-100 text-red-800 border-red-200' },
  CANCELLED: { label: 'Dibatalkan', valid: false, className: 'bg-gray-100 text-gray-700 border-gray-200' },
};

function formatTanggal(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function VerifikasiPeminjamanPage() {
  const { bookingId } = Route.useParams();
  const { token } = Route.useSearch();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verifikasi-peminjaman', bookingId, token],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: VerifiedBooking }>(
        `/room-bookings/${bookingId}/verify`,
        { params: { token } },
      );
      return res.data.data;
    },
    enabled: Boolean(token),
    retry: false,
  });

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md bg-white rounded-xl shadow-md border overflow-hidden'>
        <div className='flex items-center gap-3 px-6 py-4 border-b bg-gray-900 text-white'>
          <img
            src={`${import.meta.env.BASE_URL}android-chrome-192x192.png`}
            alt='Logo Universitas Diponegoro'
            className='h-10 w-10'
          />
          <div>
            <p className='text-sm font-semibold leading-tight'>Bukti Peminjaman Ruang</p>
            <p className='text-xs text-gray-300'>Fakultas Sains dan Matematika UNDIP</p>
          </div>
        </div>

        <div className='p-6'>
          {isLoading && (
            <div className='flex flex-col items-center gap-2 py-10 text-gray-500'>
              <Loader2 className='h-6 w-6 animate-spin' />
              <p className='text-sm'>Memeriksa bukti peminjaman...</p>
            </div>
          )}

          {(!token || isError) && !isLoading && (
            <div className='flex flex-col items-center text-center gap-3 py-8'>
              <ShieldX className='h-12 w-12 text-red-500' />
              <h1 className='text-lg font-semibold text-gray-900'>Bukti Peminjaman Tidak Valid</h1>
              <p className='text-sm text-gray-600'>
                QR code tidak dikenali atau tautan tidak lengkap. Pastikan Anda memindai QR code asli
                dari bukti peminjaman.
              </p>
            </div>
          )}

          {data && <VerifiedDetail booking={data} />}
        </div>

        <div className='px-6 py-3 border-t bg-gray-50 text-center'>
          <Link to='/' className='text-xs text-gray-500 hover:text-gray-800'>
            Sistem Peminjaman Ruang FSM UNDIP
          </Link>
        </div>
      </div>
    </div>
  );
}

function VerifiedDetail({ booking }: { booking: VerifiedBooking }) {
  const status = STATUS_INFO[booking.status] ?? STATUS_INFO.CANCELLED;

  return (
    <div className='space-y-5'>
      <div className='flex flex-col items-center text-center gap-2'>
        {status.valid ? (
          <BadgeCheck className='h-12 w-12 text-green-600' />
        ) : (
          <ShieldX className='h-12 w-12 text-yellow-600' />
        )}
        <span className={`inline-flex px-3 py-1 rounded-full border text-sm font-semibold ${status.className}`}>
          {status.label}
        </span>
        <p className='text-xs text-gray-500'>No. Peminjaman #{booking.id}</p>
      </div>

      <dl className='space-y-3 text-sm'>
        <Row icon={<DoorOpen className='h-4 w-4' />} label='Ruangan'>
          {booking.room ? `${booking.room.name} (${booking.room.code})` : '-'}
        </Row>
        <Row icon={<CalendarDays className='h-4 w-4' />} label='Tanggal'>
          {formatTanggal(booking.booking_date)}
        </Row>
        <Row icon={<Clock className='h-4 w-4' />} label='Waktu'>
          {booking.start_time} – {booking.end_time} WIB
        </Row>
        <Row icon={<Users className='h-4 w-4' />} label='Peminjam'>
          {booking.unit ?? '-'}
        </Row>
        <Row label='Kegiatan'>{booking.event_name || booking.purpose}</Row>
        {booking.approved_by && (
          <Row label='Disetujui oleh'>
            {booking.approved_by}
            {booking.approved_at && (
              <span className='block text-xs font-normal text-gray-500'>
                {new Date(booking.approved_at).toLocaleString('id-ID', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </span>
            )}
          </Row>
        )}
      </dl>
    </div>
  );
}

function Row({ icon, label, children }: { icon?: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className='flex gap-3 rounded-lg border bg-gray-50/80 p-3'>
      <div className='mt-0.5 text-gray-400 w-4 shrink-0'>{icon}</div>
      <div className='min-w-0'>
        <dt className='text-xs text-gray-500'>{label}</dt>
        <dd className='font-semibold text-gray-900 wrap-break-word'>{children}</dd>
      </div>
    </div>
  );
}

import { Eye, Trash2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button/button';
import type { RoomBooking } from '@/services/room.service';

interface BookingTableProps {
    bookings: RoomBooking[];
    onDetail: (booking: RoomBooking) => void;
    onDelete: (booking: RoomBooking) => void;
    isDeleting: boolean;
    deletingId: number | null;
    statusBadge: (status: string) => React.ReactNode;
    search: string;
    statusFilter: string;
}

export function BookingTable({
    bookings,
    onDetail,
    onDelete,
    isDeleting,
    deletingId,
    statusBadge,
    search,
    statusFilter
}: BookingTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className='w-8 sm:w-12.5 text-center text-[10px] md:text-sm px-1 py-1.5 sm:px-4 sm:py-3'>
                        No
                    </TableHead>
                    <TableHead className='text-[10px] md:text-sm px-1 py-1.5 sm:px-4 sm:py-3'>Kode Unit</TableHead>
                    <TableHead className='text-[10px] md:text-sm px-1 py-1.5 sm:px-4 sm:py-3'>Nama Peminjam</TableHead>
                    <TableHead className='hidden sm:table-cell text-[10px] md:text-sm px-1 py-1.5 sm:px-4 sm:py-3'>Ruangan</TableHead>
                    <TableHead className='hidden md:table-cell text-[10px] md:text-sm px-1 py-1.5 sm:px-4 sm:py-3'>Tanggal</TableHead>
                    <TableHead className='hidden lg:table-cell text-[10px] md:text-sm px-1 py-1.5 sm:px-4 sm:py-3'>Waktu</TableHead>
                    <TableHead className='text-[10px] md:text-sm px-1 py-1.5 sm:px-4 sm:py-3'>Status</TableHead>
                    <TableHead className='text-center text-[10px] md:text-sm w-20 sm:w-auto px-1 py-1.5 sm:px-4 sm:py-3'>
                        Aksi
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bookings.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className='text-center text-gray-500 h-32'>
                            {search || statusFilter !== 'ALL'
                                ? 'Tidak ada peminjaman yang sesuai dengan filter'
                                : 'Belum ada data peminjaman'}
                        </TableCell>
                    </TableRow>
                ) : (
                    bookings.map((item, index) => (
                        <TableRow key={item.id}>
                            <TableCell className='font-medium text-center text-[10px] md:text-sm px-1 py-1.5 sm:px-4 sm:py-3'>
                                {index + 1}
                            </TableCell>
                            <TableCell className='text-[10px] md:text-sm text-gray-500 px-1 py-1.5 sm:px-4 sm:py-3'>
                                {item.booked_by_user?.unit_code || item.bookedBy?.unit?.code || '-'}
                            </TableCell>
                            <TableCell className='text-[10px] md:text-sm font-medium text-gray-900 px-1 py-1.5 sm:px-4 sm:py-3'>
                                <div>{item.booked_by_user?.name || item.bookedBy?.name || '-'}</div>
                                <div className='sm:hidden text-[10px] text-gray-500 mt-0.5 line-clamp-1'>
                                    {item.room?.code || item.room?.name || '-'}
                                </div>
                            </TableCell>
                            <TableCell className='hidden sm:table-cell text-[10px] md:text-sm text-gray-500 px-1 py-1.5 sm:px-4 sm:py-3'>
                                {item.room?.code || item.room?.name || '-'}
                            </TableCell>
                            <TableCell className='hidden md:table-cell text-[10px] md:text-sm text-gray-500 px-1 py-1.5 sm:px-4 sm:py-3'>
                                {new Date(item.booking_date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </TableCell>
                            <TableCell className='hidden lg:table-cell text-[10px] md:text-sm text-gray-500 px-1 py-1.5 sm:px-4 sm:py-3'>
                                {item.start_time} - {item.end_time}
                            </TableCell>
                            <TableCell className='px-1 py-1.5 sm:px-4 sm:py-3 text-[10px] md:text-sm'>
                                {statusBadge(item.status)}
                            </TableCell>
                            <TableCell className='px-1 py-1.5 sm:px-4 sm:py-3'>
                                <div className='flex items-center justify-center gap-1 sm:gap-2'>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={() => onDetail(item)}
                                        className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                                        title='Lihat Detail'
                                    >
                                        <Eye className='h-3.5 w-3.5 md:h-4 md:w-4' />
                                    </Button>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={() => onDelete(item)}
                                        disabled={(isDeleting && deletingId === item.id) || item.status === 'APPROVED'}
                                        className='h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                                        title={item.status === 'APPROVED' ? 'Tidak bisa hapus yang sudah approved' : 'Hapus'}
                                    >
                                        <Trash2 className={`h-3.5 w-3.5 md:h-4 md:w-4 ${item.status === 'APPROVED' ? 'text-gray-300' : ''}`} />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}

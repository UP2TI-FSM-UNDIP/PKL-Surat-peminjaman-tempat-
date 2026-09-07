import { useState } from 'react';
import type { RoomBooking } from '@/services/room.service';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';

interface BookingScheduleTableProps {
    roomCode: string;
    bookings: RoomBooking[];
    isLoading?: boolean;
}

export function BookingScheduleTable({
    roomCode,
    bookings,
    isLoading,
}: BookingScheduleTableProps) {
    const [search, setSearch] = useState('');

    const filteredBookings = bookings.filter((item) =>
        [
            item.booked_by_user?.name || item.bookedBy?.name || '',
            item.booking_date,
            `${item.start_time} - ${item.end_time}`,
        ]
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase()),
    );

    return (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 lg:w-[62.5%]'>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-3'>
                <h2 className='text-lg font-semibold text-gray-900'>
                    Jadwal Peminjaman Ruang {roomCode}
                </h2>
                <div className='flex items-center gap-2 text-sm'>
                    <span className='text-gray-700'>Search:</span>
                    <Input
                        className='w-40'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder='Cari...'
                    />
                </div>
            </div>

            <div className='border border-gray-200 rounded-lg overflow-hidden'>
                <div className='overflow-x-auto'>
                    <Table className='min-w-full text-sm'>
                        <TableHeader>
                            <TableRow>
                                <TableHead className='w-12 text-center'>No</TableHead>
                                <TableHead>Nama Peminjam</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Waktu</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className='text-center text-gray-500 py-8'
                                    >
                                        Memuat jadwal...
                                    </TableCell>
                                </TableRow>
                            ) : filteredBookings.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className='text-center text-gray-500 py-8'
                                    >
                                        Tidak ada booking yang ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookings.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell className='text-center'>{index + 1}</TableCell>
                                        <TableCell>
                                            {item.booked_by_user?.name ||
                                                item.bookedBy?.name ||
                                                '-'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(item.booking_date).toLocaleDateString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            {item.start_time} - {item.end_time}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={item.status} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

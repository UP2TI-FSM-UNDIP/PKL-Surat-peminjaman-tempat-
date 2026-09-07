import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { AxiosError } from 'axios';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { roomService, type Room, type RoomBooking } from '@/services/room.service';
import { documentService } from '@/services/document.service';

export const Route = createFileRoute('/sumber-daya/tambah-peminjaman')({
	component: RouteComponent,
});

function RouteComponent() {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [selectedRoom, setSelectedRoom] = useState<string>('');
	const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);
	const [search, setSearch] = useState('');
	const [showRoomDetails, setShowRoomDetails] = useState(false);
	const [loading, setLoading] = useState(false);

	const [borrowerId, setBorrowerId] = useState('');
	const [borrowerName, setBorrowerName] = useState('');
	const [startTime, setStartTime] = useState('');
	const [endTime, setEndTime] = useState('');
	// Default: awal bulan ini sampai akhir bulan ini
	const now = new Date();
	const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
	const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [activity, setActivity] = useState('');

	useEffect(() => {
		fetchRooms();
	}, []);

	const fetchRooms = async () => {
		try {
			const data = await roomService.getRooms({ status: 'ACTIVE' });
			setRooms(data);
			if (data.length > 0 && !selectedRoom) {
				setSelectedRoom(data[0].code);
			}
		} catch (err) {
			console.error('Failed to fetch rooms:', err);
		}
	};

	const getStatusBadge = (status: RoomBooking['status']) => {
		const statusConfig = {
			PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
			APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
			REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
			CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
			COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
		};
		const config = statusConfig[status] || statusConfig.PENDING;
		return (
			<span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
				{config.label}
			</span>
		);
	};

	// Helper: extract borrower name from booking
	const getBorrowerName = (booking: RoomBooking): string => {
		if (booking.booked_by_user?.name) return booking.booked_by_user.name;
		if (booking.bookedBy?.name) return booking.bookedBy.name;
		return '-';
	};

	// Helper: extract unit code from booking
	const getUnitCode = (booking: RoomBooking): string => {
		if (booking.booked_by_user?.unit_code) return booking.booked_by_user.unit_code;
		return '-';
	};

	const handleSearch = async () => {
		if (!selectedRoom) {
			alert('Pilih ruangan terlebih dahulu!');
			return;
		}

		try {
			setLoading(true);
			const room = rooms.find(r => r.code === selectedRoom);
			if (room) {
				// Jika input kosong, gunakan default bulan ini untuk fetch jadwal
				const start = startDate || firstDay;
				const end = endDate || lastDay;

				const schedule = await roomService.getRoomSchedule(room.id, start, end);
				setRoomBookings(schedule.bookings || []);
				setShowRoomDetails(true);
			}
		} catch (err) {
			console.error('Failed to fetch room schedule:', err);
			alert('Gagal memuat jadwal ruangan');
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!borrowerId.trim() || !borrowerName.trim() || !activity.trim() || !startDate || !startTime || !endTime) {
			alert('Semua field wajib diisi!');
			return;
		}

		if (!selectedRoom) {
			alert('Pilih ruangan terlebih dahulu!');
			return;
		}

		try {
			setLoading(true);
			const room = rooms.find(r => r.code === selectedRoom);
			if (!room) {
				alert('Ruangan tidak ditemukan!');
				return;
			}

			const documentData = {
				workflow_id: 1,
				title: `Manual Booking - ${activity}`,
				content: {
					room_id: room.id,
					room_code: room.code,
					room_name: room.name,
					booking_date: startDate,
					start_time: startTime,
					end_time: endTime,
					event_name: activity,
					borrower_id: borrowerId,
					borrower_name: borrowerName,
					manual_booking: true,
				},
			};

			const doc = await documentService.createDocument(documentData);
			await documentService.submitDocument(doc.id);

			alert('Peminjaman manual berhasil ditambahkan!');

			setBorrowerId('');
			setBorrowerName('');
			setActivity('');

			await handleSearch();
		} catch (err) {
			console.error('Failed to create manual booking:', err);
			if (err instanceof AxiosError) {
				alert(err.response?.data?.message || 'Gagal menambahkan peminjaman');
			} else {
				alert('Terjadi kesalahan saat menambahkan peminjaman');
			}
		} finally {
			setLoading(false);
		}
	};

	const filteredBookings = roomBookings.filter((item) =>
		[
			getUnitCode(item),
			getBorrowerName(item),
			item.booking_date,
			`${item.start_time} - ${item.end_time}`,
			item.start_time, // Added as per instruction
			item.end_time,   // Added as per instruction
		]
			.join(' ')
			.toLowerCase()
			.includes(search.toLowerCase()),
	);

	return (
		<div className='space-y-6'>
			<h1 className='text-2xl font-bold'>Peminjaman Ruang</h1>

			<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-3'>
				<div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-fit'>
					<Select value={selectedRoom} onValueChange={setSelectedRoom}>
						<SelectTrigger className='w-full sm:w-64'>
							<SelectValue placeholder='Pilih ruangan...' />
						</SelectTrigger>
						<SelectContent>
							{rooms.map((room) => (
								<SelectItem key={room.id} value={room.code}>
									{room.code} - {room.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button onClick={handleSearch} disabled={loading}>
						{loading ? 'Memuat...' : 'Cari'}
					</Button>
				</div>
			</div>

			{showRoomDetails && (
				<div className='flex flex-col lg:flex-row gap-6'>
					<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 lg:w-[37.5%]'>
						<div>
							<h2 className='text-lg font-semibold text-gray-900'>
								Reservasi Ruang {selectedRoom}
							</h2>
						</div>

						<form onSubmit={handleSubmit} className='space-y-5'>
							<div className='space-y-2'>
								<label className='block text-sm font-medium text-gray-700'>
									NIM/NIP Peminjam *
								</label>
								<Input
									placeholder='Masukkan NIM/NIP'
									value={borrowerId}
									onChange={(e) => {
										const value = e.target.value.replace(/\D/g, '');
										if (value.length <= 18) setBorrowerId(value);
									}}
									required
								/>
							</div>

							<div className='space-y-2'>
								<label className='block text-sm font-medium text-gray-700'>
									Nama Peminjam *
								</label>
								<Input
									placeholder='Masukkan nama peminjam'
									value={borrowerName}
									onChange={(e) => setBorrowerName(e.target.value)}
									required
								/>
							</div>

							<div className='space-y-3'>
								<p className='text-sm font-medium text-gray-700'>Waktu & Tanggal</p>

								<div className='space-y-3'>
									<div className='flex flex-col gap-2'>
										<div className='flex items-center gap-2 text-sm text-gray-600'>
											<Clock className='w-4 h-4' />
											<span>Waktu</span>
										</div>
										<div className='flex items-center gap-2 w-full'>
											<Input
												type='time'
												value={startTime}
												onChange={(e) => setStartTime(e.target.value)}
												className='flex-1 min-w-0'
											/>
											<span className='text-sm text-gray-500 flex-shrink-0'>
												-
											</span>
											<Input
												type='time'
												value={endTime}
												onChange={(e) => setEndTime(e.target.value)}
												className='flex-1 min-w-0'
											/>
										</div>
									</div>

									<div className='flex flex-col gap-2'>
										<div className='flex items-center gap-2 text-sm text-gray-600'>
											<Calendar className='w-4 h-4' />
											<span>Tanggal</span>
										</div>
										<div className='flex items-center gap-2 w-full'>
											<Input
												type='date'
												value={startDate}
												onChange={(e) => setStartDate(e.target.value)}
												className='flex-1 min-w-0'
											/>
											<span className='text-sm text-gray-500 flex-shrink-0'>
												-
											</span>
											<Input
												type='date'
												value={endDate}
												onChange={(e) => setEndDate(e.target.value)}
												className='flex-1 min-w-0'
											/>
										</div>
									</div>
								</div>
							</div>

							<div className='space-y-2'>
								<label className='block text-sm font-medium text-gray-700'>
									Aktivitas/Kegiatan *
								</label>
								<Textarea
									placeholder='Masukkan aktivitas/kegiatan'
									value={activity}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
										setActivity(e.target.value)
									}
									rows={4}
									className='resize-none'
									required
								/>
							</div>

							<div className='flex justify-end'>
								<Button type='submit' className='mt-2' disabled={loading}>
									{loading ? 'Menyimpan...' : 'Tambah Peminjaman'}
								</Button>
							</div>
						</form>
					</div>

					<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 lg:w-[62.5%]'>
						<div className='flex flex-col md:flex-row md:items-center justify-between gap-3'>
							<h2 className='text-lg font-semibold text-gray-900'>
								Status Peminjaman Ruang {selectedRoom}
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
											<TableHead>Kode Unit</TableHead>
											<TableHead>Nama Peminjam</TableHead>
											<TableHead>Tanggal</TableHead>
											<TableHead>Waktu</TableHead>
											<TableHead>Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredBookings.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className='text-center text-gray-500 py-8'
												>
													Tidak ada data peminjaman
												</TableCell>
											</TableRow>
										) : (
											filteredBookings.map((item, index) => (
												<TableRow key={item.id}>
													<TableCell className='text-center'>
														{index + 1}
													</TableCell>
													<TableCell>{getUnitCode(item)}</TableCell>
													<TableCell>{getBorrowerName(item)}</TableCell>
													<TableCell>{new Date(item.booking_date).toLocaleDateString('id-ID')}</TableCell>
													<TableCell>{item.start_time} - {item.end_time}</TableCell>
													<TableCell>
														{getStatusBadge(item.status)}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>

							<div className='flex items-center justify-between px-4 py-3 border-t text-xs text-gray-500 bg-gray-50'>
								<span>Showing {filteredBookings.length} entries</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default RouteComponent;

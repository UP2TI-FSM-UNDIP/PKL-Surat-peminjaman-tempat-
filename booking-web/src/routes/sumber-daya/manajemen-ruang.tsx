import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import {
	Plus,
	Pencil,
	Search,
	Trash2,
	Eye,
} from 'lucide-react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { roomService, type Room } from '@/services/room.service';

export const Route = createFileRoute('/sumber-daya/manajemen-ruang')({
	component: RouteComponent,
});

function RouteComponent() {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Modal states
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// Form states
	const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		code: '',
		capacity: '10',
		description: '',
		facilities: '',
		status: 'ACTIVE' as Room['status'],
	});
	const [roomImage, setRoomImage] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState('');

	const [selectedStatus, setSelectedStatus] = useState<Room['status'] | 'all'>('all');

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	const fetchRooms = async () => {
		try {
			setLoading(true);
			setError(null);
			const rooms = await roomService.getRooms();
			setRooms(rooms);
		} catch (err) {
			console.error('Failed to fetch rooms:', err);
			if (err instanceof AxiosError) {
				setError(err.response?.data?.message || 'Gagal memuat data ruangan');
			} else {
				setError('Terjadi kesalahan saat memuat data');
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRooms();
	}, []);

	const handleCreate = () => {
		setFormData({
			name: '',
			code: '',
			capacity: '10',
			description: '',
			facilities: '',
			status: 'ACTIVE',
		});
		setRoomImage(null);
		setFormError('');
		setIsCreateModalOpen(true);
	};

	const handleEdit = (room: Room) => {
		setSelectedRoom(room);
		setFormData({
			name: room.name,
			code: room.code,
			capacity: String(room.capacity || 10),
			description: room.description || '',
			facilities: Array.isArray(room.facilities)
				? room.facilities.join(', ')
				: '',
			status: room.status,
		});
		setRoomImage(null);
		setFormError('');
		setIsEditModalOpen(true);
	};

	const handleDetail = (room: Room) => {
		setSelectedRoom(room);
		setIsDetailModalOpen(true);
	};

	const handleDelete = (room: Room) => {
		setSelectedRoom(room);
		setIsDeleteDialogOpen(true);
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null;
		setRoomImage(file);
	};

	const handleSubmitCreate = async (e: FormEvent) => {
		e.preventDefault();
		setFormError('');

		if (!formData.name.trim() || !formData.code.trim()) {
			setFormError('Nama ruangan dan kode ruangan wajib diisi!');
			return;
		}

		try {
			setIsSubmitting(true);

			const data = new FormData();
			data.append('name', formData.name);
			data.append('code', formData.code);
			data.append('capacity', String(parseInt(formData.capacity)));
			data.append('description', formData.description);
			data.append('status', 'ACTIVE');

			const facilitiesArray = formData.facilities
				.split(',')
				.map((f) => f.trim())
				.filter((f) => f.length > 0);

			facilitiesArray.forEach((f, index) => {
				data.append(`facilities[${index}]`, f);
			});

			if (roomImage) {
				data.append('images[]', roomImage);
			}

			await roomService.createRoom(data);

			setIsCreateModalOpen(false);
			fetchRooms();
		} catch (err) {
			console.error('Failed to create room:', err);
			const error = err as AxiosError<{ message: string }>;
			setFormError(
				error.response?.data?.message || 'Gagal menambahkan ruangan',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmitEdit = async (e: FormEvent) => {
		e.preventDefault();
		setFormError('');

		if (!selectedRoom) return;

		if (!formData.name.trim() || !formData.code.trim()) {
			setFormError('Nama ruangan dan kode ruangan wajib diisi!');
			return;
		}

		try {
			setIsSubmitting(true);

			const facilitiesArray = formData.facilities
				.split(',')
				.map((f) => f.trim())
				.filter((f) => f.length > 0);

			const roomData = {
				name: formData.name,
				code: formData.code,
				capacity: parseInt(formData.capacity) || 10,
				description: formData.description,
				facilities: facilitiesArray,
				status: formData.status,
			};

			await roomService.updateRoom(selectedRoom.id, roomData);

			if (roomImage) {
				try {
					await roomService.uploadImage(selectedRoom.id, roomImage);
				} catch (err) {
					console.error('Failed to upload image:', err);
				}
			}

			setIsEditModalOpen(false);
			fetchRooms();
		} catch (err) {
			console.error('Failed to update room:', err);
			const error = err as AxiosError<{ message: string }>;
			setFormError(
				error.response?.data?.message || 'Gagal memperbarui ruangan',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!selectedRoom) return;

		try {
			await roomService.deleteRoom(selectedRoom.id);
			setIsDeleteDialogOpen(false);
			setRooms((prev) => prev.filter((r) => r.id !== selectedRoom.id));
		} catch (err) {
			console.error('Failed to delete room:', err);
			const error = err as AxiosError<{ message: string }>;
			alert(error.response?.data?.message || 'Gagal menghapus ruangan');
		}
	};

	const filteredRooms = rooms.filter((room) => {
		const term = searchTerm.toLowerCase();
		const matchesSearch =
			room.name.toLowerCase().includes(term) ||
			room.code.toLowerCase().includes(term) ||
			(room.description && room.description.toLowerCase().includes(term));

		const matchesStatus =
			selectedStatus === 'all' || room.status === selectedStatus;

		return matchesSearch && matchesStatus;
	});

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
					<p className='mt-4 text-gray-600'>Memuat data ruangan...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-center'>
					<p className='text-red-600 mb-4'>{error}</p>
					<Button onClick={fetchRooms}>Coba Lagi</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-7xl'>
			{/* Header */}
			<div className='mb-4 sm:mb-6'>
				<h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2'>
					Manajemen Ruang
				</h1>
				<p className='text-sm sm:text-base text-gray-600'>
					Kelola data ruang yang tersedia untuk peminjaman
				</p>
			</div>

			<div className='mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between gap-3'>
				<div className='flex flex-1 gap-2'>
					<div className='relative flex-1'>
						<Search className='absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400' />
						<Input
							type='text'
							placeholder='Cari ruangan...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='pl-7 sm:pl-10 text-sm h-9 sm:h-10'
						/>
					</div>
					<Select
						value={selectedStatus}
						onValueChange={(value) =>
							setSelectedStatus(value as Room['status'] | 'all')
						}
					>
						<SelectTrigger className='w-[140px] h-9 sm:h-10 text-xs sm:text-sm'>
							<SelectValue placeholder='Filter Status' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>Semua Status</SelectItem>
							<SelectItem value='ACTIVE'>Aktif</SelectItem>
							<SelectItem value='MAINTENANCE'>Maintenance</SelectItem>
							<SelectItem value='INACTIVE'>Nonaktif</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button
					onClick={handleCreate}
					className='whitespace-nowrap h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base'
				>
					<Plus className='h-5 w-5 mr-2' />
					<span>Tambah Ruang</span>
				</Button>
			</div>

			{/* Table */}
			<div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
				<div className='overflow-x-auto max-w-full'>
					<Table className='w-full min-w-[640px]'>
						<TableHeader>
							<TableRow>
								<TableHead className='w-12 text-center text-xs sm:text-sm px-2'>
									No
								</TableHead>
								<TableHead className='text-xs sm:text-sm px-2 min-w-20'>
									Kode
								</TableHead>
								<TableHead className='text-xs sm:text-sm px-2 min-w-30'>
									Nama Ruangan
								</TableHead>
								<TableHead className='text-xs sm:text-sm px-2 w-20'>
									Kapasitas
								</TableHead>
								<TableHead className='hidden lg:table-cell text-xs sm:text-sm px-2 min-w-25'>
									Fasilitas
								</TableHead>
								<TableHead className='text-xs sm:text-sm px-2 w-24'>
									Status
								</TableHead>
								<TableHead className='text-center text-xs sm:text-sm px-2 w-24'>
									Aksi
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredRooms.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className='text-center text-gray-500 h-32'
									>
										{debouncedSearchTerm
											? 'Tidak ada ruangan yang cocok dengan pencarian'
											: 'Belum ada data ruangan'}
									</TableCell>
								</TableRow>
							) : (
								filteredRooms.map((room, index) => (
									<TableRow key={room.id}>
										<TableCell className='font-medium text-center text-xs sm:text-sm py-2 sm:py-3'>
											{index + 1}
										</TableCell>
										<TableCell className='text-xs sm:text-sm py-2 sm:py-3'>
											{room.code}
										</TableCell>
										<TableCell className='text-xs sm:text-sm font-medium text-gray-900 py-2 sm:py-3'>
											{room.name}
										</TableCell>
										<TableCell className='text-xs sm:text-sm py-2 sm:py-3'>
											{room.capacity || '-'}
										</TableCell>
										<TableCell className='hidden md:table-cell text-xs sm:text-sm py-2 sm:py-3'>
											{Array.isArray(room.facilities) &&
												room.facilities.length > 0
												? room.facilities.join(', ')
												: '-'}
										</TableCell>
										<TableCell className='text-xs sm:text-sm py-2 sm:py-3'>
											<span
												className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${room.status === 'ACTIVE'
														? 'bg-green-100 text-green-800'
														: room.status === 'MAINTENANCE'
															? 'bg-yellow-100 text-yellow-800'
															: 'bg-gray-100 text-gray-800'
													}`}
											>
												{room.status === 'ACTIVE'
													? 'Aktif'
													: room.status === 'MAINTENANCE'
														? 'Maintenance'
														: 'Nonaktif'}
											</span>
										</TableCell>
										<TableCell className='py-2 sm:py-3'>
											<div className='flex items-center justify-center gap-1 sm:gap-2'>
												<Button
													variant='ghost'
													size='sm'
													onClick={() => handleDetail(room)}
													className='h-6 w-6 sm:h-8 sm:w-8 p-0'
												>
													<Eye className='h-3 w-3 sm:h-4 sm:w-4' />
												</Button>
												<Button
													variant='ghost'
													size='sm'
													onClick={() => handleEdit(room)}
													className='h-6 w-6 sm:h-8 sm:w-8 p-0'
												>
													<Pencil className='h-3 w-3 sm:h-4 sm:w-4' />
												</Button>
												<Button
													variant='ghost'
													size='sm'
													onClick={() => handleDelete(room)}
													className='h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
												>
													<Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Create Room Modal */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Tambah Ruangan Baru</DialogTitle>
						<DialogDescription>
							Masukkan informasi ruangan yang akan ditambahkan
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmitCreate}>
						<div className='grid gap-4 py-4'>
							<div className='grid gap-2'>
								<label htmlFor='code' className='text-sm font-medium'>
									Kode Ruangan <span className='text-red-500'>*</span>
								</label>
								<Input
									id='code'
									value={formData.code}
									onChange={(e) =>
										setFormData({ ...formData, code: e.target.value })
									}
									placeholder='A101'
									required
								/>
							</div>
							<div className='grid gap-2'>
								<label htmlFor='name' className='text-sm font-medium'>
									Nama Ruangan <span className='text-red-500'>*</span>
								</label>
								<Input
									id='name'
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder='Ruang Kelas A101'
									required
								/>
							</div>
							<div className='grid gap-2'>
								<label htmlFor='capacity' className='text-sm font-medium'>
									Kapasitas Ruangan <span className='text-red-500'>*</span>
								</label>
								<Input
									id='capacity'
									type='number'
									min={1}
									value={formData.capacity}
									onChange={(e) =>
										setFormData({ ...formData, capacity: e.target.value })
									}
									required
								/>
							</div>
							<div className='grid gap-2'>
								<label htmlFor='facilities' className='text-sm font-medium'>
									Fasilitas (pisahkan dengan koma)
								</label>
								<textarea
									id='facilities'
									value={formData.facilities}
									onChange={(e) =>
										setFormData({ ...formData, facilities: e.target.value })
									}
									placeholder='AC, Proyektor, Whiteboard'
									rows={3}
									className='block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								/>
							</div>
							<div className='grid gap-2'>
								<label htmlFor='description' className='text-sm font-medium'>
									Deskripsi/Catatan
								</label>
								<textarea
									id='description'
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder='Ruang kelas untuk kuliah umum'
									rows={3}
									className='block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								/>
							</div>
							<div className='grid gap-2'>
								<label htmlFor='image' className='text-sm font-medium'>
									Foto Ruangan
								</label>
								<Input
									id='image'
									type='file'
									accept='image/*'
									onChange={handleFileChange}
								/>
							</div>
							{formError && <p className='text-sm text-red-600'>{formError}</p>}
						</div>
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setIsCreateModalOpen(false)}
								disabled={isSubmitting}
							>
								Batal
							</Button>
							<Button type='submit' disabled={isSubmitting}>
								{isSubmitting ? 'Menyimpan...' : 'Tambah'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Room Modal */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Edit Ruangan</DialogTitle>
						<DialogDescription>Use informasi ruangan</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmitEdit}>
						<div className='grid gap-4 py-4'>
							<div className='grid gap-2'>
								<label htmlFor='edit-code' className='text-sm font-medium'>
									Kode Ruangan <span className='text-red-500'>*</span>
								</label>
								<Input
									id='edit-code'
									value={formData.code}
									onChange={(e) =>
										setFormData({ ...formData, code: e.target.value })
									}
									required
								/>
							</div>
							<div className='grid gap-2'>
								<label htmlFor='edit-name' className='text-sm font-medium'>
									Nama Ruangan <span className='text-red-500'>*</span>
								</label>
								<Input
									id='edit-name'
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									required
								/>
							</div>
							<div className='grid gap-2'>
								<label htmlFor='edit-capacity' className='text-sm font-medium'>
									Kapasitas Ruangan
								</label>
								<Input
									id='edit-capacity'
									type='number'
									min={1}
									value={formData.capacity}
									onChange={(e) =>
										setFormData({ ...formData, capacity: e.target.value })
									}
									required
								/>
							</div>
							<div className='grid gap-2'>
								<label htmlFor='edit-facilities' className='text-sm font-medium'>
									Fasilitas (pisahkan dengan koma)
								</label>
								<textarea
									id='edit-facilities'
									value={formData.facilities}
									onChange={(e) =>
										setFormData({ ...formData, facilities: e.target.value })
									}
									rows={3}
									className='block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								/>
							</div>
							<div className='grid gap-2'>
								<label
									htmlFor='edit-description'
									className='text-sm font-medium'
								>
									Deskripsi/Catatan
								</label>
								<textarea
									id='edit-description'
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									rows={3}
									className='block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								/>
							</div>
							<div className='grid gap-2'>
								<label htmlFor='edit-status' className='text-sm font-medium'>
									Status Ruangan <span className='text-red-500'>*</span>
								</label>
								<Select
									value={formData.status}
									onValueChange={(value) =>
										setFormData({
											...formData,
											status: value as Room['status'],
										})
									}
								>
									<SelectTrigger id='edit-status'>
										<SelectValue placeholder='Pilih Status' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='ACTIVE'>Aktif</SelectItem>
										<SelectItem value='MAINTENANCE'>Maintenance</SelectItem>
										<SelectItem value='INACTIVE'>Nonaktif</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className='grid gap-2'>
								<label htmlFor='edit-image' className='text-sm font-medium'>
									Foto Ruangan (Upload baru untuk mengganti)
								</label>
								<Input
									id='edit-image'
									type='file'
									accept='image/*'
									onChange={handleFileChange}
								/>
							</div>
							{formError && <p className='text-sm text-red-600'>{formError}</p>}
						</div>
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setIsEditModalOpen(false)}
								disabled={isSubmitting}
							>
								Batal
							</Button>
							<Button type='submit' disabled={isSubmitting}>
								{isSubmitting ? 'Menyimpan...' : 'Simpan'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Detail Room Modal */}
			<Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
				<DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Detail Ruangan</DialogTitle>
					</DialogHeader>
					{selectedRoom && (
						<div className='space-y-4 py-4'>
							{selectedRoom.image_url && (
								<div className='aspect-video w-full overflow-hidden rounded-lg bg-gray-100'>
									<img
										src={selectedRoom.image_url}
										alt={selectedRoom.name}
										className='h-full w-full object-cover'
									/>
								</div>
							)}
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<p className='text-sm font-medium text-gray-500'>Kode</p>
									<p className='text-sm text-gray-900'>{selectedRoom.code}</p>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-500'>Kapasitas</p>
									<p className='text-sm text-gray-900'>
										{selectedRoom.capacity} Orang
									</p>
								</div>
							</div>
							<div>
								<p className='text-sm font-medium text-gray-500'>
									Nama Ruangan
								</p>
								<p className='text-sm text-gray-900'>{selectedRoom.name}</p>
							</div>
							{selectedRoom.description && (
								<div>
									<p className='text-sm font-medium text-gray-500'>Deskripsi</p>
									<p className='text-sm text-gray-900'>
										{selectedRoom.description}
									</p>
								</div>
							)}
							{selectedRoom.facilities && selectedRoom.facilities.length > 0 && (
								<div>
									<p className='text-sm font-medium text-gray-500'>Fasilitas</p>
									<div className='mt-1 flex flex-wrap gap-2'>
										{selectedRoom.facilities.map((facility, index) => (
											<span
												key={index}
												className='inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10'
											>
												{facility}
											</span>
										))}
									</div>
								</div>
							)}
							<div>
								<p className='text-sm font-medium text-gray-500'>Status</p>
								<span
									className={`mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${selectedRoom.status === 'ACTIVE'
											? 'bg-green-100 text-green-700'
											: 'bg-red-100 text-red-700'
										}`}
								>
									{selectedRoom.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
								</span>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Ruangan</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus ruangan{' '}
							<strong>{selectedRoom?.name}</strong>? Tindakan ini tidak dapat
							dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className='bg-red-600 hover:bg-red-700'
						>
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { roomService, type Room } from '@/services/room.service';
import type { ChangeEvent, FormEvent } from 'react';

export function useRooms() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
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
    const [capacityRange, setCapacityRange] = useState<string>('all');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchRooms = async () => {
        try {
            setIsFetching(true);
            setError(null);
            const rooms = await roomService.getRooms();
            setRooms(rooms);
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Gagal memuat data ruangan');
            } else {
                setError('Terjadi kesalahan saat mengambil data');
            }
        } finally {
            setIsFetching(false);
            setIsInitialLoading(false);
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

        const matchesCapacity = () => {
            if (capacityRange === 'all') return true;
            const capacity = room.capacity || 0;
            if (capacityRange === '<20') return capacity < 20;
            if (capacityRange === '20-50') return capacity >= 20 && capacity <= 50;
            if (capacityRange === '50-100') return capacity > 50 && capacity <= 100;
            if (capacityRange === '>100') return capacity > 100;
            return true;
        };

        return matchesSearch && matchesStatus && matchesCapacity();
    });

    return {
        rooms,
        filteredRooms,
        searchTerm,
        setSearchTerm,
        debouncedSearchTerm,
        isInitialLoading,
        isFetching,
        error,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isDetailModalOpen,
        setIsDetailModalOpen,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        selectedRoom,
        formData,
        setFormData,
        formError,
        isSubmitting,
        selectedStatus,
        setSelectedStatus,
        capacityRange,
        setCapacityRange,
        fetchRooms,
        handleCreate,
        handleEdit,
        handleDetail,
        handleDelete,
        handleFileChange,
        handleSubmitCreate,
        handleSubmitEdit,
        handleConfirmDelete,
    };
}

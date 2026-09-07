import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    roomService,
    type Room,
    type RoomBooking,
} from '@/services/room.service';
import { documentService } from '@/services/document.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReservationFormState {
    startTime: string;
    endTime: string;
    bookingDate: string;
    activity: string;
    ketuaNama: string;
    ketuaNim: string;
    ketuaHp: string;
}

export interface ReservationSearchParams {
    roomId?: number;
    roomCode?: string;
    bookingDate?: string;
    startTime?: string;
    endTime?: string;
    purpose?: string;
    ketuaNama?: string;
    ketuaNim?: string;
    ketuaHp?: string;
}

interface AvailabilityInfo {
    message: string | null;
    isAvailable: boolean;
    isChecking: boolean;
}

interface ValidationInfo {
    isSaturday: boolean;
    isTimeValid: boolean;
    dateError: string | null;
    timeError: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useReservation(searchParams: ReservationSearchParams) {
    const queryClient = useQueryClient();

    // ---- 1. ROOMS QUERY ----
    const roomsQuery = useQuery({
        queryKey: ['rooms', { status: 'ACTIVE' }],
        queryFn: () => roomService.getRooms({ status: 'ACTIVE' }),
    });
    const rooms: Room[] = roomsQuery.data ?? [];

    // ---- 2. UI STATE ----
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
        searchParams.roomId ? Number(searchParams.roomId) : null,
    );
    const [showRoomDetails, setShowRoomDetails] = useState(
        !!searchParams.roomId,
    );
    const [showRoomDetailModal, setShowRoomDetailModal] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Auto-select first room when rooms load (only if nothing selected)
    useEffect(() => {
        if (rooms.length > 0 && !selectedRoomId && !searchParams.roomId) {
            setSelectedRoomId(rooms[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rooms.length]);

    // ---- 3. FORM STATE (single object instead of 17 useState) ----
    const [form, setForm] = useState<ReservationFormState>(() => ({
        startTime: (searchParams.startTime as string) || '09:00',
        endTime: (searchParams.endTime as string) || '17:00',
        bookingDate: (searchParams.bookingDate as string) || '',
        activity: (searchParams.purpose as string) || '',
        ketuaNama:
            (searchParams.ketuaNama as string) ||
            localStorage.getItem('userName') ||
            '',
        ketuaNim:
            (searchParams.ketuaNim as string) ||
            localStorage.getItem('userNim') ||
            '',
        ketuaHp: (searchParams.ketuaHp as string) || '',
    }));

    const updateForm = (field: keyof ReservationFormState, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        // Clear messages when user edits
        if (formError) setFormError(null);
        if (successMessage) setSuccessMessage(null);
    };

    const resetForm = () => {
        setForm({
            startTime: '09:00',
            endTime: '17:00',
            bookingDate: '',
            activity: '',
            ketuaNama: localStorage.getItem('userName') || '',
            ketuaNim: localStorage.getItem('userNim') || '',
            ketuaHp: '',
        });
    };

    // ---- 4. ROOM DETAILS + SCHEDULE QUERIES ----
    const roomDetailQuery = useQuery({
        queryKey: ['rooms', selectedRoomId, 'details'],
        queryFn: () => roomService.getRoom(selectedRoomId!),
        enabled: showRoomDetails && !!selectedRoomId,
    });

    const scheduleQuery = useQuery({
        queryKey: ['rooms', selectedRoomId, 'schedule'],
        queryFn: () => {
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            return roomService.getRoomSchedule(
                selectedRoomId!,
                new Date().toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
            );
        },
        enabled: showRoomDetails && !!selectedRoomId,
    });

    const selectedRoom: Room | null = roomDetailQuery.data?.room ?? null;
    const bookings: RoomBooking[] = scheduleQuery.data?.bookings ?? [];

    // ---- 5. DERIVED VALIDATION (useMemo instead of useEffect) ----
    const validation: ValidationInfo = useMemo(() => {
        const isSaturday = form.bookingDate
            ? new Date(form.bookingDate + 'T00:00:00').getDay() === 6
            : true; // no date = no error yet

        const isTimeValid =
            !form.startTime || !form.endTime ? true : form.startTime < form.endTime;

        const dateError =
            form.bookingDate && !isSaturday
                ? 'Peminjaman hanya diperbolehkan pada hari Sabtu'
                : null;

        const timeError =
            form.startTime && form.endTime && !isTimeValid
                ? 'Waktu mulai harus lebih awal dari waktu selesai'
                : null;

        return { isSaturday, isTimeValid, dateError, timeError };
    }, [form.bookingDate, form.startTime, form.endTime]);

    // ---- 6. AVAILABILITY CHECK (debounced via useMutation + useEffect) ----
    const [availabilityMsg, setAvailabilityMsg] = useState<{
        message: string;
        isAvailable: boolean;
    } | null>(null);

    const checkAvailabilityMutation = useMutation({
        mutationFn: () =>
            roomService.checkAvailability(
                selectedRoomId!,
                form.bookingDate,
                form.startTime,
                form.endTime,
            ),
        onSuccess: (result) => {
            if (result.available) {
                setAvailabilityMsg({
                    message: '✓ Ruangan tersedia pada waktu yang dipilih',
                    isAvailable: true,
                });
            } else {
                setAvailabilityMsg({
                    message: '✗ Ruangan tidak tersedia, Karena booking yang bentrok.',
                    isAvailable: false,
                });
            }
        },
        onError: () => {
            setAvailabilityMsg({
                message: 'Gagal mengecek ketersediaan ruangan',
                isAvailable: false,
            });
        },
    });

    // Debounced availability check
    useEffect(() => {
        if (
            selectedRoomId &&
            form.bookingDate &&
            form.startTime &&
            form.endTime &&
            showRoomDetails
        ) {
            const timer = setTimeout(
                () => checkAvailabilityMutation.mutate(),
                500,
            );
            return () => clearTimeout(timer);
        } else {
            setAvailabilityMsg(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRoomId, form.bookingDate, form.startTime, form.endTime, showRoomDetails]);

    const availability: AvailabilityInfo = {
        message: availabilityMsg?.message ?? null,
        isAvailable: availabilityMsg?.isAvailable ?? false,
        isChecking: checkAvailabilityMutation.isPending,
    };

    // ---- 7. SUBMIT MUTATION ----
    const submitMutation = useMutation({
        mutationFn: async () => {
            // 1. Check availability (fresh)
            const availResult = await roomService.checkAvailability(
                selectedRoomId!,
                form.bookingDate,
                form.startTime,
                form.endTime,
            );
            if (!availResult.available) {
                throw new Error(
                    'Ruangan tidak tersedia pada waktu yang dipilih. Silakan pilih waktu lain.',
                );
            }

            // 2. Check for duplicate draft reservations
            const existingDocs = await documentService.getDocuments();
            const hasDuplicate = existingDocs.my_documents?.some((doc: any) => {
                const content = doc.content || {};
                const metaData = doc.meta_data || {};
                return (
                    doc.status === 'DRAFT' &&
                    metaData.step === 'reservation' &&
                    content.room_id === selectedRoomId &&
                    content.booking_date === form.bookingDate &&
                    content.start_time === form.startTime &&
                    content.end_time === form.endTime
                );
            });
            if (hasDuplicate) {
                throw new Error(
                    'Anda sudah memiliki reservasi yang sama di daftar pengajuan. Silakan submit atau edit reservasi yang ada.',
                );
            }

            // 3. Determine workflow ID
            const userUnitCategory =
                localStorage.getItem('userUnitCategory') || 'HMD';
            const workflowMap: Record<string, number> = {
                HMD: 1,
                BEM: 2,
                SENAT: 3,
                UKM: 4,
            };
            const workflowId = workflowMap[userUnitCategory] || 1;

            // 4. Create document
            return documentService.createDocument({
                workflow_id: workflowId,
                title: `Peminjaman ${selectedRoom?.name || 'Ruangan'} - ${form.bookingDate}`,
                content: {
                    room_id: selectedRoomId,
                    room_code: selectedRoom?.code || '',
                    room_name: selectedRoom?.name || '',
                    booking_date: form.bookingDate,
                    start_time: form.startTime,
                    end_time: form.endTime,
                    purpose: form.activity,
                    ketua_pelaksana_nama: form.ketuaNama,
                    ketua_pelaksana_nim: form.ketuaNim,
                    ketua_pelaksana_hp: form.ketuaHp,
                    peminjam_nama: localStorage.getItem('userName') || 'Pemohon',
                },
                meta_data: {
                    type: 'room_reservation',
                    step: 'reservation',
                },
            });
        },
        onSuccess: () => {
            setSuccessMessage(
                'Reservasi berhasil disimpan! Silakan cek di halaman Riwayat Pengajuan untuk melanjutkan.',
            );
            resetForm();
            // Refresh schedule
            queryClient.invalidateQueries({
                queryKey: ['rooms', selectedRoomId, 'schedule'],
            });
        },
    });

    // ---- 8. HANDLERS ----
    const selectRoom = (id: number) => {
        setSelectedRoomId(id);
        setShowRoomDetails(false);
        setFormError(null);
        setSuccessMessage(null);
    };

    const searchRoom = () => {
        if (!selectedRoomId) {
            setFormError('Pilih ruangan terlebih dahulu');
            return;
        }
        setShowRoomDetails(true);
        // Force refetch if already shown
        queryClient.invalidateQueries({
            queryKey: ['rooms', selectedRoomId],
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSuccessMessage(null);

        // Client-side validation
        if (
            !selectedRoomId ||
            !form.bookingDate ||
            !form.startTime ||
            !form.endTime ||
            !form.activity
        ) {
            setFormError('Mohon lengkapi semua field wajib');
            return;
        }
        if (!form.ketuaNama || !form.ketuaNim || !form.ketuaHp) {
            setFormError('Mohon lengkapi data Ketua Pelaksana');
            return;
        }
        if (!/^\d{14}$/.test(form.ketuaNim)) {
            setFormError('NIM harus 14 digit angka');
            return;
        }
        if (!/^\d{12,13}$/.test(form.ketuaHp)) {
            setFormError('Nomor HP harus 12-13 digit angka');
            return;
        }
        if (!validation.isSaturday) {
            setFormError('Peminjaman hanya diperbolehkan pada hari Sabtu');
            return;
        }
        if (!validation.isTimeValid) {
            setFormError('Waktu mulai harus lebih awal dari waktu selesai');
            return;
        }

        submitMutation.mutate();
    };

    // ---- 9. RETURN ----
    return {
        // Rooms
        rooms,
        isLoadingRooms: roomsQuery.isLoading,
        roomsError: roomsQuery.error
            ? (roomsQuery.error as Error).message || 'Gagal memuat data ruangan'
            : null,
        refetchRooms: roomsQuery.refetch,

        // Room selection
        selectedRoomId,
        selectRoom,
        searchRoom,
        showRoomDetails,

        // Room details
        selectedRoom,
        isLoadingDetails:
            roomDetailQuery.isLoading || scheduleQuery.isLoading,

        // Schedule
        bookings,
        isLoadingSchedule: scheduleQuery.isLoading,

        // Form
        form,
        updateForm,
        handleSubmit,
        formError,
        successMessage,
        isSubmitting: submitMutation.isPending,
        submitError: submitMutation.error
            ? (submitMutation.error as Error).message || 'Terjadi kesalahan saat membuat reservasi'
            : null,

        // Validation
        validation,

        // Availability
        availability,

        // Modal
        showRoomDetailModal,
        setShowRoomDetailModal,
    };
}

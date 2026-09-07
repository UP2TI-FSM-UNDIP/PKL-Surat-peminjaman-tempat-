import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
// ERROR FIX: Gunakan 'import type' untuk interface/type
import { roomService, type Room } from '@/services/room.service';
import { documentService } from '@/services/document.service';
import { useBookingContext } from '@/contexts/BookingContext';
import type { ReservationContent, BookingFormState } from '@/types/booking';

interface UseBookingFormProps {
  initialData?: ReservationContent;
  // ERROR FIX: Hindari 'any', gunakan Record atau interface spesifik jika ada
  searchParams: Record<string, unknown>;
  editId?: number;
  rooms: Room[];
}

export function useBookingForm({
  initialData,
  searchParams,
  editId,
  rooms,
}: UseBookingFormProps) {
  const navigate = useNavigate();
  const { updateFormData, formData: contextData } = useBookingContext();

  // --- 1. STATE ---
  const [form, setForm] = useState<BookingFormState>(() => {
    // ERROR FIX: Ganti 'any' dengan helper type-safe
    const val = (
      key: keyof ReservationContent,
      contextKey: string,
      paramKey: string,
    ): string | number | null => {
      // 1. Cek Initial Data (DB)
      if (initialData) {
        return initialData[key] ?? null;
      }
      // 2. Cek Search Params (URL)
      if (paramKey && searchParams[paramKey] !== undefined) {
        return String(searchParams[paramKey]);
      }
      // 3. Cek Context (State)
      // Casting contextData ke Record<string, any> aman di sini untuk akses dynamic key
      const ctx = contextData as Record<string, unknown>;
      if (contextKey && ctx[contextKey] !== undefined) {
        return ctx[contextKey] as string | number;
      }
      return null;
    };

    return {
      roomId: Number(val('room_id', 'room_id', 'roomId')) || null,
      bookingDate: String(
        val('booking_date', 'booking_date', 'bookingDate') || '',
      ),
      startTime: String(val('start_time', 'start_time', 'startTime') || ''),
      endTime: String(val('end_time', 'end_time', 'endTime') || ''),
      activity: String(val('purpose', 'purpose', 'purpose') || ''),
      ketua: {
        nama: String(
          val('ketua_pelaksana_nama', 'ketua_pelaksana_nama', 'ketuaNama') ||
          localStorage.getItem('userName') ||
          '',
        ),
        nim: String(
          val('ketua_pelaksana_nim', 'ketua_pelaksana_nim', 'ketuaNim') ||
          localStorage.getItem('userNim') ||
          '',
        ),
        hp: String(
          val('ketua_pelaksana_hp', 'ketua_pelaksana_hp', 'ketuaHp') || '',
        ),
      },
    };
  });

  // --- 2. HANDLERS ---
  // ERROR FIX: Hindari 'any' pada value
  const handleChange = (
    field: keyof BookingFormState,
    value: string | number | null,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleKetuaChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      ketua: { ...prev.ketua, [field]: value },
    }));
  };

  // --- 3. MUTATIONS (Availability) ---
  const [availabilityMsg, setAvailabilityMsg] = useState<{
    msg: string;
    isError: boolean;
  } | null>(null);

  const checkAvailabilityMutation = useMutation({
    mutationFn: async () => {
      if (!form.roomId || !form.bookingDate) return;

      // Skip availability check jika dalam edit mode dengan data yang sama
      // Karena dokumen sedang diedit, data asli dianggap "available" untuk diedit
      if (editId && initialData) {
        const isSameRoom = initialData.room_id === form.roomId;
        const isSameDate = initialData.booking_date === form.bookingDate;
        const isSameStartTime = initialData.start_time === form.startTime;
        const isSameEndTime = initialData.end_time === form.endTime;

        if (isSameRoom && isSameDate && isSameStartTime && isSameEndTime) {
          // Data sama dengan asli, return available
          return {
            available: true,
            room: rooms.find((r) => r.id === form.roomId)!,
            date: form.bookingDate,
            start_time: form.startTime,
            end_time: form.endTime,
            conflicts: [],
          };
        }
      }

      return await roomService.checkAvailability(
        form.roomId,
        form.bookingDate,
        form.startTime,
        form.endTime,
        editId, // Pass editId untuk exclude document yang sedang diedit
      );
    },
    onSuccess: (res) => {
      if (res) {
        setAvailabilityMsg(
          res.available
            ? { msg: '✓ Ruangan tersedia', isError: false }
            : {
              msg: `✗ Tidak tersedia (${res.conflicts?.length || 0} bentrok)`,
              isError: true,
            },
        );
      }
    },
  });

  // Effect untuk auto-check availability
  useEffect(() => {
    if (form.roomId && form.bookingDate && form.startTime && form.endTime) {
      // Debounce 800ms untuk mengurangi request berlebihan
      const timer = setTimeout(() => checkAvailabilityMutation.mutate(), 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.roomId, form.bookingDate, form.startTime, form.endTime]);

  // --- 4. MUTATION (Submit) ---
  const submitMutation = useMutation({
    mutationFn: async () => {
      // 1. Validasi Availability dengan exclude current document jika edit mode
      const avail = await roomService.checkAvailability(
        form.roomId!,
        form.bookingDate,
        form.startTime,
        form.endTime,
        editId, // Exclude current document ID jika dalam edit mode
      );
      if (!avail.available) {
        throw new Error('Ruangan tidak tersedia pada jam tersebut.');
      }

      // 2. Siapkan Data
      // ERROR FIX: Menggunakan 'rooms' agar tidak unused
      const selectedRoom = rooms.find((r) => r.id === form.roomId);

      const contentPayload = {
        room_id: form.roomId!,
        room_code: selectedRoom?.code || null,
        room_name: selectedRoom?.name || null,
        booking_date: form.bookingDate,
        start_time: form.startTime,
        end_time: form.endTime,
        purpose: form.activity,
        ketua_pelaksana_nama: form.ketua.nama,
        ketua_pelaksana_nim: form.ketua.nim,
        ketua_pelaksana_hp: form.ketua.hp,
        peminjam_nama: localStorage.getItem('userName') || 'Pemohon',
      };


      // 3. Create or Update Logic
      // ERROR FIX: Menggunakan 'documentService' agar tidak unused
      if (editId) {
        // UPDATE
        return await documentService.updateDocument(editId, {
          title: `Peminjaman ${selectedRoom?.name || 'Ruang'} - ${form.bookingDate}`,
          content: contentPayload,
        });
      } else {
        // CREATE
        const userUnitCategory =
          localStorage.getItem('userUnitCategory') || 'HMD';
        const workflowMap: Record<string, number> = {
          HMD: 1,
          BEM: 2,
          SENAT: 3,
          UKM: 4,
        };
        const workflowId = workflowMap[userUnitCategory] || 1;

        return await documentService.createDocument({
          workflow_id: workflowId,
          title: `Peminjaman ${selectedRoom?.name || 'Ruang'} - ${form.bookingDate}`,
          content: contentPayload,
          meta_data: { type: 'room_reservation', step: 'detail_tempat' },
        });
      }
    },
    onSuccess: (doc) => {
      // ERROR FIX: Type assertion ke ReservationContent
      const content = doc.content as unknown as ReservationContent;

      // Update Context
      updateFormData({
        document_id: doc.id,
        room_id: content.room_id,
        room_code: content.room_code,
        booking_date: content.booking_date,
        start_time: content.start_time,
        end_time: content.end_time,
        purpose: content.purpose,
        ketua_pelaksana_nama: content.ketua_pelaksana_nama,
        ketua_pelaksana_nim: content.ketua_pelaksana_nim,
        ketua_pelaksana_hp: content.ketua_pelaksana_hp,
        // Autofill nama kegiatan dari reservasi ke stepper proposal
        event_name: content.purpose || '',
      });
      // Navigate
      navigate({ to: '/peminjam/pinjam/proposal' });
    },
    onError: (err: Error) => {
      // ERROR FIX: Spesifikkan tipe Error
      alert(err.message || 'Gagal menyimpan data');
    },
  });

  return {
    form,
    handleChange,
    handleKetuaChange,
    availabilityMsg,
    submitMutation,
    checkAvailabilityMutation,
  };
}

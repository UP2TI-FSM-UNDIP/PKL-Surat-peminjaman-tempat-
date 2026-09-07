import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Stepper } from '@/components/common/Stepper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TimePicker } from '@/components/common/TimePicker';
import { useBookingForm } from '@/hooks/useBookingForm';
import { RoomDetailModal } from '@/features/bookings/RoomDetailModal';
import type { Room } from '@/services/room.service';
import type { ReservationContent } from '@/types/booking';
import type { Document } from '@/types/document';

interface BookingFormProps {
    rooms: Room[];
    initialData?: ReservationContent;
    searchParams: Record<string, unknown>;
    editId?: number;
    existingDocument?: Document;
}

export function BookingForm(props: BookingFormProps) {
    const navigate = useNavigate();

    // --- CUSTOM HOOK ---
    const {
        form,
        handleChange,
        handleKetuaChange,
        availabilityMsg,
        submitMutation,
    } = useBookingForm(props);

    // --- ROOM DETAIL MODAL ---
    const [showRoomDetail, setShowRoomDetail] = useState(false);

    // --- DERIVED VALIDATION ---
    const isSaturday = useMemo(() => {
        if (!form.bookingDate) return false;
        const d = new Date(form.bookingDate + 'T00:00:00');
        return d.getDay() === 6;
    }, [form.bookingDate]);

    const isTimeWindowValid = useMemo(() => {
        if (!form.startTime || !form.endTime) return false;
        const tRe = /^\d{2}:\d{2}$/;
        if (!tRe.test(form.startTime) || !tRe.test(form.endTime)) return false;
        const [sh, sm] = form.startTime.split(':').map(Number);
        const [eh, em] = form.endTime.split(':').map(Number);
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        const open = 9 * 60;
        const close = 17 * 60;
        return start >= open && end <= close && end > start;
    }, [form.startTime, form.endTime]);

    const dateValidationMsg = useMemo(() => {
        if (!form.bookingDate) return null;
        if (!isSaturday) return 'Peminjaman hanya diperbolehkan pada hari Sabtu';
        return null;
    }, [form.bookingDate, isSaturday]);

    const timeValidationMsg = useMemo(() => {
        if (!form.startTime && !form.endTime) return null;
        if (!isTimeWindowValid)
            return 'Waktu harus antara 09:00 dan 17:00 dan waktu selesai harus setelah mulai';
        return null;
    }, [form.startTime, form.endTime, isTimeWindowValid]);

    // Set default times on mount
    useEffect(() => {
        if (!form.startTime) handleChange('startTime', '09:00');
        if (!form.endTime) handleChange('endTime', '17:00');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedRoom = props.rooms.find((r) => r.id === form.roomId);

    const canEditDocument = useMemo(() => {
        if (!props.editId || !props.existingDocument) return true;
        return ['DRAFT', 'REVISION'].includes(
            props.existingDocument.status || 'DRAFT',
        );
    }, [props.editId, props.existingDocument]);

    // --- FORM VALIDATION (inline) ---
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (!form.roomId || !form.bookingDate) {
            setValidationError('Lengkapi semua data wajib (ruangan dan tanggal)');
            return;
        }
        if (!/^\d{14}$/.test(form.ketua.nim)) {
            setValidationError('NIM harus 14 digit');
            return;
        }
        if (!/^\d{12,13}$/.test(form.ketua.hp)) {
            setValidationError('Nomor HP harus 12-13 digit');
            return;
        }

        submitMutation.mutate();
    };

    return (<>
        <div className='space-y-3'>
            <Stepper
                steps={[
                    { number: 1, title: 'Detail Tempat' },
                    { number: 2, title: 'Proposal' },
                    { number: 3, title: 'Tanda Tangan' },
                ]}
                currentStep={1}
            />

            <div className='max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
                <div className='mb-6'>
                    <h2 className='text-xl font-semibold'>
                        Detail Tempat - {selectedRoom?.name || 'Pilih Ruangan'}
                    </h2>
                    {selectedRoom && (
                        <button
                            type='button'
                            onClick={() => setShowRoomDetail(true)}
                            className='text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors mt-1'
                        >
                            Lihat Detail Tempat
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className='space-y-5'>
                    {/* Validation Error Banner */}
                    {validationError && (
                        <div className='flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200'>
                            <AlertCircle className='w-4 h-4 shrink-0' />
                            <span className='flex-1'>{validationError}</span>
                            <button
                                type='button'
                                onClick={() => setValidationError(null)}
                                className='text-red-400 hover:text-red-600 font-bold'
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* ROOM SELECT */}
                    <div className='space-y-2'>
                        <label className='text-sm font-medium'>Pilih Ruangan</label>
                        <Select
                            value={form.roomId?.toString()}
                            onValueChange={(val) => handleChange('roomId', Number(val))}
                            disabled={!canEditDocument}
                        >
                            <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Pilih...' />
                            </SelectTrigger>
                            <SelectContent>
                                {props.rooms.map((r) => (
                                    <SelectItem key={r.id} value={r.id.toString()}>
                                        {r.name} ({r.capacity})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* KETUA INPUTS */}
                    <div className='space-y-4 border-t pt-3'>
                        <h3 className='font-medium text-sm'>Data Ketua Pelaksana</h3>
                        <div className='space-y-1.5'>
                            <label className='text-xs font-medium text-gray-700'>Nama Ketua</label>
                            <Input
                                placeholder='Masukkan nama lengkap ketua'
                                value={form.ketua.nama}
                                onChange={(e) => handleKetuaChange('nama', e.target.value)}
                                disabled={!canEditDocument}
                                required
                            />
                        </div>
                        <div className='space-y-1.5'>
                            <label className='text-xs font-medium text-gray-700'>NIM Ketua (14 digit)</label>
                            <Input
                                placeholder='Contoh: 24060120120001'
                                value={form.ketua.nim}
                                onChange={(e) =>
                                    handleKetuaChange(
                                        'nim',
                                        e.target.value.replace(/\D/g, '').slice(0, 14),
                                    )
                                }
                                disabled={!canEditDocument}
                                required
                            />
                        </div>
                        <div className='space-y-1.5'>
                            <label className='text-xs font-medium text-gray-700'>Nomor HP Ketua</label>
                            <Input
                                placeholder='Contoh: 081234567890'
                                value={form.ketua.hp}
                                onChange={(e) =>
                                    handleKetuaChange(
                                        'hp',
                                        e.target.value.replace(/\D/g, '').slice(0, 13),
                                    )
                                }
                                disabled={!canEditDocument}
                                required
                            />
                        </div>
                    </div>

                    {/* WAKTU INPUTS */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3'>
                        <div>
                            <label className='text-sm'>Tanggal</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={'outline'}
                                        disabled={!canEditDocument}
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !form.bookingDate && 'text-muted-foreground',
                                        )}
                                    >
                                        <CalendarIcon className='mr-2 h-4 w-4' />
                                        {form.bookingDate ? (
                                            format(new Date(form.bookingDate), 'EEEE, dd MMMM yyyy', {
                                                locale: id,
                                            })
                                        ) : (
                                            <span>Pilih hari Sabtu...</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className='w-auto p-0' align='start'>
                                    <Calendar
                                        mode='single'
                                        selected={
                                            form.bookingDate ? new Date(form.bookingDate) : undefined
                                        }
                                        onSelect={(date: Date | undefined) => {
                                            if (date && canEditDocument) {
                                                const offset = date.getTimezoneOffset();
                                                const adjustedDate = new Date(
                                                    date.getTime() - offset * 60 * 1000,
                                                );
                                                const dateString = adjustedDate
                                                    .toISOString()
                                                    .split('T')[0];
                                                handleChange('bookingDate', dateString);
                                            } else if (canEditDocument) {
                                                handleChange('bookingDate', '');
                                            }
                                        }}
                                        disabled={(date: Date) => {
                                            if (!canEditDocument) return true;
                                            const isNotSaturday = date.getDay() !== 6;
                                            const isPast =
                                                date < new Date(new Date().setHours(0, 0, 0, 0));
                                            return isNotSaturday || isPast;
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                            {dateValidationMsg && (
                                <div className='text-sm text-red-600 mt-1'>
                                    {dateValidationMsg}
                                </div>
                            )}
                        </div>
                        <div className='flex gap-2'>
                            <TimePicker
                                label='Mulai'
                                value={form.startTime || '09:00'}
                                onChange={(val) => handleChange('startTime', val)}
                                disabled={!canEditDocument}
                            />
                            <TimePicker
                                label='Selesai'
                                value={form.endTime || '17:00'}
                                onChange={(val) => handleChange('endTime', val)}
                                disabled={!canEditDocument}
                            />
                        </div>
                        {timeValidationMsg && (
                            <div className='text-sm text-red-600 mt-1 md:col-span-2'>
                                {timeValidationMsg}
                            </div>
                        )}
                    </div>

                    {/* AVAILABILITY INDICATOR */}
                    {availabilityMsg && (
                        <div
                            className={`p-2 text-sm rounded flex items-center gap-2 ${availabilityMsg.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                        >
                            <AlertCircle className='w-4 h-4' /> {availabilityMsg.msg}
                        </div>
                    )}

                    {/* DOCUMENT STATUS WARNING */}
                    {!canEditDocument && (
                        <div className='p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800'>
                            <div className='flex items-center gap-2'>
                                <AlertCircle className='w-4 h-4' />
                                <span className='font-medium'>Dokumen Tidak Dapat Diedit</span>
                            </div>
                            <p className='mt-1 text-xs'>
                                Dokumen dengan status{' '}
                                <strong>{props.existingDocument?.status}</strong> sudah dikunci
                                dan tidak dapat diubah. Hanya dokumen dengan status DRAFT atau
                                REVISION yang dapat diedit.
                            </p>
                        </div>
                    )}


                    {/* BUTTONS */}
                    <div className='flex justify-end gap-3 pt-4'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => navigate({ to: '/peminjam/pinjam', search: { status: 'ALL' } })}
                        >
                            Batal
                        </Button>
                        <Button
                            type='submit'
                            disabled={
                                submitMutation.isPending ||
                                (availabilityMsg?.isError && !props.editId) ||
                                !isSaturday ||
                                !isTimeWindowValid ||
                                !canEditDocument
                            }
                        >
                            {submitMutation.isPending ? 'Menyimpan...' : 'Selanjutnya'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
        <RoomDetailModal
            open={showRoomDetail}
            onOpenChange={setShowRoomDetail}
            room={selectedRoom ?? null}
        />
    </>);
}

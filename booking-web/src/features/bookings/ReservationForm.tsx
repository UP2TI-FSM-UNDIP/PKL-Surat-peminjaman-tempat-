import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import type { Room } from '@/services/room.service';
import type { ReservationFormState } from '@/hooks/useReservation';
import { AvailabilityIndicator } from './AvailabilityIndicator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReservationFormProps {
    room: Room;
    form: ReservationFormState;
    updateForm: (field: keyof ReservationFormState, value: string) => void;
    validation: {
        isSaturday: boolean;
        isTimeValid: boolean;
        dateError: string | null;
        timeError: string | null;
    };
    availability: {
        message: string | null;
        isAvailable: boolean;
        isChecking: boolean;
    };
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    formError: string | null;
    submitError: string | null;
    successMessage: string | null;
    onShowRoomDetail: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const HOURS = Array.from({ length: 9 }, (_, i) =>
    (i + 9).toString().padStart(2, '0'),
);
const MINUTES = ['00', '15', '30', '45'];

function TimePicker({
    label,
    value,
    onChange,
    defaultHour,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    defaultHour: string;
}) {
    const [hour, minute] = value ? value.split(':') : [defaultHour, '00'];

    return (
        <div className='flex-1'>
            <label className='text-sm'>{label}</label>
            <div className='flex gap-2'>
                <Select
                    value={hour || defaultHour}
                    onValueChange={(h) => onChange(`${h}:${minute || '00'}`)}
                >
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Jam' />
                    </SelectTrigger>
                    <SelectContent position='popper' className='max-h-50'>
                        {HOURS.map((h) => (
                            <SelectItem key={h} value={h}>
                                {h}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={minute || '00'}
                    onValueChange={(m) => onChange(`${hour || defaultHour}:${m}`)}
                >
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Menit' />
                    </SelectTrigger>
                    <SelectContent className='max-h-50'>
                        {MINUTES.map((m) => (
                            <SelectItem key={m} value={m}>
                                {m}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReservationForm({
    room,
    form,
    updateForm,
    validation,
    availability,
    onSubmit,
    isSubmitting,
    formError,
    submitError,
    successMessage,
    onShowRoomDetail,
}: ReservationFormProps) {
    const displayError = formError || submitError;

    return (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 lg:w-[37.5%]'>
            <div>
                <h2 className='text-lg font-semibold text-gray-900'>
                    Reservasi Ruang {room.code}
                </h2>
                <p className='text-sm text-gray-600 mt-1'>
                    Kapasitas: {room.capacity} orang
                </p>
                <button
                    onClick={onShowRoomDetail}
                    className='text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors mt-2'
                >
                    Detail Tempat
                </button>
            </div>

            {/* Error / Success Messages */}
            {displayError && (
                <div className='flex items-center gap-2 p-3 rounded-md text-sm bg-red-50 text-red-700'>
                    <AlertCircle className='w-4 h-4 shrink-0' />
                    <span>{displayError}</span>
                </div>
            )}
            {successMessage && (
                <div className='flex items-center gap-2 p-3 rounded-md text-sm bg-green-50 text-green-700'>
                    <AlertCircle className='w-4 h-4 shrink-0' />
                    <span>{successMessage}</span>
                </div>
            )}

            <form onSubmit={onSubmit} className='space-y-5'>
                {/* Data Ketua Pelaksana */}
                <div className='space-y-3'>
                    <p className='text-sm font-medium text-gray-700'>
                        Data Ketua Pelaksana
                    </p>

                    <div className='space-y-2'>
                        <label className='block text-sm text-gray-600'>
                            Nama Ketua Pelaksana *
                        </label>
                        <Input
                            placeholder='Masukkan nama ketua pelaksana'
                            value={form.ketuaNama}
                            onChange={(e) => updateForm('ketuaNama', e.target.value)}
                            required
                        />
                    </div>

                    <div className='space-y-2'>
                        <label className='block text-sm text-gray-600'>
                            NIM (14 digit) *
                        </label>
                        <Input
                            placeholder='Contoh: 20210801012345'
                            value={form.ketuaNim}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 14) updateForm('ketuaNim', value);
                            }}
                            maxLength={14}
                            required
                        />
                        <p className='text-xs text-gray-500'>Hanya angka, 14 digit</p>
                    </div>

                    <div className='space-y-2'>
                        <label className='block text-sm text-gray-600'>
                            No HP (12-13 digit) *
                        </label>
                        <Input
                            type='tel'
                            placeholder='Contoh: 081234567890'
                            value={form.ketuaHp}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 13) updateForm('ketuaHp', value);
                            }}
                            maxLength={13}
                            required
                        />
                        <p className='text-xs text-gray-500'>Hanya angka, 12-13 digit</p>
                    </div>
                </div>

                {/* Waktu & Tanggal */}
                <div className='space-y-3'>
                    <p className='text-sm font-medium text-gray-700'>Waktu & Tanggal</p>

                    <div className='space-y-3'>
                        <div className='flex flex-col gap-2'>
                            <label className='text-sm text-gray-700'>Tanggal</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={'outline'}
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !form.bookingDate && 'text-muted-foreground',
                                        )}
                                    >
                                        <CalendarIcon className='mr-2 h-4 w-4' />
                                        {form.bookingDate ? (
                                            format(
                                                new Date(form.bookingDate),
                                                'EEEE, dd MMMM yyyy',
                                                { locale: id },
                                            )
                                        ) : (
                                            <span>Pilih hari Sabtu...</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className='w-auto p-0' align='start'>
                                    <Calendar
                                        mode='single'
                                        selected={
                                            form.bookingDate
                                                ? new Date(form.bookingDate)
                                                : undefined
                                        }
                                        onSelect={(date: Date | undefined) => {
                                            if (date) {
                                                const offset = date.getTimezoneOffset();
                                                const adjustedDate = new Date(
                                                    date.getTime() - offset * 60 * 1000,
                                                );
                                                const dateString = adjustedDate
                                                    .toISOString()
                                                    .split('T')[0];
                                                updateForm('bookingDate', dateString);
                                            } else {
                                                updateForm('bookingDate', '');
                                            }
                                        }}
                                        disabled={(date: Date) => {
                                            const isNotSaturday = date.getDay() !== 6;
                                            const isPast =
                                                date < new Date(new Date().setHours(0, 0, 0, 0));
                                            return isNotSaturday || isPast;
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            {validation.dateError && (
                                <div className='text-sm text-red-600 mt-1'>
                                    {validation.dateError}
                                </div>
                            )}

                            <div className='flex gap-2'>
                                <TimePicker
                                    label='Mulai'
                                    value={form.startTime}
                                    onChange={(v) => updateForm('startTime', v)}
                                    defaultHour='09'
                                />
                                <div className='flex-1'>
                                    <TimePicker
                                        label='Selesai'
                                        value={form.endTime}
                                        onChange={(v) => updateForm('endTime', v)}
                                        defaultHour='17'
                                    />
                                    {validation.timeError && (
                                        <div className='text-sm text-red-600 mt-1'>
                                            {validation.timeError}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Availability Indicator */}
                    <AvailabilityIndicator
                        message={availability.message}
                        isAvailable={availability.isAvailable}
                        isChecking={availability.isChecking}
                    />
                </div>

                {/* Nama Kegiatan */}
                <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-700'>
                        Nama Kegiatan
                    </label>
                    <Textarea
                        placeholder='Jelaskan kegiatan yang akan dilakukan...'
                        value={form.activity}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            updateForm('activity', e.target.value)
                        }
                        rows={4}
                        className='resize-none'
                        required
                    />
                </div>

                <div className='flex justify-end'>
                    <Button
                        type='submit'
                        className='mt-2'
                        disabled={
                            isSubmitting ||
                            availability.isChecking ||
                            (availability.message !== null && !availability.isAvailable) ||
                            !validation.isSaturday ||
                            !validation.isTimeValid
                        }
                    >
                        {isSubmitting ? 'Memproses...' : 'Reservasi'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

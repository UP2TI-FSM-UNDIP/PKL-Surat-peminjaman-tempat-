import { useEffect } from 'react';
import { Controller, useFieldArray, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Button } from '@/components/ui/button/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { Room } from '@/services/room.service';
import type { BookingRuleDate, ReservationMode } from '@/types/reservation';
import type { ReservationWizardValues } from './reservationForm.types';

interface Props {
  control: Control<ReservationWizardValues>;
  setValue: UseFormSetValue<ReservationWizardValues>;
  mode: ReservationMode;
  rooms: Room[];
  rulesByDate: Record<string, BookingRuleDate | undefined>;
  maxRows: number;
  rowErrors: Record<number, string[]>;
  availability?: Record<number, boolean>;
}

export function SlotEditor({ control, setValue, mode, rooms, rulesByDate, maxRows, rowErrors, availability }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'slots' });
  const roomId = useWatch({ control, name: 'room_id' });
  const bookingDate = useWatch({ control, name: 'booking_date' });
  const slots = useWatch({ control, name: 'slots' }) ?? [];

  useEffect(() => {
    for (let index = 0; index < fields.length; index += 1) {
      if (mode === 'one_room_many_dates' && roomId) {
        setValue(`slots.${index}.room_id`, roomId, { shouldDirty: true });
      }
      if (mode === 'one_date_many_rooms' && bookingDate) {
        setValue(`slots.${index}.booking_date`, bookingDate, { shouldDirty: true });
      }
    }
  }, [bookingDate, fields.length, mode, roomId, setValue]);

  const addRow = () => {
    append({
      room_id: mode === 'one_room_many_dates' ? (roomId ?? 0) : 0,
      booking_date: mode === 'one_date_many_rooms' ? bookingDate : '',
      start_time: '09:00',
      end_time: mode === 'one_date_many_rooms' ? '16:30' : '16:30',
    });
  };

  return (
    <div className="space-y-3">
      <div className="hidden gap-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1fr_1fr_110px_110px_44px]">
        <span>{mode === 'one_room_many_dates' ? 'Tanggal' : 'Ruang'}</span>
        <span>Keterangan</span>
        <span>Mulai</span>
        <span>Selesai</span>
        <span />
      </div>
      {fields.map((field, index) => {
        const rowSlot = slots[index];
        const date = mode === 'one_room_many_dates' ? rowSlot?.booking_date : bookingDate;
        const rowRoomId = mode === 'one_room_many_dates' ? roomId : rowSlot?.room_id;
        const rule = rulesByDate[date ?? ''];
        const maxEnd = rule?.rooms.find((room) => room.id === rowRoomId)?.max_end_time ?? '16:30';
        return (
          <div key={field.id} className="space-y-1 rounded-md border p-3">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_110px_110px_44px] md:items-center">
              {mode === 'one_room_many_dates' ? (
                <Controller
                  control={control}
                  name={`slots.${index}.booking_date`}
                  render={({ field: dateField }) => (
                    <DateInput
                      id={`slot-${index}-booking-date`}
                      value={dateField.value}
                      onChange={dateField.onChange}
                      aria-label="Tanggal"
                    />
                  )}
                />
              ) : (
                <Controller
                  control={control}
                  name={`slots.${index}.room_id`}
                  render={({ field: roomField }) => (
                    <Select value={String(roomField.value || '')} onValueChange={(value) => roomField.onChange(Number(value))}>
                      <SelectTrigger aria-label="Ruang"><SelectValue placeholder="Pilih ruang" /></SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={String(room.id)}>{room.code} — {room.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              <span className="text-sm text-muted-foreground">
                {mode === 'one_room_many_dates'
                  ? rooms.find((room) => room.id === roomId)?.code ?? 'Belum dipilih'
                  : rulesByDate[bookingDate]?.day_type === 'saturday' ? 'Sabtu' : 'Hari kerja'}
              </span>
              <Controller
                control={control}
                name={`slots.${index}.start_time`}
                render={({ field: timeField }) => <Input type="time" aria-label="Jam mulai" value={timeField.value} onChange={timeField.onChange} />}
              />
              <Controller
                control={control}
                name={`slots.${index}.end_time`}
                render={({ field: timeField }) => <Input type="time" aria-label="Jam selesai" max={maxEnd} value={timeField.value} onChange={timeField.onChange} />}
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Hapus slot" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {rowErrors[index]?.map((error) => (
              <p key={error} className="text-xs text-destructive">{error}</p>
            ))}
            {availability?.[index] === false && (
              <p className="text-xs text-destructive">Slot ini bentrok dengan booking lain.</p>
            )}
          </div>
        );
      })}
      <Button type="button" variant="outline" onClick={addRow} disabled={fields.length >= maxRows}>
        {mode === 'one_room_many_dates' ? 'Tambah tanggal' : 'Tambah ruang'}
      </Button>
    </div>
  );
}

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface TimePickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function TimePicker({ label, value, onChange, disabled }: TimePickerProps) {
    const [hour, minute] = value.split(':');
    return (
        <div className='flex-1'>
            <label className='text-sm'>{label}</label>
            <div className='flex gap-2'>
                <Select
                    value={hour || '09'}
                    onValueChange={(h) => onChange(`${h}:${minute || '00'}`)}
                    disabled={disabled}
                >
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Jam' />
                    </SelectTrigger>
                    <SelectContent position='popper' className='max-h-50'>
                        {Array.from({ length: 9 }, (_, i) => {
                            const h = (i + 9).toString().padStart(2, '0');
                            return (
                                <SelectItem key={h} value={h}>
                                    {h}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                <Select
                    value={minute || '00'}
                    onValueChange={(m) => onChange(`${hour || '09'}:${m}`)}
                    disabled={disabled}
                >
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Menit' />
                    </SelectTrigger>
                    <SelectContent className='max-h-50'>
                        {['00', '15', '30', '45'].map((m) => (
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

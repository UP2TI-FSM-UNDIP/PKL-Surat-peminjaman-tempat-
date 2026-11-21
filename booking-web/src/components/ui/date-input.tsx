import { CalendarDays } from 'lucide-react';
import { formatDateId } from '@/lib/date';
import { cn } from '@/lib/utils';

interface DateInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  min?: string;
  max?: string;
}

export function DateInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = 'Pilih tanggal',
  disabled,
  className,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  min,
  max,
}: DateInputProps) {
  return (
    <div className={cn('relative', className)}>
      <input
        id={id}
        name={name}
        type='date'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onClick={(event) => {
          const input = event.currentTarget;
          if (typeof input.showPicker === 'function') {
            try {
              input.showPicker();
            } catch {
              // Browser dapat menolak showPicker saat dialog sudah terbuka.
            }
          }
        }}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        min={min}
        max={max}
        className='peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
      />
      <span
        aria-hidden='true'
        className={cn(
          'pointer-events-none flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] md:text-sm',
          'peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 peer-focus-visible:ring-[3px]',
          'peer-disabled:opacity-50',
          'peer-aria-invalid:border-destructive',
          !value && 'text-muted-foreground',
        )}
      >
        <span className='min-w-0 flex-1 truncate'>
          {value ? formatDateId(value) : placeholder}
        </span>
        <CalendarDays className='h-4 w-4 shrink-0 text-muted-foreground' />
      </span>
    </div>
  );
}

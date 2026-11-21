import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export function formatDateId(value: string | Date, pattern = 'd MMMM yyyy'): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, pattern, { locale: localeId });
}

export function formatDateTimeId(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

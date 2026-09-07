import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type CalendarProps = DayPickerProps;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-4 bg-white rounded-lg border', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-start pt-1 relative items-center',
        caption_label: 'text-base font-bold',
        nav: 'absolute right-1 space-x-1 flex items-center',
        nav_button: cn(
          'h-8 w-8 bg-transparent p-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 border border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        ),
        nav_button_previous: '',
        nav_button_next: '',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'text-gray-500 rounded-md w-10 font-semibold text-xs flex items-center justify-center',
        week: 'flex w-full mt-2',
        day_button:
          'h-10 w-10 p-0 font-medium rounded-md transition-all inline-flex items-center justify-center',
        day: 'h-10 w-10 p-0 relative flex items-center justify-center',
        range_end: 'day-range-end',
        selected:
          'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 font-bold shadow-sm',
        today: 'bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500',
        outside: 'text-gray-300 opacity-50',
        disabled:
          'text-gray-200 opacity-40 cursor-not-allowed hover:bg-transparent',
        range_middle: 'aria-selected:bg-blue-100 aria-selected:text-blue-900',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className='h-4 w-4' />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  textColor: string;
  bgLight: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  textColor,
  bgLight,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between h-full min-h-[85px] ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
      onClick={onClick}
    >
      <div className='flex items-start justify-between gap-1 mb-2'>
        <h3 className='text-xl sm:text-2xl font-bold text-gray-900 leading-none'>
          {value}
        </h3>
        <div
          className={`${bgLight} p-1.5 sm:p-2 rounded-lg flex items-center justify-center shrink-0`}
        >
          <Icon className={`${textColor} w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5`} />
        </div>
      </div>
      <p className='text-[10px] sm:text-xs font-medium text-gray-600 leading-snug line-clamp-2 mt-auto'>{title}</p>
    </div>
  );
}

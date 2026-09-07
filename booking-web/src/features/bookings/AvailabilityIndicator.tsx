import { AlertCircle } from 'lucide-react';

interface AvailabilityIndicatorProps {
    message: string | null;
    isAvailable: boolean;
    isChecking: boolean;
}

export function AvailabilityIndicator({
    message,
    isAvailable,
    isChecking,
}: AvailabilityIndicatorProps) {
    if (isChecking) {
        return (
            <div className='flex items-center gap-2 p-3 rounded-md text-sm bg-blue-50 text-blue-700'>
                <AlertCircle className='w-4 h-4 animate-pulse' />
                <span>Mengecek ketersediaan...</span>
            </div>
        );
    }

    if (!message) return null;

    return (
        <div
            className={`flex items-center gap-2 p-3 rounded-md text-sm ${isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
        >
            <AlertCircle className='w-4 h-4' />
            <span>{message}</span>
        </div>
    );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button/button';
import { Camera } from 'lucide-react';
import type { Room } from '@/services/room.service';

interface DetailRoomModalProps {
    room: Room | null;
    isOpen: boolean;
    onClose: () => void;
}

export function DetailRoomModal({ room, isOpen, onClose }: DetailRoomModalProps) {
    if (!room) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>Detail Ruangan</DialogTitle>
                </DialogHeader>
                <div className='space-y-6 py-4'>
                    {/* Image Gallery */}
                    <div className='space-y-2'>
                        <p className='text-sm font-semibold text-gray-700'>Foto Ruangan</p>
                        {room.images && room.images.length > 0 ? (
                            <div className='flex gap-4 overflow-x-auto pb-4 snap-x'>
                                {room.images.map((path, idx) => (
                                    <div
                                        key={idx}
                                        className='relative flex-shrink-0 w-full sm:w-80 aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200 snap-center shadow-sm'
                                    >
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}/rooms/${room.id}/image?path=${encodeURIComponent(path)}`}
                                            alt={`${room.name} - ${idx + 1}`}
                                            className='h-full w-full object-cover transition-transform hover:scale-105 duration-300'
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='w-full aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400'>
                                <Camera className='h-12 w-12 mb-2 opacity-20' />
                                <p className='text-xs font-medium'>Belum ada foto ruangan</p>
                            </div>
                        )}
                    </div>

                    <div className='grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100'>
                        <div>
                            <p className='text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1'>Kode Ruang</p>
                            <p className='text-sm font-semibold text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm inline-block min-w-[80px] text-center'>
                                {room.code}
                            </p>
                        </div>
                        <div>
                            <p className='text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1'>Kapasitas</p>
                            <p className='text-sm font-semibold text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm inline-block min-w-[80px] text-center'>
                                {room.capacity} Orang
                            </p>
                        </div>
                    </div>

                    <div className='space-y-1.5'>
                        <p className='text-[10px] uppercase tracking-wider font-bold text-gray-400'>Nama Ruangan</p>
                        <p className='text-base font-bold text-gray-900'>{room.name}</p>
                    </div>

                    {room.description && (
                        <div className='space-y-1.5'>
                            <p className='text-[10px] uppercase tracking-wider font-bold text-gray-400'>Deskripsi</p>
                            <p className='text-sm text-gray-600 leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100/30'>
                                {room.description}
                            </p>
                        </div>
                    )}

                    {room.facilities && room.facilities.length > 0 && (
                        <div className='space-y-2'>
                            <p className='text-[10px] uppercase tracking-wider font-bold text-gray-400'>Fasilitas</p>
                            <div className='flex flex-wrap gap-2'>
                                {room.facilities.map((facility, index) => (
                                    <span
                                        key={index}
                                        className='inline-flex items-center rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-100 shadow-sm'
                                    >
                                        <div className='w-1 h-1 rounded-full bg-green-400 mr-2' />
                                        {facility}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className='pt-2 border-t border-gray-100'>
                        <p className='text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2'>Status</p>
                        <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${room.status === 'ACTIVE'
                                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                                    : room.status === 'MAINTENANCE'
                                        ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                                        : 'bg-red-50 text-red-700 ring-red-600/20'
                                }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full mr-2 ${room.status === 'ACTIVE' ? 'bg-green-500' : room.status === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                            />
                            {room.status === 'ACTIVE' ? 'Aktif' : room.status === 'MAINTENANCE' ? 'Maintenance' : 'Nonaktif'}
                        </span>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Building2, Users, MapPin, Layers, Info } from 'lucide-react';
import type { Room } from '@/services/room.service';

interface RoomDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: Room | null;
}

export function RoomDetailModal({
    open,
    onOpenChange,
    room,
}: RoomDetailModalProps) {
    if (!room) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle className='text-2xl font-bold text-gray-900'>
                        Detail Ruangan
                    </DialogTitle>
                    <DialogDescription className='text-sm text-gray-600'>
                        Informasi lengkap tentang ruangan yang dipilih
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-6 py-4'>
                    {/* Room Images */}
                    {(() => {
                        const imageList =
                            room.images && room.images.length > 0
                                ? room.images
                                : room.image_url
                                    ? [room.image_url]
                                    : [];

                        if (imageList.length === 0) {
                            return (
                                <div className='aspect-video w-full rounded-lg bg-gray-100 flex items-center justify-center'>
                                    <div className='text-center text-gray-400'>
                                        <Building2 className='w-12 h-12 mx-auto mb-2' />
                                        <p className='text-sm'>Belum ada foto ruangan</p>
                                    </div>
                                </div>
                            );
                        }

                        if (imageList.length === 1) {
                            return (
                                <div className='aspect-video w-full overflow-hidden rounded-lg bg-gray-100'>
                                    <img
                                        src={imageList[0]}
                                        alt={room.name}
                                        className='w-full h-full object-cover'
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            );
                        }

                        return (
                            <div className='space-y-3'>
                                <h3 className='text-sm font-semibold text-gray-700'>
                                    Foto Ruangan
                                </h3>
                                <div className='grid grid-cols-2 gap-3'>
                                    {imageList.map((image, index) => (
                                        <div
                                            key={index}
                                            className='relative aspect-video rounded-lg overflow-hidden border border-gray-200'
                                        >
                                            <img
                                                src={image}
                                                alt={`${room.name} - ${index + 1}`}
                                                className='w-full h-full object-cover'
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Room Basic Info */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                            <div className='flex items-center gap-2 text-gray-600'>
                                <Building2 className='w-4 h-4' />
                                <span className='text-sm font-medium'>Kode Ruangan</span>
                            </div>
                            <p className='text-base font-semibold text-gray-900 ml-6'>
                                {room.code}
                            </p>
                        </div>

                        <div className='space-y-2'>
                            <div className='flex items-center gap-2 text-gray-600'>
                                <Building2 className='w-4 h-4' />
                                <span className='text-sm font-medium'>Nama Ruangan</span>
                            </div>
                            <p className='text-base font-semibold text-gray-900 ml-6'>
                                {room.name}
                            </p>
                        </div>

                        <div className='space-y-2'>
                            <div className='flex items-center gap-2 text-gray-600'>
                                <Users className='w-4 h-4' />
                                <span className='text-sm font-medium'>Kapasitas</span>
                            </div>
                            <p className='text-base font-semibold text-gray-900 ml-6'>
                                {room.capacity} orang
                            </p>
                        </div>

                        <div className='space-y-2'>
                            <div className='flex items-center gap-2 text-gray-600'>
                                <Info className='w-4 h-4' />
                                <span className='text-sm font-medium'>Status</span>
                            </div>
                            <p className='ml-6'>
                                <span
                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${room.status === 'ACTIVE'
                                        ? 'bg-green-100 text-green-800'
                                        : room.status === 'MAINTENANCE'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                >
                                    {room.status === 'ACTIVE'
                                        ? 'Aktif'
                                        : room.status === 'MAINTENANCE'
                                            ? 'Maintenance'
                                            : 'Tidak Aktif'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Location Info */}
                    {(room.building || room.floor || room.location) && (
                        <div className='space-y-3'>
                            <h3 className='text-sm font-semibold text-gray-700'>
                                Lokasi
                            </h3>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {room.building && (
                                    <div className='space-y-2'>
                                        <div className='flex items-center gap-2 text-gray-600'>
                                            <Building2 className='w-4 h-4' />
                                            <span className='text-sm font-medium'>Gedung</span>
                                        </div>
                                        <p className='text-base text-gray-900 ml-6'>
                                            {room.building}
                                        </p>
                                    </div>
                                )}

                                {room.floor && (
                                    <div className='space-y-2'>
                                        <div className='flex items-center gap-2 text-gray-600'>
                                            <Layers className='w-4 h-4' />
                                            <span className='text-sm font-medium'>Lantai</span>
                                        </div>
                                        <p className='text-base text-gray-900 ml-6'>
                                            {room.floor}
                                        </p>
                                    </div>
                                )}

                                {room.location && (
                                    <div className='space-y-2 md:col-span-2'>
                                        <div className='flex items-center gap-2 text-gray-600'>
                                            <MapPin className='w-4 h-4' />
                                            <span className='text-sm font-medium'>Lokasi Detail</span>
                                        </div>
                                        <p className='text-base text-gray-900 ml-6'>
                                            {room.location}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {room.description && (
                        <div className='space-y-3'>
                            <h3 className='text-sm font-semibold text-gray-700'>
                                Deskripsi
                            </h3>
                            <p className='text-sm text-gray-700 leading-relaxed'>
                                {room.description}
                            </p>
                        </div>
                    )}

                    {/* Facilities */}
                    {room.facilities && room.facilities.length > 0 && (
                        <div className='space-y-3'>
                            <h3 className='text-sm font-semibold text-gray-700'>
                                Fasilitas
                            </h3>
                            <div className='flex flex-wrap gap-2'>
                                {room.facilities.map((facility, index) => (
                                    <span
                                        key={index}
                                        className='inline-flex items-center px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200'
                                    >
                                        {facility}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Room } from '@/services/room.service';
import type { ChangeEvent } from 'react';

interface RoomFormProps {
    formData: {
        name: string;
        code: string;
        capacity: string;
        description: string;
        facilities: string;
        status: Room['status'];
    };
    setFormData: (data: any) => void;
    onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
    formError?: string;
    isSubmitting: boolean;
    onCancel: () => void;
    submitLabel: string;
    showStatus?: boolean;
}

export function RoomForm({
    formData,
    setFormData,
    onFileChange,
    formError,
    isSubmitting,
    onCancel,
    submitLabel,
    showStatus = false,
}: RoomFormProps) {
    return (
        <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
                <label htmlFor='code' className='text-sm font-medium'>
                    Kode Ruangan <span className='text-red-500'>*</span>
                </label>
                <Input
                    id='code'
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder='A101'
                    required
                />
            </div>
            <div className='grid gap-2'>
                <label htmlFor='name' className='text-sm font-medium'>
                    Nama Ruangan <span className='text-red-500'>*</span>
                </label>
                <Input
                    id='name'
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder='Ruang Kelas A101'
                    required
                />
            </div>
            <div className='grid gap-2'>
                <label htmlFor='capacity' className='text-sm font-medium'>
                    Kapasitas Ruangan <span className='text-red-500'>*</span>
                </label>
                <Input
                    id='capacity'
                    type='number'
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                />
            </div>
            <div className='grid gap-2'>
                <label htmlFor='facilities' className='text-sm font-medium'>
                    Fasilitas (pisahkan dengan koma)
                </label>
                <textarea
                    id='facilities'
                    value={formData.facilities}
                    onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                    placeholder='AC, Proyektor, Whiteboard'
                    rows={3}
                    className='block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                />
            </div>
            <div className='grid gap-2'>
                <label htmlFor='description' className='text-sm font-medium'>
                    Deskripsi/Catatan
                </label>
                <textarea
                    id='description'
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder='Ruang kelas untuk kuliah umum'
                    rows={3}
                    className='block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                />
            </div>

            {showStatus && (
                <div className='grid gap-2'>
                    <label htmlFor='status' className='text-sm font-medium'>
                        Status Ruangan <span className='text-red-500'>*</span>
                    </label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as Room['status'] })}
                    >
                        <SelectTrigger id='status'>
                            <SelectValue placeholder='Pilih Status' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='ACTIVE'>Aktif</SelectItem>
                            <SelectItem value='MAINTENANCE'>Maintenance</SelectItem>
                            <SelectItem value='INACTIVE'>Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className='grid gap-2'>
                <label htmlFor='image' className='text-sm font-medium'>
                    Foto Ruangan {showStatus && '(Upload baru untuk mengganti)'}
                </label>
                <Input
                    id='image'
                    type='file'
                    accept='image/*'
                    onChange={onFileChange}
                />
            </div>
            {formError && <p className='text-sm text-red-600 font-medium'>{formError}</p>}

            <div className='flex justify-end gap-3 mt-4'>
                <Button
                    type='button'
                    variant='outline'
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Batal
                </Button>
                <Button type='submit' disabled={isSubmitting} className='bg-blue-600 hover:bg-blue-700 text-white'>
                    {isSubmitting ? 'Menyimpan...' : submitLabel}
                </Button>
            </div>
        </div>
    );
}

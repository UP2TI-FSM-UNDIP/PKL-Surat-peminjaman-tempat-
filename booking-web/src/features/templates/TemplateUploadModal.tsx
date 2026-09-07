import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { TemplateType, OrganizationType } from '@/types/template.types';
import type { TemplateFormData } from './useTemplateManagement';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: TemplateFormData;
    onFormChange: (data: TemplateFormData) => void;
    selectedFile: File | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    formError: string;
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TemplateUploadModal({
    open,
    onOpenChange,
    formData,
    onFormChange,
    selectedFile,
    onFileChange,
    formError,
    isSubmitting,
    onSubmit,
}: TemplateUploadModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>Upload Template Baru</DialogTitle>
                    <DialogDescription>
                        Upload template dokumen (.docx) untuk Executive Summary atau Lembar Pengesahan
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit}>
                    <div className='space-y-4 py-4'>
                        <div>
                            <label className='text-sm font-medium mb-2 block'>
                                Tipe Template <span className='text-red-500'>*</span>
                            </label>
                            <Select
                                value={formData.template_type}
                                onValueChange={(value) => {
                                    onFormChange({
                                        ...formData,
                                        template_type: value as TemplateType,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='executive_summary'>Executive Summary</SelectItem>
                                    <SelectItem value='lembar_pengesahan'>Lembar Pengesahan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className='text-sm font-medium mb-2 block'>
                                Peruntukan Organisasi <span className='text-red-500'>*</span>
                            </label>
                            <Select
                                value={formData.organization_type || 'general'}
                                onValueChange={(value) =>
                                    onFormChange({
                                        ...formData,
                                        organization_type: value as OrganizationType | 'general',
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='Pilih peruntukan organisasi' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='general'>Umum / Semua (Tanpa filter unit)</SelectItem>
                                    <SelectItem value='hmd'>Khusus HMD (Himpunan)</SelectItem>
                                    <SelectItem value='bem_ukm'>Khusus BEM / UKM</SelectItem>
                                    <SelectItem value='senat'>Khusus Senat</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className='text-xs text-gray-500 mt-1'>
                                Pilih "Umum" jika template ini bisa digunakan oleh semua jenis organisasi.
                            </p>
                        </div>

                        <div>
                            <label className='text-sm font-medium mb-2 block'>
                                Nama Template <span className='text-red-500'>*</span>
                            </label>
                            <Input
                                value={formData.template_name}
                                onChange={(e) =>
                                    onFormChange({ ...formData, template_name: e.target.value })
                                }
                                placeholder='Misal: Template Executive Summary 2026'
                            />
                        </div>

                        <div>
                            <label className='text-sm font-medium mb-2 block'>
                                File Template <span className='text-red-500'>*</span>
                            </label>
                            <Input
                                type='file'
                                accept='.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                onChange={onFileChange}
                            />
                            <p className='text-xs text-gray-500 mt-1'>
                                Format: .docx atau .doc (Maksimal 10MB)
                            </p>
                            {selectedFile && (
                                <p className='text-sm text-green-600 mt-1'>
                                    File terpilih: {selectedFile.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className='text-sm font-medium mb-2 block'>Deskripsi</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) =>
                                    onFormChange({ ...formData, description: e.target.value })
                                }
                                placeholder='Catatan atau deskripsi template (opsional)'
                                rows={3}
                            />
                        </div>

                        <div className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                id='set_as_active'
                                checked={formData.set_as_active}
                                onChange={(e) =>
                                    onFormChange({ ...formData, set_as_active: e.target.checked })
                                }
                                className='rounded'
                            />
                            <label htmlFor='set_as_active' className='text-sm'>
                                Aktifkan template ini setelah upload
                            </label>
                        </div>

                        {formError && (
                            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
                                {formError}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button type='submit' disabled={isSubmitting}>
                            {isSubmitting ? 'Mengupload...' : 'Upload Template'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

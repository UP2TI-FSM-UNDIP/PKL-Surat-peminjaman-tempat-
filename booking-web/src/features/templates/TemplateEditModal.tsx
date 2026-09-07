import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    type TemplateFormData,
    ORG_TYPE_LABELS,
} from './useTemplateManagement';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateEditModalProps {
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

export function TemplateEditModal({
    open,
    onOpenChange,
    formData,
    onFormChange,
    selectedFile,
    onFileChange,
    formError,
    isSubmitting,
    onSubmit,
}: TemplateEditModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-[500px]'>
                <DialogHeader>
                    <DialogTitle>Edit Template</DialogTitle>
                    <DialogDescription>Update informasi atau file template</DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit}>
                    <div className='space-y-4 py-4'>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md border text-xs">
                            <div>
                                <span className="text-gray-500 block mb-1">Tipe Template</span>
                                <span className="font-semibold uppercase">{formData.template_type.replace('_', ' ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Peruntukan Organisasi</span>
                                <span className="font-semibold">{ORG_TYPE_LABELS[formData.organization_type] || 'Umum'}</span>
                            </div>
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
                                placeholder='Nama template'
                            />
                        </div>

                        <div>
                            <label className='text-sm font-medium mb-2 block'>
                                File Template (Opsional)
                            </label>
                            <Input
                                type='file'
                                accept='.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                onChange={onFileChange}
                            />
                            <p className='text-xs text-gray-500 mt-1'>
                                Kosongkan jika tidak ingin mengganti file
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
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

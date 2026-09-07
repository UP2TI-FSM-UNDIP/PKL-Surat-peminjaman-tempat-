import {
    FileText,
    Download,
    Trash2,
    CheckCircle,
    Circle,
    Eye,
    Pencil,
    Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { DocumentTemplate } from '@/types/template.types';
import { TEMPLATE_TYPE_LABELS, ORG_TYPE_LABELS } from './useTemplateManagement';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateTableProps {
    templates: DocumentTemplate[];
    typeFilter: string;
    onTypeFilterChange: (value: string) => void;
    onUploadClick: () => void;
    onPreview: (template: DocumentTemplate) => void;
    onDownload: (template: DocumentTemplate) => void;
    onEdit: (template: DocumentTemplate) => void;
    onDelete: (template: DocumentTemplate) => void;
    onStatusChange: (template: DocumentTemplate, newStatus: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TemplateTable({
    templates,
    typeFilter,
    onTypeFilterChange,
    onUploadClick,
    onPreview,
    onDownload,
    onEdit,
    onDelete,
    onStatusChange,
}: TemplateTableProps) {
    return (
        <>
            {/* Filters & Actions */}
            <div className='mb-6 flex items-center justify-between gap-4'>
                <div className='flex items-center gap-4'>
                    <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                        <SelectTrigger className='w-[200px]'>
                            <SelectValue placeholder='Semua Template' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>Semua Template</SelectItem>
                            <SelectItem value='executive_summary'>Executive Summary</SelectItem>
                            <SelectItem value='lembar_pengesahan'>Lembar Pengesahan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={onUploadClick}>
                    <Plus className='w-4 h-4 mr-2' />
                    Upload Template
                </Button>
            </div>

            {/* Table */}
            <div className='bg-white rounded-lg border'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Template</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Organisasi</TableHead>
                            <TableHead>Versi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Diupload Oleh</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className='text-center text-xs sm:text-sm w-20 sm:w-auto'>
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className='text-center py-8 text-gray-500'>
                                    Belum ada template
                                </TableCell>
                            </TableRow>
                        ) : (
                            templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className='font-medium'>
                                        <div className='flex items-center gap-2'>
                                            <FileText className='w-4 h-4 text-blue-600' />
                                            {template.template_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{TEMPLATE_TYPE_LABELS[template.template_type]}</TableCell>
                                    <TableCell>
                                        {template.organization_type ? (
                                            <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium'>
                                                {ORG_TYPE_LABELS[template.organization_type]}
                                            </span>
                                        ) : (
                                            <span className='text-gray-400 text-xs'>-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className='px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium'>
                                            v{template.version}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={template.is_active ? 'active' : 'inactive'}
                                            onValueChange={(value) => onStatusChange(template, value)}
                                        >
                                            <SelectTrigger
                                                className={`h-8 w-[110px] ${template.is_active
                                                    ? 'text-green-600 border-green-200 bg-green-50'
                                                    : 'text-gray-600 border-gray-200 bg-gray-50'
                                                    }`}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value='active' className='text-green-600 focus:text-green-700'>
                                                    <div className='flex items-center gap-2'>
                                                        <CheckCircle className='w-4 h-4' />
                                                        <span>Aktif</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value='inactive' className='text-gray-600 focus:text-gray-700'>
                                                    <div className='flex items-center gap-2'>
                                                        <Circle className='w-4 h-4' />
                                                        <span>Nonaktif</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>{template.uploader?.name || '-'}</TableCell>
                                    <TableCell>
                                        {new Date(template.created_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </TableCell>
                                    <TableCell className='py-2 sm:py-3'>
                                        <div className='flex items-center justify-center gap-1 sm:gap-2'>
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={() => onPreview(template)}
                                                className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                                                title='Preview Template'
                                            >
                                                <Eye className='h-3 w-3 sm:h-4 sm:w-4' />
                                            </Button>
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={() => onDownload(template)}
                                                className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                                                title='Download template'
                                            >
                                                <Download className='h-3 w-3 sm:h-4 sm:w-4' />
                                            </Button>
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={() => onEdit(template)}
                                                className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                                                title='Edit info template'
                                            >
                                                <Pencil className='h-3 w-3 sm:h-4 sm:w-4' />
                                            </Button>
                                            {!template.is_active && (
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    onClick={() => onDelete(template)}
                                                    className='h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                                                    title='Hapus template'
                                                >
                                                    <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}

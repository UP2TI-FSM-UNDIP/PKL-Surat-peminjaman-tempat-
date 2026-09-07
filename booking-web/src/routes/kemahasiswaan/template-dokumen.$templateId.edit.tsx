import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { AxiosError } from 'axios';
import {
  FileText,
  Download,
  Upload,
  Save,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TemplatePreview } from '@/features/templates/TemplatePreview';

import { documentTemplateService } from '@/services/document-template.service';
import type { DocumentTemplate } from '@/types/template.types';

export const Route = createFileRoute(
  '/kemahasiswaan/template-dokumen/$templateId/edit',
)({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { templateId } = Route.useParams();

  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    template_name: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [, setDetectedPlaceholders] = useState<string[]>(
    [],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await documentTemplateService.getTemplate(
        Number(templateId),
      );
      setTemplate(data);
      setFormData({
        template_name: data.template_name,
        description: data.description || '',
      });
    } catch (err) {
      console.error('Failed to fetch template:', err);
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Gagal memuat template');
      } else {
        setError('Gagal memuat template');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];

      if (!validTypes.includes(file.type)) {
        setSaveError('File harus berformat .docx atau .doc');
        setSelectedFile(null);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setSaveError('Ukuran file maksimal 10MB');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setSaveError(null);
    }
  };

  const handleSave = async () => {
    if (!template) return;

    if (!formData.template_name.trim()) {
      setSaveError('Nama template harus diisi');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      await documentTemplateService.updateTemplate(template.id, {
        template_name: formData.template_name,
        file: selectedFile || undefined,
        description: formData.description || undefined,
      });

      setSaveSuccess(true);

      // Refresh template data
      await fetchTemplate();

      // Clear file input if file was uploaded
      if (selectedFile) {
        setSelectedFile(null);
        // Reset file input using ref
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      if (err instanceof AxiosError) {
        const errors = err.response?.data?.errors;
        if (errors) {
          setSaveError(Object.values(errors).flat().join(', '));
        } else {
          setSaveError(
            err.response?.data?.message || 'Gagal menyimpan perubahan',
          );
        }
      } else {
        setSaveError('Gagal menyimpan perubahan');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!template) return;

    try {
      await documentTemplateService.activateTemplate(template.id);
      await fetchTemplate();
    } catch (err) {
      console.error('Activate failed:', err);
      setSaveError('Gagal mengaktifkan template');
    }
  };

  const handleDownload = async () => {
    if (!template) return;

    try {
      await documentTemplateService.downloadTemplate(
        template.id,
        `${template.template_name}.docx`,
      );
    } catch (err) {
      console.error('Download failed:', err);
      alert('Gagal download template');
    }
  };

  const handleBack = () => {
    navigate({ to: '/kemahasiswaan/template-dokumen' });
  };

  const getTemplateTypeLabel = (type: string) => {
    return type === 'executive_summary'
      ? 'Executive Summary'
      : 'Lembar Pengesahan';
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <FileText className='w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse' />
          <p className='text-gray-500'>Memuat template...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <p className='text-red-500 mb-4'>
            {error || 'Template tidak ditemukan'}
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleBack}
            className='shrink-0'
          >
            <ArrowLeft className='w-4 h-4 sm:mr-2' />
            <span className='hidden sm:inline'>Kembali</span>
          </Button>
          <div className='min-w-0'>
            <h1 className='text-lg sm:text-2xl font-bold text-gray-900 truncate'>
              Edit Template
            </h1>
            <p className='text-sm text-gray-600 truncate'>
              {getTemplateTypeLabel(template.template_type)} • v
              {template.version}
            </p>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {!template.is_active && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleActivate}
              className='flex-1 sm:flex-none'
            >
              <CheckCircle className='w-4 h-4 sm:mr-2' />
              <span className='hidden sm:inline'>Aktifkan Template</span>
              <span className='sm:hidden'>Aktifkan</span>
            </Button>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={handleDownload}
            className='flex-1 sm:flex-none'
          >
            <Download className='w-4 h-4 sm:mr-2' />
            <span className='hidden sm:inline'>Download</span>
          </Button>
          <Button
            size='sm'
            onClick={handleSave}
            disabled={isSaving}
            className='flex-1 sm:flex-none'
          >
            <Save className='w-4 h-4 sm:mr-2' />
            {isSaving ? (
              'Menyimpan...'
            ) : (
              <>
                <span className='hidden sm:inline'>Simpan Perubahan</span>
                <span className='sm:hidden'>Simpan</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {saveSuccess && (
        <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2'>
          <CheckCircle className='w-5 h-5' />
          <span>Perubahan berhasil disimpan!</span>
        </div>
      )}

      {saveError && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
          {saveError}
        </div>
      )}

      {/* Template Info Badge */}
      {template.is_active && (
        <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2'>
          <CheckCircle className='w-5 h-5' />
          <span className='font-medium'>Template ini sedang aktif</span>
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Form */}
        <div className='lg:col-span-1 space-y-6'>
          {/* Basic Info */}
          <div className='bg-white border rounded-lg p-6'>
            <h2 className='text-lg font-semibold mb-4'>Informasi Template</h2>

            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium mb-2 block'>
                  Nama Template <span className='text-red-500'>*</span>
                </label>
                <Input
                  value={formData.template_name}
                  onChange={(e) =>
                    setFormData({ ...formData, template_name: e.target.value })
                  }
                  placeholder='Nama template'
                />
              </div>

              <div>
                <label className='text-sm font-medium mb-2 block'>
                  Deskripsi
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='Catatan atau deskripsi template (opsional)'
                  rows={4}
                />
              </div>

              <div>
                <label className='text-sm font-medium mb-2 block'>
                  Ganti File Template
                </label>
                <Input
                  ref={fileInputRef}
                  id='file-input'
                  type='file'
                  accept='.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  onChange={handleFileChange}
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Kosongkan jika tidak ingin mengganti file (Max: 10MB)
                </p>
                {selectedFile && (
                  <div className='mt-2 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded'>
                    <Upload className='w-4 h-4' />
                    <span>File baru: {selectedFile.name}</span>
                  </div>
                )}
              </div>

              <div className='pt-4 border-t'>
                <div className='text-xs text-gray-500 space-y-1'>
                  <p>
                    <strong>Diupload oleh:</strong> {template.uploader?.name}
                  </p>
                  <p>
                    <strong>Tanggal upload:</strong>{' '}
                    {new Date(template.created_at).toLocaleDateString('id-ID')}
                  </p>
                  <p>
                    <strong>Terakhir diupdate:</strong>{' '}
                    {new Date(template.updated_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className='lg:col-span-2'>
          <div className='bg-white border rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold'>Preview Template</h2>
            </div>

            <TemplatePreview
              file={selectedFile}
              templateId={template.id}
              onDownload={handleDownload}
              onPlaceholdersDetected={setDetectedPlaceholders}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteComponent;

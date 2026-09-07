import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';

import { documentTemplateService } from '@/services/document-template.service';
import type {
  DocumentTemplate,
  PlaceholderMetadata,
} from '@/types/template.types';

interface PlaceholderStatusProps {
  template: DocumentTemplate;
  onUpdate?: () => void;
}

export function PlaceholderStatus({
  template,
  onUpdate,
}: PlaceholderStatusProps) {
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, PlaceholderMetadata>>(
    {},
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedPlaceholder, setExpandedPlaceholder] = useState<string | null>(
    null,
  );

  useEffect(() => {
    loadData();
  }, [template]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load available fields
      await documentTemplateService.getAvailableFields();

      // Set placeholders from template
      setPlaceholders(template.detected_placeholders || []);
      setMetadata(template.placeholder_metadata || {});
    } catch (error) {
      console.error('Failed to load placeholder data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      await documentTemplateService.updatePlaceholderMetadata(
        template.id,
        metadata,
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Failed to save metadata:', error);
      setSaveError(
        error.response?.data?.message || 'Gagal menyimpan perubahan',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateMetadata = (
    placeholder: string,
    updates: Partial<PlaceholderMetadata>,
  ) => {
    setMetadata((prev) => ({
      ...prev,
      [placeholder]: {
        ...prev[placeholder],
        ...updates,
      },
    }));
  };

  const getStatusIcon = (placeholder: string) => {
    const info = metadata[placeholder];
    const isAvailable = info?.available;

    if (isAvailable) {
      return <CheckCircle className='w-5 h-5 text-green-600' />;
    } else {
      return <AlertTriangle className='w-5 h-5 text-orange-600' />;
    }
  };

  const getStatusColor = (placeholder: string) => {
    const info = metadata[placeholder];
    const isAvailable = info?.available;

    return isAvailable
      ? 'bg-green-50 border-green-200'
      : 'bg-orange-50 border-orange-200';
  };

  const available = placeholders.filter((p) => metadata[p]?.available);
  const unavailable = placeholders.filter((p) => !metadata[p]?.available);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <RefreshCw className='w-6 h-6 animate-spin text-gray-400' />
      </div>
    );
  }

  if (placeholders.length === 0) {
    return (
      <div className='bg-gray-50 border border-gray-200 rounded-lg p-6 text-center'>
        <Info className='w-8 h-8 text-gray-400 mx-auto mb-2' />
        <p className='text-gray-600'>
          Tidak ada placeholder terdeteksi di template ini
        </p>
        <p className='text-sm text-gray-500 mt-1'>
          Gunakan format{' '}
          <code className='bg-gray-200 px-1 rounded'>${'{field_name}'}</code> di
          file DOCX
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='font-semibold text-lg'>Placeholder Terdeteksi</h3>
          <div className='flex items-center gap-3 mt-1 text-sm'>
            <span className='text-green-600 font-medium flex items-center gap-1'>
              <CheckCircle className='w-4 h-4' />
              {available.length} tersedia
            </span>
            {unavailable.length > 0 && (
              <span className='text-orange-600 font-medium flex items-center gap-1'>
                <AlertTriangle className='w-4 h-4' />
                {unavailable.length} belum tersedia
              </span>
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} size='sm'>
          <Save className='w-4 h-4 mr-2' />
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>

      {/* Save Messages */}
      {saveSuccess && (
        <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2'>
          <CheckCircle className='w-4 h-4' />
          Metadata berhasil disimpan!
        </div>
      )}

      {saveError && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm'>
          {saveError}
        </div>
      )}

      {/* Warning for unavailable placeholders */}
      {unavailable.length > 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
          <div className='flex items-start gap-2'>
            <AlertCircle className='w-5 h-5 text-yellow-600 mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm text-yellow-800 font-medium'>
                Template memiliki {unavailable.length} placeholder yang belum
                tersedia
              </p>
              <p className='text-xs text-yellow-700 mt-1'>
                Placeholder tersebut tidak akan terisi saat generate dokumen.
                Perlu menambahkan field di{' '}
                <code className='bg-yellow-100 px-1 rounded'>
                  DocumentGenerationService.php
                </code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder List */}
      <div className='space-y-2'>
        {placeholders.map((placeholder) => {
          const info = metadata[placeholder] || {};
          const isExpanded = expandedPlaceholder === placeholder;

          return (
            <div
              key={placeholder}
              className={`border rounded-lg ${getStatusColor(placeholder)}`}
            >
              <div
                className='p-3 cursor-pointer'
                onClick={() =>
                  setExpandedPlaceholder(isExpanded ? null : placeholder)
                }
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <code className='text-sm font-mono font-medium'>
                        ${'{' + placeholder + '}'}
                      </code>
                      {info.type === 'image' && (
                        <span className='text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded'>
                          Gambar
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-gray-700 mt-1'>
                      {info.label || placeholder}
                    </p>
                    {info.example && (
                      <p className='text-xs text-gray-500 mt-1'>
                        Contoh: {info.example}
                      </p>
                    )}
                  </div>

                  {getStatusIcon(placeholder)}
                </div>

                {!info.available && (
                  <div className='mt-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded'>
                    ⚠️ Field ini belum tersedia di backend
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className='border-t p-3 space-y-3 bg-white'>
                  <div>
                    <label className='text-xs font-medium text-gray-700 block mb-1'>
                      Label/Deskripsi
                    </label>
                    <Input
                      value={info.label || ''}
                      onChange={(e) =>
                        updateMetadata(placeholder, { label: e.target.value })
                      }
                      placeholder='Label untuk placeholder ini'
                      className='text-sm'
                    />
                  </div>

                  <div>
                    <label className='text-xs font-medium text-gray-700 block mb-1'>
                      Contoh Value
                    </label>
                    <Input
                      value={info.example || ''}
                      onChange={(e) =>
                        updateMetadata(placeholder, { example: e.target.value })
                      }
                      placeholder='Contoh value yang akan muncul'
                      className='text-sm'
                    />
                  </div>

                  {info.source && (
                    <div>
                      <label className='text-xs font-medium text-gray-700 block mb-1'>
                        Source
                      </label>
                      <code className='text-xs bg-gray-100 px-2 py-1 rounded block'>
                        {info.source}
                      </code>
                    </div>
                  )}

                  <div className='text-xs text-gray-500'>
                    Kategori:{' '}
                    <span className='font-medium'>{info.category}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
        <p className='text-sm text-blue-800'>
          <strong>💡 Tips:</strong> Klik pada placeholder untuk melihat detail
          dan edit dokumentasi. Placeholder yang tersedia akan otomatis terisi
          saat generate dokumen.
        </p>
      </div>
    </div>
  );
}

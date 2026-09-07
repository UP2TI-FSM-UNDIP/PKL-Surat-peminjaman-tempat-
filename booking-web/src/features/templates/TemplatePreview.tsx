import { useState, useEffect, useCallback } from 'react';
import mammoth from 'mammoth';
import { FileText, Download, AlertCircle, FileType, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import api from '@/lib/axios';

interface TemplatePreviewProps {
  file: File | null; // File object (for newly selected files)
  templateId?: number; // Template ID for PDF conversion from existing template
  onDownload?: () => void;
  onPlaceholdersDetected?: (placeholders: string[]) => void;
}

export function TemplatePreview({
  file,
  templateId,
  onDownload,
  onPlaceholdersDetected,
}: TemplatePreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const extractPlaceholders = useCallback(async () => {
    try {
      let arrayBuffer: ArrayBuffer;

      if (file instanceof File) {
        arrayBuffer = await file.arrayBuffer();
      } else if (templateId) {
        // Download DOCX from backend for placeholder extraction
        const response = await api.get(
          `/document-templates/${templateId}/download`,
          {
            responseType: 'arraybuffer',
          },
        );
        arrayBuffer = response.data;
      } else {
        // No file or template ID provided
        return;
      }

      // Extract placeholders using mammoth
      const result = await mammoth.extractRawText({ arrayBuffer });
      const placeholderRegex = /\$\{([a-zA-Z0-9_]+)\}/g;
      const matches = [...result.value.matchAll(placeholderRegex)];
      const uniquePlaceholders = Array.from(new Set(matches.map((m) => m[1])));
      setPlaceholders(uniquePlaceholders);

      if (onPlaceholdersDetected) {
        onPlaceholdersDetected(uniquePlaceholders);
      }
    } catch {
      // Placeholder extraction is non-critical; silently ignore
    }
  }, [file, templateId, onPlaceholdersDetected]);

  const loadPreview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setErrorHint(null);

      // If new file is selected, preview that (no PDF conversion needed)
      if (file) {
        await extractPlaceholders();
        setIsLoading(false);
        return;
      }

      // Otherwise, try to get PDF preview from backend if templateId is provided
      if (templateId && !useFallback) {
        try {
          const response = await api.get(
            `/document-templates/${templateId}/preview-pdf`,
            {
              responseType: 'blob',
            },
          );

          // Check if response is actually a PDF or an error JSON
          const contentType = response.headers['content-type'] || '';

          if (contentType.includes('application/json')) {
            // Backend returned JSON error, parse it
            const text = await (response.data as Blob).text();
            const errorData = JSON.parse(text);
            setError(errorData.message || 'Gagal konversi PDF');
            setErrorHint(errorData.hint || null);
            setUseFallback(true);
            await extractPlaceholders();
            return;
          }

          // Create blob URL for PDF
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);

          // Still extract placeholders from DOCX for info
          await extractPlaceholders();
          setIsLoading(false);
          return;
        } catch (pdfError: unknown) {
          const axiosErr = pdfError as { response?: { data?: unknown } };

          // Try to extract error message from response
          if (axiosErr.response?.data) {
            try {
              let errorData = axiosErr.response.data;
              // If blob, convert to text first
              if (errorData instanceof Blob) {
                const text = await errorData.text();
                errorData = JSON.parse(text);
              }
              const parsed = errorData as { message?: string; hint?: string };
              setError(parsed.message || 'Gagal konversi PDF');
              setErrorHint(parsed.hint || null);
            } catch {
              setError('LibreOffice tidak tersedia untuk konversi PDF');
            }
          }

          // If PDF conversion fails, fall back
          setUseFallback(true);
        }
      }

      // Fallback: show message that PDF preview is not available
      await extractPlaceholders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat preview');
    } finally {
      setIsLoading(false);
    }
  }, [file, templateId, useFallback, extractPlaceholders]);

  const handleRetry = () => {
    setUseFallback(false);
    setError(null);
    setErrorHint(null);
    setPdfUrl(null);
    loadPreview();
  };

  // Load preview when file or templateId changes
  useEffect(() => {
    if (file || templateId) {
      loadPreview();
    }
  }, [file, templateId, loadPreview]);

  // Cleanup PDF blob URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        try {
          URL.revokeObjectURL(pdfUrl);
        } catch {
          // ignore
        }
      }
    };
  }, [pdfUrl]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-[800px] bg-gray-50 rounded-lg border-2'>
        <div className='text-center'>
          <FileText className='w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse' />
          <p className='text-gray-500'>Memuat preview dokumen...</p>
          <p className='text-xs text-gray-400 mt-1'>
            Sedang mengkonversi DOCX ke PDF...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-[800px] bg-red-50 rounded-lg border-2 border-red-200'>
        <div className='text-center max-w-md'>
          <AlertCircle className='w-12 h-12 text-red-400 mx-auto mb-2' />
          <p className='text-red-600 font-medium mb-1'>Gagal Memuat Preview</p>
          <p className='text-sm text-red-500'>{error}</p>
        </div>
      </div>
    );
  }

  // If PDF conversion is not available
  if (useFallback || !pdfUrl) {
    return (
      <div className='space-y-4'>
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 text-yellow-600 mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-yellow-900'>
                Preview PDF Tidak Tersedia
              </p>
              <p className='text-xs text-yellow-700 mt-1'>
                {error ||
                  'Server belum dikonfigurasi untuk konversi PDF. Silakan download file DOCX untuk melihat template.'}
              </p>
              {errorHint && (
                <p className='text-xs text-yellow-600 mt-2 font-mono bg-yellow-100 p-2 rounded'>
                  💡 {errorHint}
                </p>
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={handleRetry}
                className='mt-3'
              >
                🔄 Coba Lagi
              </Button>
            </div>
          </div>
        </div>

        {placeholders.length > 0 && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <FileType className='w-5 h-5 text-blue-600 mt-0.5' />
              <div className='flex-1'>
                <h3 className='text-sm font-semibold text-blue-900 mb-2'>
                  Placeholders Terdeteksi ({placeholders.length})
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {placeholders.map((placeholder, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-white text-blue-700 border border-blue-300'
                    >
                      {placeholder}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='flex justify-center'>
          {onDownload && (
            <Button onClick={onDownload} size='lg'>
              <Download className='w-5 h-5 mr-2' />
              Download Template DOCX
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show PDF Preview
  return (
    <div className='space-y-4'>
      {/* Placeholders Info Banner */}
      {placeholders.length > 0 && (
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm'>
          <div className='flex items-start gap-3'>
            <FileType className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-sm font-semibold text-blue-900 mb-2'>
                🏷️ Placeholders Terdeteksi ({placeholders.length})
              </h3>
              <div className='flex flex-wrap gap-2 mb-2'>
                {placeholders.map((placeholder, index) => (
                  <span
                    key={index}
                    className='inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-white text-blue-700 border border-blue-300 shadow-sm'
                  >
                    {placeholder}
                  </span>
                ))}
              </div>
              <p className='text-xs text-blue-700'>
                💡 Placeholder ini akan otomatis diganti dengan data peminjam
                saat dokumen di-generate
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Container */}
      <div className='bg-gray-100 rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden'>
        <div className='border-b bg-white px-4 py-3 flex items-center justify-between shadow-sm'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md'>
              <FileText className='w-6 h-6 text-white' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-900'>
                Preview Template (PDF)
              </h3>
              <p className='text-xs text-gray-500'>
                Dokumen telah dikonversi ke PDF
              </p>
            </div>
          </div>
          {onDownload && (
            <Button
              variant='outline'
              size='sm'
              onClick={onDownload}
              className='shadow-sm'
            >
              <Download className='w-4 h-4 mr-2' />
              Download DOCX
            </Button>
          )}
        </div>

        {/* PDF Viewer */}
        <div className='bg-gray-200 p-4'>
          <iframe
            src={pdfUrl}
            className='w-full bg-white shadow-xl rounded'
            style={{
              height: '800px',
              border: 'none',
            }}
            title='PDF Preview'
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
        <div className='flex items-start gap-2'>
          <Eye className='w-4 h-4 text-green-600 mt-0.5 flex-shrink-0' />
          <div>
            <p className='text-xs text-green-700 leading-relaxed'>
              <strong>✅ Preview PDF:</strong> Dokumen template telah dikonversi
              dari DOCX ke PDF untuk preview yang akurat. Ini adalah tampilan
              yang sama dengan hasil akhir dokumen yang akan di-generate.
            </p>
            <p className='text-xs text-green-600 mt-1'>
              Placeholder akan diganti otomatis dengan data peminjam saat
              dokumen dibuat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

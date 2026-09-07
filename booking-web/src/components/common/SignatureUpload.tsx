import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Upload, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import { signatureService } from '@/services/signature.service';
import type { Signature } from '@/services/signature.service';

interface SignatureUploadProps {
  onSignatureUploaded?: (signature: Signature) => void;
  /** Additional class applied to the outer container */
  className?: string;
  /** Additional class applied to the preview <img> */
  imgClassName?: string;
}

export function SignatureUpload({
  onSignatureUploaded,
  className,
  imgClassName,
}: SignatureUploadProps) {
  const [mode, setMode] = useState<'view' | 'draw' | 'upload'>('view');
  const [existingSignature, setExistingSignature] = useState<Signature | null>(
    null,
  );
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const prevBlobUrl = useRef<string | null>(null);
  // Coerce to number; keep NaN if missing so comparisons are numeric
  const currentUserId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    loadExistingSignature();
    return () => {
      // revoke any created object URL on unmount
      if (prevBlobUrl.current) {
        try {
          URL.revokeObjectURL(prevBlobUrl.current);
        } catch (e) {
          /* ignore */
        }
        prevBlobUrl.current = null;
      }
    };
  }, []);

  const updateSignatureUrl = (url: string | null) => {
    if (prevBlobUrl.current && prevBlobUrl.current !== url) {
      try {
        URL.revokeObjectURL(prevBlobUrl.current);
      } catch (e) {
        /* ignore */
      }
    }
    prevBlobUrl.current = url;
    setSignatureUrl(url);
  };

  const loadExistingSignature = async () => {
    try {
      setLoading(true);
      const signature = await signatureService.getSignature();
      // Debug: log returned signature and current user id to help diagnose preview issues
      console.debug('SignatureUpload.loadExistingSignature', {
        signature,
        currentUserId,
      });
      // Ensure the returned signature belongs to the current authenticated user
      if (signature && Number(signature.user_id) === currentUserId) {
        setExistingSignature(signature);

        // Request file blob for this specific signature id to avoid mismatched previews
        const url = await signatureService.getSignatureFileUrl(signature.id);
        updateSignatureUrl(url);
      } else {
        // If signature exists but belongs to another user, ignore it
        setExistingSignature(null);
        setSignatureUrl(null);
      }
    } catch (error: any) {
      console.error('Failed to load signature:', error);
      if (error.response?.status === 404) {
        setExistingSignature(null);
        setSignatureUrl(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSaveDrawnSignature = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert('Silakan gambar tanda tangan terlebih dahulu');
      return;
    }

    try {
      setLoading(true);

      // Convert canvas to blob
      const canvas = sigCanvas.current.getCanvas();
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      // Create file from blob
      const file = new File([blob], 'signature.png', { type: 'image/png' });

      // Upload or update signature
      let signature: Signature;
      if (existingSignature) {
        signature = await signatureService.updateSignature(
          existingSignature.id,
          file,
        );
      } else {
        signature = await signatureService.uploadSignature(file);
      }

      setExistingSignature(signature);

      // Use local blob for immediate preview to avoid caching/server delay
      const clientUrl = URL.createObjectURL(blob);
      updateSignatureUrl(clientUrl);

      setMode('view');
      onSignatureUploaded?.(signature);
    } catch (error: any) {
      console.error('Failed to save signature:', error);
      alert(error.response?.data?.message || 'Gagal menyimpan tanda tangan');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      alert('Format file harus PNG, JPG, atau JPEG');
      return;
    }

    try {
      setLoading(true);

      // Upload or update signature
      let signature: Signature;
      if (existingSignature) {
        signature = await signatureService.updateSignature(
          existingSignature.id,
          file,
        );
      } else {
        signature = await signatureService.uploadSignature(file);
      }

      setExistingSignature(signature);

      // Use local file blob for immediate preview
      const clientUrl = URL.createObjectURL(file);
      updateSignatureUrl(clientUrl);

      setMode('view');
      onSignatureUploaded?.(signature);
    } catch (error: any) {
      console.error('Failed to upload signature:', error);
      alert(error.response?.data?.message || 'Gagal mengunggah tanda tangan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingSignature) return;

    if (!confirm('Apakah Anda yakin ingin menghapus tanda tangan?')) {
      return;
    }

    try {
      setLoading(true);
      await signatureService.deleteSignature(existingSignature.id);
      setExistingSignature(null);
      setSignatureUrl(null);
    } catch (error: any) {
      console.error('Failed to delete signature:', error);
      alert(error.response?.data?.message || 'Gagal menghapus tanda tangan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={
          'border border-gray-200 rounded-lg p-6 bg-white ' + (className || '')
        }
      >
        <h3 className='text-sm font-medium text-gray-900 mb-4'>
          Tanda Tangan Digital
        </h3>

        <div className='min-h-60 flex items-center justify-center'>
          <div className='border border-gray-300 rounded-lg p-4 bg-gray-50 w-full flex items-center justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        'border border-gray-200 rounded-lg p-6 bg-white ' + (className || '')
      }
    >
      <h3 className='text-sm font-medium text-gray-900 mb-4'>
        Tanda Tangan Digital
      </h3>

      {mode === 'view' && (
        <>
          {signatureUrl ? (
            <div className='space-y-4'>
              <div className='border border-gray-300 rounded-lg p-4 bg-gray-50 flex items-center justify-center'>
                <img
                  src={signatureUrl}
                  alt='Tanda Tangan'
                  className={(imgClassName || 'max-h-32 object-contain').trim()}
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setMode('draw')}
                  className='flex-1'
                >
                  Gambar Ulang
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setMode('upload')}
                  className='flex-1'
                >
                  <Upload className='h-4 w-4 mr-1' />
                  Upload Ulang
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleDelete}
                  className='text-red-600 hover:text-red-700'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50'>
                <p className='text-sm text-gray-600 mb-4'>
                  Belum ada tanda tangan
                </p>
                <div className='flex gap-2 justify-center'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setMode('draw')}
                  >
                    Gambar Tanda Tangan
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setMode('upload')}
                  >
                    <Upload className='h-4 w-4 mr-1' />
                    Upload File
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'draw' && (
        <div className='space-y-4'>
          <div className='border border-gray-300 rounded-lg overflow-hidden bg-white'>
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full h-40',
                style: { touchAction: 'none' },
              }}
              backgroundColor='rgb(255, 255, 255)'
            />
          </div>
          <p className='text-xs text-gray-500'>
            Gambar tanda tangan Anda di area putih di atas menggunakan mouse
            atau touchscreen
          </p>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleClear}
            >
              <Trash2 className='h-4 w-4 mr-1' />
              Hapus
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setMode('view')}
            >
              <X className='h-4 w-4 mr-1' />
              Batal
            </Button>
            <Button
              type='button'
              size='sm'
              onClick={handleSaveDrawnSignature}
              disabled={loading}
              className='ml-auto'
            >
              <Check className='h-4 w-4 mr-1' />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div className='space-y-4'>
          <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50'>
            <Upload className='h-8 w-8 mx-auto mb-2 text-gray-400' />
            <label className='cursor-pointer'>
              <span className='text-sm text-blue-600 hover:text-blue-700'>
                Pilih file tanda tangan
              </span>
              <input
                type='file'
                accept='image/png,image/jpeg,image/jpg'
                onChange={handleFileUpload}
                className='hidden'
              />
            </label>
            <p className='text-xs text-gray-500 mt-2'>
              PNG, JPG, JPEG (Max 2MB)
            </p>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setMode('view')}
            className='w-full'
          >
            <X className='h-4 w-4 mr-1' />
            Batal
          </Button>
        </div>
      )}
    </div>
  );
}

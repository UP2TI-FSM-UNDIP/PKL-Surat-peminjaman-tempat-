import {
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import { SignatureUpload } from '@/components/common/SignatureUpload';
import type { Signature } from '@/services/signature.service';

export const Route = createFileRoute('/tanda-tangan')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      return: search.return as string | undefined,
      autoApprove: search.autoApprove as boolean | undefined,
    };
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const {
    return: returnPath = '/',
    autoApprove,
  } = Route.useSearch();

  const [signature, setSignature] = useState<Signature | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSignatureUploaded = (sig: Signature) => {
    setSignature(sig);
    setHasChanges(true);
  };

  const handleSaveAndReturn = () => {
    if (signature) {
      // Navigate back with success
      navigate({
        to: returnPath as any,
        search: {
          autoApprove,
        } as any,
      });
    }
  };

  return (
    <div className='container mx-auto py-6 px-8 max-w-4xl'>
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate({ to: returnPath as any })}
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Kembali
          </Button>
        </div>

        {signature && hasChanges && (
          <Button
            onClick={handleSaveAndReturn}
            size='sm'
            className='gap-2 bg-green-600 hover:bg-green-700'
          >
            <CheckCircle className='h-4 w-4' />
            {autoApprove ? 'Simpan & Approve Dokumen' : 'Simpan & Kembali'}
          </Button>
        )}
      </div>

      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Tanda Tangan Digital</h1>
        <p className='text-muted-foreground'>
          Kelola tanda tangan digital Anda untuk keperluan dokumen
        </p>
      </div>

      <div className='space-y-6'>
        {/* Info Box */}
        {autoApprove ? (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='text-sm text-green-900'>
              <p className='font-medium mb-2'>✅ Mode Approval Otomatis</p>
              <ul className='list-disc list-inside space-y-1 text-xs'>
                <li>
                  Setelah Anda mengupload tanda tangan, dokumen akan{' '}
                  <strong>otomatis diapprove</strong>
                </li>
                <li>
                  Tanda tangan Anda akan tertanam di dokumen yang digenerate
                </li>
                <li>Dokumen akan diteruskan ke step persetujuan berikutnya</li>
                <li className='font-medium text-green-700'>
                  Klik "Simpan & Kembali" setelah upload untuk approve dokumen
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='text-sm text-blue-900'>
              <p className='font-medium mb-2'>
                📝 Informasi Tanda Tangan Digital
              </p>
              <ul className='list-disc list-inside space-y-1 text-xs'>
                <li>
                  Tanda tangan ini akan digunakan untuk semua dokumen yang
                  memerlukan persetujuan Anda
                </li>
                <li>
                  Anda dapat menggambar tanda tangan atau mengupload file gambar
                </li>
                <li>Format yang didukung: PNG, JPG, JPEG (Max 2MB)</li>
                <li>
                  Pastikan tanda tangan Anda jelas dan sesuai dengan tanda
                  tangan resmi
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Signature Upload Component */}
        <SignatureUpload onSignatureUploaded={handleSignatureUploaded} />

        {/* Action Buttons */}
        <div className='flex gap-3 pt-4'>
          <Button
            variant='outline'
            onClick={() => navigate({ to: returnPath as any })}
            className='flex-1'
          >
            Batal
          </Button>
          {signature && (
            <Button
              onClick={handleSaveAndReturn}
              className={`flex-1 gap-2 ${autoApprove ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              <Save className='h-4 w-4' />
              {autoApprove ? 'Simpan & Approve' : 'Simpan Perubahan'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { PenTool, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import { Checkbox } from '@/components/ui/checkbox';

export const Route = createFileRoute('/ketua-ormawa/sign')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/ketua-ormawa/sign' });
  const docType = (searchParams as any)?.doc || 'document';


  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isSigned) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate back to dashboard
      navigate({ to: '/ketua-ormawa', search: {} as any });
    }, 500);
  };

  return (
    <div className='container mx-auto py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Tanda Tangan Digital</h1>
        <p className='text-muted-foreground'>
          Tanda tangan {docType === 'executive-summary' ? 'Executive Summary' : 'Lembar Pengesahan'}
        </p>
      </div>

      <div className='rounded-lg border bg-white p-8 shadow-sm'>
        <div className='mb-8 flex items-center justify-center'>
          <div className='text-center'>
            <PenTool className='mx-auto mb-4 h-16 w-16 text-gray-400' />
            <h2 className='text-xl font-semibold text-gray-600'>Dalam Tahap Pengembangan</h2>
            <p className='mt-2 text-gray-500'>
              Fitur tanda tangan digital sedang dalam proses pengembangan
            </p>
          </div>
        </div>

        <div className='border-t pt-6'>
          <div className='mb-6 flex items-center space-x-3 rounded-lg bg-blue-50 p-4'>
            <Checkbox
              id='sign-confirm'
              checked={isSigned}
              onCheckedChange={(checked) => setIsSigned(checked as boolean)}
            />
            <label
              htmlFor='sign-confirm'
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              Saya menyatakan telah memeriksa dan menandatangani dokumen ini
            </label>
          </div>

          <div className='flex gap-3'>
            <Button
              variant='outline'
              onClick={() => navigate({ to: '/ketua-ormawa', search: {} as any })}
              disabled={isSubmitting}
              className='flex-1'
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isSigned || isSubmitting}
              className='flex-1 gap-2'
            >
              <CheckCircle className='h-4 w-4' />
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Tanda Tangan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

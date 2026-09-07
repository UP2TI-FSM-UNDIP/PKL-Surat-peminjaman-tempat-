import { createFileRoute, useSearch } from '@tanstack/react-router';
import { FileText } from 'lucide-react';

export const Route = createFileRoute('/ketua-ormawa/preview')({
  component: RouteComponent,
});

function RouteComponent() {
  const searchParams = useSearch({ from: '/ketua-ormawa/preview' });
  const docType = (searchParams as any)?.doc || 'document';

  return (
    <div className='container mx-auto py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Preview Dokumen</h1>
        <p className='text-muted-foreground'>
          Preview {docType === 'executive-summary' ? 'Executive Summary' : 'Lembar Pengesahan'}
        </p>
      </div>

      <div className='flex h-[600px] items-center justify-center rounded-lg border-2 border-dashed bg-gray-50'>
        <div className='text-center'>
          <FileText className='mx-auto mb-4 h-16 w-16 text-gray-400' />
          <h2 className='text-xl font-semibold text-gray-600'>Dalam Tahap Pengembangan</h2>
          <p className='mt-2 text-gray-500'>
            Fitur preview dokumen sedang dalam proses pengembangan
          </p>
        </div>
      </div>
    </div>
  );
}

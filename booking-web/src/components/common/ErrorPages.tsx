import type { ReactNode } from 'react';
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { FileQuestion, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button/button';

function PageShell({ icon, code, title, children }: {
  icon: ReactNode;
  code?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md bg-white rounded-xl shadow-md border p-8 text-center space-y-4'>
        <img
          src={`${import.meta.env.BASE_URL}android-chrome-192x192.png`}
          alt='Logo Universitas Diponegoro'
          className='h-14 w-14 mx-auto'
        />
        <div className='flex justify-center text-gray-400'>{icon}</div>
        {code && <p className='text-4xl font-bold text-gray-900'>{code}</p>}
        <h1 className='text-lg font-semibold text-gray-900'>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <PageShell icon={<FileQuestion className='h-10 w-10' />} code='404' title='Halaman Tidak Ditemukan'>
      <p className='text-sm text-gray-600'>
        Halaman yang Anda cari tidak ada atau sudah dipindahkan. Periksa kembali alamat yang Anda buka.
      </p>
      <Button asChild className='w-full sm:w-auto'>
        <Link to='/'>Kembali ke Beranda</Link>
      </Button>
    </PageShell>
  );
}

export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  if (import.meta.env.DEV) {
    console.error(error);
  }

  return (
    <PageShell icon={<TriangleAlert className='h-10 w-10 text-amber-500' />} title='Terjadi Kesalahan'>
      <p className='text-sm text-gray-600'>
        Maaf, halaman ini gagal dimuat. Silakan coba lagi. Jika masalah berlanjut, hubungi admin.
      </p>
      <div className='flex flex-col sm:flex-row gap-2 justify-center'>
        <Button
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Coba Lagi
        </Button>
        <Button variant='outline' asChild>
          <Link to='/'>Kembali ke Beranda</Link>
        </Button>
      </div>
    </PageShell>
  );
}

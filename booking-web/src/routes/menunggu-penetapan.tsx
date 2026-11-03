import { createFileRoute, redirect } from '@tanstack/react-router';
import { Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import api from '@/lib/axios';
import { authService } from '@/services/auth.service';

const PENDING_ROLE = 'Menunggu Penetapan';

/**
 * Halaman untuk akun baru dari SSO yang role-nya belum ditetapkan admin.
 * Akun ini belum punya akses fitur apa pun (backend juga menolak, 403).
 */
export const Route = createFileRoute('/menunggu-penetapan')({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) throw redirect({ to: '/' });
    const role = authService.getRole() || '';
    if (role !== PENDING_ROLE) throw redirect({ to: authService.getRolePath(role) });
  },
  component: MenungguPenetapanPage,
});

function MenungguPenetapanPage() {
  const name = localStorage.getItem('userName') || '-';
  const email = localStorage.getItem('userEmail') || '-';
  const unit = localStorage.getItem('userUnit') || '-';

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // abaikan error jaringan, tetap keluar di sisi browser
    }
    authService.clearAuthData();
    window.location.href = import.meta.env.BASE_URL;
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md bg-white rounded-xl shadow-md border p-8 text-center space-y-5'>
        <img
          src={`${import.meta.env.BASE_URL}android-chrome-192x192.png`}
          alt='Logo Universitas Diponegoro'
          className='h-14 w-14 mx-auto'
        />
        <Clock className='h-10 w-10 mx-auto text-amber-500' />
        <div className='space-y-2'>
          <h1 className='text-lg font-semibold text-gray-900'>Akun Menunggu Penetapan Role</h1>
          <p className='text-sm text-gray-600'>
            Akun Anda sudah terdaftar, tetapi role dan unit Anda belum ditetapkan oleh admin.
            Silakan hubungi admin Sistem Peminjaman Ruang FSM agar akun Anda dapat digunakan.
          </p>
        </div>

        <dl className='text-left text-sm rounded-lg border bg-gray-50 divide-y'>
          <div className='flex justify-between gap-4 px-4 py-2'>
            <dt className='text-gray-500'>Nama</dt>
            <dd className='font-medium text-gray-900 text-right'>{name}</dd>
          </div>
          <div className='flex justify-between gap-4 px-4 py-2'>
            <dt className='text-gray-500'>Email</dt>
            <dd className='font-medium text-gray-900 text-right break-all'>{email}</dd>
          </div>
          <div className='flex justify-between gap-4 px-4 py-2'>
            <dt className='text-gray-500'>Unit</dt>
            <dd className='font-medium text-gray-900 text-right'>{unit}</dd>
          </div>
        </dl>

        <p className='text-xs text-gray-500'>
          Setelah admin menetapkan role Anda, keluar lalu masuk kembali lewat SSO.
        </p>

        <Button variant='outline' onClick={handleLogout} className='w-full'>
          <LogOut className='w-4 h-4 mr-2' /> Keluar
        </Button>
      </div>
    </div>
  );
}

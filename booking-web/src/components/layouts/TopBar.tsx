import { Link } from '@tanstack/react-router';

export default function TopBar() {
  return (
    <header className='w-full flex items-center justify-between bg-[#0586c6] px-6 py-10 h-16'>
      {/* Logo dan Nama Fakultas */}
      <div className='flex items-center gap-3'>
        {/* <img
          src='/template/logo-fsm.png' // Pastikan file logo ada di public/
          alt='Logo Undip'
          width={235}
          height={55}
        /> */}
        <h3 className='text-white text-sm font-bold'>
          Sistem Peminjaman Ruang <br />
          Fakultas Sains dan Matematika
        </h3>
      </div>
      {/* Notifikasi, Nama User, Avatar */}
      <Link
        to='/login'
        // Gabungkan class container (flex items-center gap-4)
        // dengan class button (bg-white text-[#0586c6]...)
        className='flex items-center gap-4 bg-white text-[#0586c6] px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 transition'
      >
        Login Cuy!
      </Link>
    </header>
  );
}

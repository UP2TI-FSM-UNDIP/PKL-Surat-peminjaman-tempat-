import { createFileRoute } from '@tanstack/react-router';

import { TopBar } from '@/layouts/TopBar';
import { LoginModal } from '@/components/LoginModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button/button';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className='min-h-screen bg-white font-sans text-gray-900'>
      <TopBar onLoginClick={() => setIsLoginModalOpen(true)} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      <main className='max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12 lg:py-24'>
        <div className='flex flex-col lg:flex-row items-center gap-16'>
          {/* Left Column: Typography */}
          <div className='flex-1 space-y-8 animate-in fade-in slide-in-from-left duration-700'>
            <div className='space-y-4'>
              <h1 className='text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight'>
                Kemudahan <br />
                <span className='text-primary'>Peminjaman</span> <br />
                Ruang & Fasilitas
              </h1>
              <p className='text-gray-500 text-lg md:text-xl max-w-lg leading-relaxed'>
                Sistem terpadu untuk organisasi mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro.
              </p>
            </div>

            <div className='flex flex-col sm:flex-row items-center gap-4'>
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                className='w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 active:scale-95 shadow-sm h-auto'
              >
                Pinjam Ruang Sekarang
              </Button>
              <div className='flex flex-col text-xs text-gray-400 font-medium'>
                <span>PINJAM RUANG</span>
                <span>DENGAN CEPAT SEKARANG JUGA</span>
                <div className='flex gap-1 mt-1'>
                  <div className='w-4 h-1 bg-gray-200 rounded-full' />
                  <div className='w-1.5 h-1 bg-gray-200 rounded-full' />
                  <div className='w-1.5 h-1 bg-gray-200 rounded-full' />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Illustration */}
          <div className='flex-1 relative animate-in fade-in slide-in-from-right duration-700 delay-200'>
            {/* Decorative Background for Illustration */}
            <div className='absolute -inset-4 bg-[#ccfbf1] rounded-[60px] opacity-20 blur-2xl transform rotate-6' />

            <div className='relative z-0'>
              <img
                src={`${import.meta.env.BASE_URL}illustration.png`}
                alt='Minimalist Illustration'
                className='w-full h-auto drop-shadow-2xl'
              />

              {/* Floating elements to mimic the reference style */}
              <div className='absolute -bottom-10 -left-10 w-24 h-24 bg-[#fef08a] rounded-xl -z-10 animate-bounce transition-all duration-1000' style={{ animationDuration: '4s' }} />
              <div className='absolute -top-10 -right-10 w-32 h-32 bg-primary rounded-full -z-10 animate-pulse' style={{ animationDuration: '5s' }} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Status Bars */}
      <footer className='border-t border-gray-50 py-12'>
        <div className='max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center text-xs font-bold tracking-widest text-gray-300 uppercase'>
          <div className='flex gap-12'>
          </div>
          <div className='hidden md:block'>
            © 2026 PINJAM RUANG FSM
          </div>
        </div>
      </footer>
    </div>
  );
}
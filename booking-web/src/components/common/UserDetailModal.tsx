'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserDetailModal({ open, onOpenChange, user }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 bg-black/50 z-40' />

        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 w-[95%] max-w-3xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 md:p-8 shadow-xl z-50',
            'focus:outline-none',
          )}
        >
          <div className='flex items-start justify-between gap-4'>
            <div>
              <Dialog.Title className='text-lg font-semibold'>
                Detail User
              </Dialog.Title>
              <Dialog.Description className='text-sm text-gray-500'>
                Informasi lengkap mengenai user
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className='rounded p-1 text-gray-600 hover:text-gray-900 -mt-1 -mr-1'>
                <X className='w-5 h-5' />
              </button>
            </Dialog.Close>
          </div>

          <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'>
            <DetailRow label='Nama'>{user?.name ?? '-'}</DetailRow>
            <DetailRow label='Email'>{user?.email ?? '-'}</DetailRow>
            <DetailRow label='Role'>{user?.role ?? '-'}</DetailRow>
            <DetailRow label='Status'>{user?.status ?? '-'}</DetailRow>
            <DetailRow label='Terdaftar'>{user?.createdAt ?? '-'}</DetailRow>
          </div>

          <div className='mt-8 flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='w-full md:w-auto'
            >
              Tutup
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1 p-3 bg-gray-50/80 rounded border'>
      <div className='text-xs text-gray-500'>{label}</div>
      <div className='text-sm font-semibold text-gray-900 break-words'>
        {children}
      </div>
    </div>
  );
}

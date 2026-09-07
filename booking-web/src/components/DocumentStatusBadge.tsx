// File: src/components/DocumentStatusBadge.tsx
import React from 'react';
import type { Document } from '@/types/document'; // Pastikan path ini sesuai dengan file type Anda

export const DocumentStatusBadge: React.FC<{ doc: Document }> = ({ doc }) => {
  // Logic 1: Handle Status DRAFT / RESERVASI
  if (doc.status === 'DRAFT') {
    // Casting aman karena kita hanya cek property step
    const metaData = doc.meta_data as
      | Record<string, string | number | null | undefined>
      | undefined;
    const isReservation = metaData?.step === 'reservation';

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isReservation
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isReservation ? 'Reservasi' : 'Draft'}
      </span>
    );
  }

  // Logic 2: Config warna untuk status lain
  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    IN_PROGRESS: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Diproses',
    },
    APPROVED: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Disetujui',
    },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' },
    REVISION: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      label: 'Perlu Revisi',
    },
  };

  const config = statusConfig[doc.status];

  // Fallback jika status tidak dikenal
  if (!config) {
    return (
      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
        {doc.status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

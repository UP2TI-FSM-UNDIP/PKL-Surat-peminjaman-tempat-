// src/shared/components/ui/data-table.tsx
import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Definisi tipe untuk satu kolom
export interface ColumnDef<T> {
  header: string;
  // Class untuk styling lebar kolom, alignment, dll
  className?: string;
  // Fungsi untuk merender isi cell.
  // Jika string, dia akan mencoba akses property langsung dari data (key).
  // Jika function, dia akan panggil function tersebut dengan data row.
  cell: (item: T, index: number) => React.ReactNode;
}

// Server-side pagination info
export interface ServerPagination {
  currentPage: number;
  lastPage: number;
  total: number;
  from: number | null;
  to: number | null;
  perPage: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  pageSize?: number;
  /** Jika disediakan, pagination akan dihandle server-side (data = 1 halaman dari server) */
  serverPagination?: ServerPagination;
}

// --- Pagination UI Component ---
export function PaginationBar({
  currentPage,
  totalPages,
  from,
  to,
  total,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className='flex items-center justify-between border-t border-gray-200 px-4 py-3'>
      <p className='text-sm text-gray-600'>
        Menampilkan {from}–{to} dari {total} data
      </p>
      <div className='flex items-center gap-1'>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className='p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed'
        >
          <ChevronLeft className='w-4 h-4' />
        </button>

        {pageNumbers.map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className='px-2 text-sm text-gray-400'>…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[32px] h-8 rounded-md text-sm font-medium ${page === currentPage
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className='p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed'
        >
          <ChevronRight className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyState,
  pageSize = 10,
  serverPagination,
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(1);

  // All hooks must be called unconditionally (React rules of hooks)
  const totalPages = serverPagination
    ? serverPagination.lastPage
    : Math.max(1, Math.ceil(data.length / pageSize));

  const safePage = serverPagination
    ? serverPagination.currentPage
    : (clientPage > totalPages ? 1 : clientPage);

  // Sync clientPage when it exceeds totalPages (client-side only)
  React.useEffect(() => {
    if (!serverPagination && clientPage > totalPages) {
      setClientPage(1);
    }
  }, [serverPagination, clientPage, totalPages]);

  const paginatedData = useMemo(() => {
    if (serverPagination) return data; // server already sliced
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize, serverPagination]);

  const globalStartIndex = serverPagination
    ? (serverPagination.currentPage - 1) * serverPagination.perPage
    : (safePage - 1) * pageSize;

  if (isLoading) {
    return (
      <div className='w-full space-y-3 p-4'>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className='h-12 w-full bg-gray-100 rounded animate-pulse' />
        ))}
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
      <div className='overflow-x-auto'>
        <Table className='w-full'>
          <TableHeader>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={index} className={col.className}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  {emptyState || 'Tidak ada data.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, rowIndex) => (
                <TableRow key={(item as { id: string }).id || rowIndex}>
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex} className={`whitespace-normal ${col.className || ''}`}>
                      {col.cell(item, globalStartIndex + rowIndex)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        serverPagination ? (
          <PaginationBar
            currentPage={serverPagination.currentPage}
            totalPages={serverPagination.lastPage}
            from={serverPagination.from ?? 1}
            to={serverPagination.to ?? data.length}
            total={serverPagination.total}
            onPageChange={serverPagination.onPageChange}
          />
        ) : (
          <PaginationBar
            currentPage={safePage}
            totalPages={totalPages}
            from={globalStartIndex + 1}
            to={Math.min(globalStartIndex + pageSize, data.length)}
            total={data.length}
            onPageChange={setClientPage}
          />
        )
      )}
    </div>
  );
}

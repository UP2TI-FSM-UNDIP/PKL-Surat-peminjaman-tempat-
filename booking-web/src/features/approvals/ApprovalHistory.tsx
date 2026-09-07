import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button/button';
import { type ApprovalItem } from './Approval';
import { PaginationBar, type ServerPagination } from '@/components/ui/data-table';

interface ApprovalHistoryProps {
  bookings: ApprovalItem[];
  showOrganisasi?: boolean;
  onOpenDoc?: (documentId: number) => void;
  serverPagination?: ServerPagination;
}

function statusBadge(status: string) {
  const base =
    'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide';
  if (status === 'approved') {
    return { className: `${base} bg-green-100 text-green-700`, label: 'Disetujui' };
  }
  if (status === 'rejected') {
    return { className: `${base} bg-red-100 text-red-700`, label: 'Ditolak' };
  }
  if (status === 'revisi' || status === 'returned') {
    return { className: `${base} bg-yellow-100 text-yellow-700`, label: 'Revisi' };
  }
  return { className: `${base} bg-blue-100 text-blue-700`, label: 'Menunggu' };
}

/** Parse DD/MM/YYYY to Date */
function parseDDMMYYYY(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  return new Date(year, month - 1, day);
}

export function ApprovalHistory({
  bookings,
  showOrganisasi = true,
  onOpenDoc,
  serverPagination,
}: ApprovalHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [aksiFilter, setAksiFilter] = useState('all');

  const filteredItems = useMemo(() => {
    return bookings.filter((item) => {
      // Search filter
      const matchesSearch =
        item.kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.namaPeminjam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.namaRuang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.organisasiMahasiswa &&
          item.organisasiMahasiswa.toLowerCase().includes(searchTerm.toLowerCase()));

      // Date range filter
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const itemDate = parseDDMMYYYY(item.tanggalMasuk ?? '');
        if (itemDate) {
          if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            if (itemDate < from) matchesDate = false;
          }
          if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            if (itemDate > to) matchesDate = false;
          }
        } else {
          matchesDate = false;
        }
      }

      // Aksi filter
      let matchesAksi = true;
      if (aksiFilter === 'disetujui' || aksiFilter === 'diajukan') {
        matchesAksi = (item.keterangan ?? '').startsWith('Disetujui') || (item.keterangan ?? '').startsWith('Diajukan');
      } else if (aksiFilter === 'revisi') {
        matchesAksi = (item.keterangan ?? '').startsWith('Revisi');
      }

      return matchesSearch && matchesDate && matchesAksi;
    });
  }, [bookings, searchTerm, dateFrom, dateTo, aksiFilter]);

  const hasActiveFilters = dateFrom || dateTo || aksiFilter !== 'all';

  return (
    <div className='w-full space-y-6'>
      <div className='flex flex-col md:flex-row md:flex-wrap items-start md:items-end gap-4'>
        <div className='relative w-full md:max-w-md md:flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input
            type='text'
            placeholder='Cari kegiatan, peminjam, atau ruang...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 w-full'
          />
        </div>
        <div className='flex flex-wrap items-end gap-2 w-full md:w-auto'>
          <div className='flex-1 min-w-[130px] sm:flex-none'>
            <label className='block text-xs font-medium text-gray-500 mb-1'>Dari Tanggal</label>
            <Input
              type='date'
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className='w-full sm:w-36'
            />
          </div>
          <div className='flex-1 min-w-[130px] sm:flex-none'>
            <label className='block text-xs font-medium text-gray-500 mb-1'>Sampai Tanggal</label>
            <Input
              type='date'
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className='w-full sm:w-36'
            />
          </div>
          <div className='w-full sm:w-auto'>
            <label className='block text-xs font-medium text-gray-500 mb-1'>Aksi</label>
            <div className='flex rounded-lg border border-gray-200 overflow-x-auto max-w-full scrollbar-hide'>
              {[
                { value: 'all', label: 'Semua' },
                { value: 'disetujui', label: 'Disetujui/Diajukan' },
                { value: 'revisi', label: 'Revisi' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setAksiFilter(tab.value)}
                  className={`px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-1 sm:flex-none ${aksiFilter === tab.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setAksiFilter('all');
              }}
              className='text-gray-500 w-full sm:w-auto mt-2 sm:mt-0'
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className='rounded-lg border bg-white shadow-sm overflow-x-auto'>
        <Table className="min-w-[550px] w-full text-xs md:text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className='w-10 text-center px-1 py-2 md:px-4'>No</TableHead>
              <TableHead className="px-2 py-2 md:px-4 whitespace-nowrap">Tanggal Diproses</TableHead>
              <TableHead className="px-2 py-2 md:px-4 min-w-[150px]">Nama Kegiatan</TableHead>
              {showOrganisasi && <TableHead className="px-2 py-2 md:px-4">Organisasi</TableHead>}
              <TableHead className='text-center px-1 py-2 md:px-4'>Aksi</TableHead>
              <TableHead className='text-center px-1 py-2 md:px-4'>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showOrganisasi ? 6 : 5}
                  className='h-24 text-center text-gray-500'
                >
                  Belum ada riwayat persetujuan
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item, index) => {
                const badge = statusBadge(item.status);
                // Menyesuaikan ukuran text badge di mobile
                const mobileBadgeLabel = item.status === 'waiting' ? 'Tunggu' :
                  item.status === 'approved' ? 'Setuju' :
                    item.status === 'rejected' ? 'Tolak' :
                      item.status === 'revisi' ? 'Revisi' : badge.label;
                return (
                  <TableRow key={item.id}>
                    <TableCell className='font-medium text-center px-1 py-2 md:px-4'>{index + 1}</TableCell>
                    <TableCell className="px-2 py-2 md:px-4 whitespace-nowrap">{item.tanggalMasuk || '-'}</TableCell>
                    <TableCell className="px-2 py-2 md:px-4">
                      <div className="line-clamp-2 md:line-clamp-none" title={item.kegiatan}>{item.kegiatan}</div>
                    </TableCell>
                    {showOrganisasi && (
                      <TableCell className="px-2 py-2 md:px-4">{item.organisasiMahasiswa || '-'}</TableCell>
                    )}
                    <TableCell className='text-center px-1 py-2 md:px-4'>
                      <span className={`${badge.className} text-[10px] md:text-sm px-1.5 py-0.5 md:px-2 md:py-1`}>
                        <span className="md:hidden">{mobileBadgeLabel}</span>
                        <span className="hidden md:inline">{badge.label}</span>
                      </span>
                    </TableCell>
                    <TableCell className='text-center px-1 py-2 md:px-4'>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] md:h-9 md:text-sm px-2 md:px-3"
                        onClick={() => onOpenDoc?.(item.id)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {serverPagination && serverPagination.lastPage > 1 && (
        <PaginationBar
          currentPage={serverPagination.currentPage}
          totalPages={serverPagination.lastPage}
          from={serverPagination.from ?? 1}
          to={serverPagination.to ?? bookings.length}
          total={serverPagination.total}
          onPageChange={serverPagination.onPageChange}
        />
      )}
    </div>
  );
}

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
import { PaginationBar, type ServerPagination } from '@/components/ui/data-table';

export type ApprovalStatus = 'waiting' | 'approved' | 'revisi' | 'rejected';

export type ActorRole =
  | 'ketua-ormawa'
  | 'ketua-departemen'
  | 'kemahasiswaan'
  | 'senat'
  | 'wadek1'
  | 'dosen-pendamping'
  | 'sumber-daya';

type DocumentType = 'executive-summary' | 'lembar-pengesahan';

export interface DocActionPayload {
  booking: ApprovalItem;
  role: ActorRole;
  doc: DocumentType;
  mode: 'preview' | 'sign';
}

export interface ApprovalItem {
  id: number;
  token?: string;
  kegiatanOrmawa?: string;
  kegiatan: string;
  noHp: string;
  namaPeminjam: string;
  organisasiMahasiswa?: string;
  namaRuang: string;
  tanggal: string;
  waktu: string;
  proposalUrl?: string;
  status: ApprovalStatus;
  tanggalPersetujuan?: string;
  executiveSummarySigned?: boolean;
  lembarPengesahanSigned?: boolean;
  revisiNotes?: string;
  hasProposal?: boolean;
  hasExecutiveSummary?: boolean;
  hasApprovalSheet?: boolean;
  tanggalMasuk?: string;
  keterangan?: string;
}

interface ApprovalProps {
  bookings: ApprovalItem[];
  onApprove?: (id: number) => void;
  onRevise?: (id: number) => void;
  showOrganisasi?: boolean;
  actorRole: ActorRole;
  onOpenDoc?: (documentId: number) => void;
  serverPagination?: ServerPagination;
}

/** Parse DD/MM/YYYY to Date */
function parseDDMMYYYY(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  return new Date(year, month - 1, day);
}

export function Approval({
  bookings,
  showOrganisasi = true,
  onOpenDoc,
  serverPagination,
}: ApprovalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

      return matchesSearch && matchesDate;
    });
  }, [bookings, searchTerm, dateFrom, dateTo]);

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
          {(dateFrom || dateTo) && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className='text-gray-500 w-full sm:w-auto mt-2 sm:mt-0'
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className='rounded-lg border bg-white shadow-sm overflow-x-auto'>
        <Table className="min-w-[500px] w-full text-xs md:text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className='w-10 text-center px-2 py-2 md:px-4'>No</TableHead>
              <TableHead className="px-2 py-2 md:px-4 whitespace-nowrap">Tgl Masuk</TableHead>
              <TableHead className="px-2 py-2 md:px-4 min-w-[150px]">Nama Kegiatan</TableHead>
              {showOrganisasi && <TableHead className="px-2 py-2 md:px-4">Organisasi</TableHead>}
              <TableHead className='text-center px-2 py-2 md:px-4'>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showOrganisasi ? 5 : 4}
                  className='h-24 text-center text-gray-500'
                >
                  Tidak ada data ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className='font-medium text-center px-2 py-2 md:px-4'>{index + 1}</TableCell>
                  <TableCell className="px-2 py-2 md:px-4 whitespace-nowrap">{item.tanggalMasuk || '-'}</TableCell>
                  <TableCell className="px-2 py-2 md:px-4">
                    <div className="line-clamp-3 md:line-clamp-none" title={item.kegiatan}>{item.kegiatan}</div>
                  </TableCell>
                  {showOrganisasi && (
                    <TableCell className="px-2 py-2 md:px-4">{item.organisasiMahasiswa || '-'}</TableCell>
                  )}
                  <TableCell className='text-center px-2 py-2 md:px-4'>
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
              ))
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

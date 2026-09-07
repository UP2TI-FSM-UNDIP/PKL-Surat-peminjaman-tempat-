import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { Plus, FilePlus, AlertCircle, Clock, AlertTriangle, Eye, Search } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';

import { documentService } from '@/services/document.service';
import { DocumentStatusBadge } from '@/components/DocumentStatusBadge';
import { documentHelpers } from '@/utils/documentUtils';
import type { Document } from '@/types/document';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

export const Route = createFileRoute('/peminjam/pinjam/')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    status: (search.status as string) ?? 'ALL',
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { status: initialStatus } = Route.useSearch();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus ?? 'ALL');

  // --- 1. DATA FETCHING ---
  const {
    data: queryResult,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['documents', currentPage],
    queryFn: () => documentService.getDocuments({ page_my: currentPage }),
    refetchInterval: 30000,
    placeholderData: keepPreviousData,
  });

  // Deduplicate
  const documents = useMemo(() => {
    const myDocs = queryResult?.my_documents || [];
    const uniqueMap = new Map<string, Document>();

    myDocs.forEach((doc: Document) => {
      const content = doc.content || {};
      const key = `${content.room_id || 'null'}_${content.booking_date || 'null'}_${content.start_time || 'null'}_${content.end_time || 'null'}`;
      const existing = uniqueMap.get(key);
      if (!existing) {
        uniqueMap.set(key, doc);
      } else {
        if (doc.status === 'IN_PROGRESS' && existing.status === 'DRAFT') {
          uniqueMap.set(key, doc);
        } else if (doc.status === existing.status && doc.id > existing.id) {
          uniqueMap.set(key, doc);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }, [queryResult]);

  const pagination = queryResult?.my_documents_pagination;

  // Filter: search + status (client-side)
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const eventName = documentHelpers.getEventName(doc).toLowerCase();
      const matchSearch = searchQuery === '' || eventName.includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || doc.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [documents, searchQuery, statusFilter]);

  const handleAjukanPinjam = () => {
    navigate({
      to: '/peminjam/pinjam/detail-tempat',
      search: {
        editId: undefined, roomId: undefined, bookingDate: undefined,
        startTime: undefined, endTime: undefined, purpose: undefined,
        ketuaNama: undefined, ketuaNim: undefined, ketuaHp: undefined,
      },
    });
  };

  // --- 2. KOLOM TABEL ---
  const columns = useMemo<ColumnDef<Document>[]>(
    () => [
      {
        header: 'No',
        className: 'w-12 text-center',
        cell: (_, index) => index + 1,
      },
      {
        header: 'Tanggal Pengajuan',
        className: 'w-[110px]',
        cell: (doc) =>
          new Date(doc.created_at).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
      },
      {
        header: 'Deadline',
        className: 'w-[200px] whitespace-nowrap',
        cell: (doc) => {
          const deadlineStatus = documentHelpers.getDeadlineStatus(doc);
          const deadlineText = documentHelpers.getDeadlineText(doc);

          if (doc.status === 'APPROVED' || doc.status === 'REJECTED') {
            return <span className='text-xs text-gray-400'>-</span>;
          }

          const getColorClasses = () => {
            switch (deadlineStatus) {
              case 'expired': return 'bg-red-100 text-red-800 border-red-300';
              case 'critical': return 'bg-orange-100 text-orange-800 border-orange-300';
              case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
              default: return 'bg-green-100 text-green-800 border-green-300';
            }
          };

          const getIcon = () => {
            if (deadlineStatus === 'expired' || deadlineStatus === 'critical') {
              return <AlertTriangle className='w-3 h-3 shrink-0' />;
            }
            return <Clock className='w-3 h-3 shrink-0' />;
          };

          return (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getColorClasses()}`}>
              {getIcon()}
              <span>{deadlineText}</span>
            </div>
          );
        },
      },
      {
        header: 'Nama Kegiatan',
        className: 'w-[180px] font-medium overflow-hidden',
        cell: (doc) => (
          <div className='truncate max-w-[180px]' title={documentHelpers.getEventName(doc)}>
            {documentHelpers.getEventName(doc)}
          </div>
        ),
      },
      {
        header: 'Status',
        className: 'w-[120px]',
        cell: (doc) => <DocumentStatusBadge doc={doc} />,
      },
      {
        header: 'Aksi',
        className: 'w-24 text-center',
        cell: (doc) => (
          <Button
            size='sm'
            variant='outline'
            className='flex items-center gap-2 w-full justify-center'
            onClick={() => navigate({ to: '/peminjam/pinjam/detail/$id', params: { id: doc.id.toString() } })}
          >
            <Eye className='w-4 h-4' />
            Detail
          </Button>
        ),
      },
    ],
    [navigate],
  );

  // --- 3. EMPTY STATE ---
  const EmptyState = (
    <div className='text-center py-12'>
      <FilePlus className='w-16 h-16 mx-auto text-gray-300 mb-4' />
      <h3 className='text-lg font-semibold text-gray-700 mb-2'>Belum Ada Pengajuan</h3>
      <p className='text-sm text-gray-500 mb-4'>Mulai ajukan peminjaman ruangan untuk kegiatan Anda</p>
      <Button onClick={handleAjukanPinjam} className='gap-2'>
        <Plus className='w-4 h-4' /> Ajukan Sekarang
      </Button>
    </div>
  );

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <AlertCircle className='w-12 h-12 text-red-400 mb-4' />
        <h3 className='text-lg font-semibold text-gray-700 mb-2'>Gagal Memuat Data</h3>
        <p className='text-sm text-gray-500 mb-4'>Terjadi kesalahan saat memuat daftar pengajuan. Silakan coba lagi.</p>
        <Button onClick={() => refetch()} variant='outline' className='gap-2'>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className='space-y-4 md:space-y-6 p-2 md:p-0'>
      {/* Info Box */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3'>
        <AlertCircle className='w-5 h-5 text-blue-600 shrink-0 mt-0.5' />
        <div className='flex-1'>
          <h3 className='text-sm font-semibold text-blue-900 mb-1'>Perhatian: Batas Waktu Pengajuan</h3>
          <p className='text-sm text-blue-800'>
            Setiap pengajuan memiliki <strong>batas waktu 14 hari (2 minggu)</strong> sejak tanggal pengajuan untuk diselesaikan.
            Pastikan Anda melengkapi dan mengajukan dokumen tepat waktu!
          </p>
        </div>
      </div>

      {/* Header */}
      <div className='flex justify-between items-center gap-3'>
        <h1 className='text-xl md:text-2xl font-bold text-gray-900'>Daftar Pengajuan</h1>
        <Button onClick={handleAjukanPinjam} size='lg' className='gap-2'>
          <Plus className='w-4 h-4 md:w-5 md:h-5' />
          <span className='text-sm md:text-base'>Ajukan Peminjaman</span>
        </Button>
      </div>

      {/* Search + Filter Tabs */}
      <div className='space-y-3'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
          <input
            type='text'
            placeholder='Cari nama kegiatan...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
          />
        </div>

        <div className='flex gap-1 flex-wrap'>
          {([
            { label: 'Semua', value: 'ALL' },
            { label: 'Draft', value: 'DRAFT' },
            { label: 'Diproses', value: 'IN_PROGRESS' },
            { label: 'Revisi', value: 'REVISION' },
            { label: 'Disetujui', value: 'APPROVED' },
            { label: 'Ditolak', value: 'REJECTED' },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${statusFilter === tab.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        data={filteredDocuments}
        columns={columns}
        isLoading={isLoading}
        emptyState={EmptyState}
        serverPagination={pagination && pagination.last_page > 1 ? {
          currentPage: pagination.current_page,
          lastPage: pagination.last_page,
          total: pagination.total,
          from: pagination.from,
          to: pagination.to,
          perPage: pagination.per_page,
          onPageChange: setCurrentPage,
        } : undefined}
      />
    </div>
  );
}

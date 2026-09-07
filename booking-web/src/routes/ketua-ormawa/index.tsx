import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Clock, Users, CheckCircle } from 'lucide-react';
import { AxiosError } from 'axios';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { StatCard } from '@/components/common/StatCard';
import { Approval } from '@/features/approvals';
import type { ActorRole } from '@/features/approvals';
import {
  mapDocumentsToApprovalItems,
} from '@/features/approvals/approval-utils';
import { documentService } from '@/services/document.service';
import { Button } from '@/components/ui/button/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RevisionDialog } from '@/components/common/RevisionDialog';

export const Route = createFileRoute('/ketua-ormawa/')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      documentId: search.documentId as number | undefined,
      autoApprove: search.autoApprove as boolean | undefined,
      return: search.return as string | undefined,
    };
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const { documentId, autoApprove } = Route.useSearch();
  const actorRole: ActorRole = 'ketua-ormawa';
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [dialogState, setDialogState] = useState<{
    type: 'approve' | 'revise' | null;
    id: number | null;
  }>({ type: null, id: null });
  const [actionLoading, setActionLoading] = useState(false);

  const {
    data: queryResult,
    isLoading: loading,
    refetch: fetchDocuments,
  } = useQuery({
    queryKey: ['documents-ketua-ormawa', currentPage],
    queryFn: () => documentService.getDocuments({ page_pending: currentPage }),
    placeholderData: keepPreviousData,
  });

  const approvalItems = useMemo(() => {
    const pendingDocs = queryResult?.pending_documents || [];
    return mapDocumentsToApprovalItems(pendingDocs);
  }, [queryResult]);

  const approvedCount = queryResult?.processed_documents_pagination?.total ?? 0;
  const pagination = queryResult?.pending_documents_pagination;

  // Auto-approve after returning from signature page
  useEffect(() => {
    if (autoApprove && documentId) {
      const performAutoApprove = async () => {
        try {
          await documentService.approveDocument(
            documentId,
            '',
            'Approved after signature upload',
          );

          // Clear search params
          navigate({
            to: '/ketua-ormawa',
            replace: true,
            search: {
              documentId: undefined,
              autoApprove: undefined,
              return: undefined,
            },
          });

          // Refresh data
          await fetchDocuments();
        } catch (err) {
          if (err instanceof AxiosError) {
            setError(err.response?.data?.message || 'Gagal approve otomatis');
          }
        }
      };

      performAutoApprove();
    }
  }, [autoApprove, documentId]);

  const tableRef = useRef<HTMLDivElement>(null);

  const scrollToTable = useCallback(() => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const uniqueSubmittersCount = useMemo(() => {
    const submitters = new Set(approvalItems.map((item) => item.namaPeminjam));
    return submitters.size;
  }, [approvalItems]);

  const stats = useMemo(() => [
    {
      title: 'Antrean Persetujuan',
      value: String(approvalItems.filter((b) => b.status === 'waiting').length),
      icon: Clock,
      textColor: 'text-yellow-600',
      bgLight: 'bg-yellow-50',
      onClick: scrollToTable,
    },
    {
      title: 'Total Pengaju',
      value: String(uniqueSubmittersCount),
      icon: Users,
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      onClick: scrollToTable,
    },
    {
      title: 'Total Disetujui',
      value: String(approvedCount),
      icon: CheckCircle,
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
      onClick: () => navigate({ to: '/ketua-ormawa/riwayat-persetujuan' }),
    },
  ], [approvalItems, uniqueSubmittersCount, approvedCount, navigate, scrollToTable]);

  const handleApprove = useCallback((id: number) => {
    setDialogState({ type: 'approve', id });
  }, []);

  const onConfirmApprove = useCallback(() => {
    if (dialogState.id) {
      navigate({
        to: '/ketua-ormawa/sign-document',
        search: {
          documentId: dialogState.id,
        },
      });
    }
    setDialogState({ type: null, id: null });
  }, [dialogState.id, navigate]);

  const handleRevise = useCallback((id: number) => {
    setDialogState({ type: 'revise', id });
  }, []);

  const onConfirmRevise = useCallback(async (note: string) => {
    if (!dialogState.id) return;
    setActionLoading(true);

    try {
      const id = dialogState.id;
      const doc = await documentService.getDocument(id);
      await documentService.reviseDocument(id, doc.creator_id, note);
      await fetchDocuments();
    } catch (err) {
      console.error('Failed to revise document:', err);
    } finally {
      setActionLoading(false);
      setDialogState({ type: null, id: null });
    }
  }, [dialogState.id, fetchDocuments]);

  const handleOpenDoc = useCallback((documentId: number) => {
    navigate({
      to: '/ketua-ormawa/sign-document',
      search: { documentId }
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className='p-6 flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <div className='text-lg font-semibold text-gray-700'>
            Memuat data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6 flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <div className='text-lg font-semibold text-red-600 mb-4'>{error}</div>
          <Button onClick={() => fetchDocuments()}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>
          Dashboard Ketua Ormawa
        </h1>
        <p className='text-gray-600 mt-1'>
          Ringkasan aktivitas organisasi Anda
        </p>
      </div>

      <div className='grid grid-cols-3 gap-2 sm:gap-4 mb-6'>
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            textColor={stat.textColor}
            bgLight={stat.bgLight}
            onClick={stat.onClick}
          />
        ))}
      </div>

      <div className='mt-6' ref={tableRef}>
        <h2 className='text-lg font-semibold mb-4'>Antrean Persetujuan</h2>
        {approvalItems.length === 0 ? (
          <div className='bg-white rounded-lg border border-gray-200 p-8 text-center'>
            <p className='text-gray-500'>
              Tidak ada dokumen yang menunggu persetujuan
            </p>
          </div>
        ) : (
          <Approval
            bookings={approvalItems}
            onApprove={handleApprove}
            onRevise={handleRevise}
            actorRole={actorRole}
            onOpenDoc={handleOpenDoc}
            showOrganisasi={true}
            serverPagination={pagination ? {
              currentPage: pagination.current_page,
              lastPage: pagination.last_page,
              total: pagination.total,
              from: pagination.from,
              to: pagination.to,
              perPage: pagination.per_page,
              onPageChange: setCurrentPage,
            } : undefined}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={dialogState.type === 'approve'}
        onClose={() => setDialogState({ type: null, id: null })}
        onConfirm={onConfirmApprove}
        title='✍️ Membubuhkan Tanda Tangan'
        description='Untuk menyetujui dokumen ini, Anda perlu membubuhkan tanda tangan digital. Anda akan diarahkan ke halaman tanda tangan.'
        confirmLabel='Lanjutkan'
      />

      <RevisionDialog
        isOpen={dialogState.type === 'revise'}
        onClose={() => setDialogState({ type: null, id: null })}
        onConfirm={onConfirmRevise}
        variant='destructive'
        loading={actionLoading}
      />
    </>
  );
}

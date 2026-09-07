import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useMemo, useCallback } from 'react';
import { Clock, CheckCircle, FileText } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { StatCard } from '@/components/common/StatCard';
import { Approval } from '@/features/approvals';
import type { ActorRole } from '@/features/approvals';
import { documentService } from '@/services/document.service';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RevisionDialog } from '@/components/common/RevisionDialog';
import {
  mapDocumentsToApprovalItems,
} from '@/features/approvals/approval-utils';
import { Button } from '@/components/ui/button/button';
import { documentTemplateService } from '@/services/document-template.service';

export const Route = createFileRoute('/kemahasiswaan/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const actorRole: ActorRole = 'kemahasiswaan';
  const tableRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [templateCount, setTemplateCount] = useState(0);

  // Dialog States
  const [dialogState, setDialogState] = useState<{
    type: 'approve' | 'revise' | null;
    id: number | null;
  }>({ type: null, id: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch templates count
  const { } = useQuery({
    queryKey: ['templates-kemahasiswaan'],
    queryFn: async () => {
      const templates = await documentTemplateService.getTemplates();
      setTemplateCount(templates.length);
      return templates;
    },
  });

  // Fetch documents with server-side pagination
  const {
    data: queryResult,
    isLoading: loading,
    isError,
    refetch: fetchDocuments,
  } = useQuery({
    queryKey: ['documents-kemahasiswaan', currentPage],
    queryFn: () => documentService.getDocuments({ page_pending: currentPage }),
    placeholderData: keepPreviousData,
  });

  const approvalItems = useMemo(() => {
    const pendingDocs = queryResult?.pending_documents || [];
    return mapDocumentsToApprovalItems(pendingDocs);
  }, [queryResult]);

  const approvedCount = queryResult?.processed_documents_pagination?.total ?? 0;
  const pagination = queryResult?.pending_documents_pagination;
  const error = isError ? 'Gagal memuat data dokumen' : null;

  const scrollToTable = useCallback(() => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
      title: 'Total Template',
      value: String(templateCount),
      icon: FileText,
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      onClick: () => navigate({ to: '/kemahasiswaan/template-dokumen' }),
    },
    {
      title: 'Total Disetujui',
      value: String(approvedCount),
      icon: CheckCircle,
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
      onClick: () => navigate({ to: '/kemahasiswaan/riwayat-persetujuan' }),
    },
  ], [approvalItems, templateCount, approvedCount, navigate, scrollToTable]);

  // Same pattern as wadek1: approve dialog → navigate to sign-document
  const handleApprove = useCallback((id: number) => {
    setDialogState({ type: 'approve', id });
  }, []);

  const onConfirmApprove = useCallback(() => {
    if (dialogState.id) {
      navigate({
        to: '/kemahasiswaan/approve-document',
        search: { documentId: dialogState.id },
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

  // Lihat Detail → same as approve, navigate to sign-document
  const handleOpenDoc = useCallback((documentId: number) => {
    navigate({
      to: '/kemahasiswaan/approve-document',
      search: { documentId },
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className='p-6 flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <div className='text-lg font-semibold text-gray-700'>Memuat data...</div>
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
          Dashboard Kemahasiswaan
        </h1>
        <p className='text-gray-600 mt-1'>
          Review dan persetujuan peminjaman ruang oleh Kemahasiswaan
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
        title='📋 Review Dokumen'
        description='Anda akan diarahkan ke halaman review dokumen untuk melihat detail dan menyetujui dokumen.'
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

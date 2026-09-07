import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ApprovalHistory } from '@/features/approvals';
import { documentService } from '@/services/document.service';
import { mapDocumentsToApprovalItems } from '@/features/approvals/approval-utils';
import { Button } from '@/components/ui/button/button';

export const Route = createFileRoute('/ketua-ormawa/riwayat-persetujuan')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: queryResult,
    isLoading: loading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['documents-ketua-ormawa-riwayat', currentPage],
    queryFn: () => documentService.getDocuments({ page_processed: currentPage }),
    placeholderData: keepPreviousData,
  });

  const approvalItems = useMemo(() => {
    const processedDocs = queryResult?.processed_documents || [];
    return mapDocumentsToApprovalItems(processedDocs);
  }, [queryResult]);

  const pagination = queryResult?.processed_documents_pagination;
  const error = isError ? 'Gagal memuat riwayat persetujuan' : null;

  const handleOpenDoc = (documentId: number) => {
    navigate({
      to: '/ketua-ormawa/preview-document',
      search: { documentId }
    });
  };

  if (loading) {
    return (
      <div className='container mx-auto py-6'>
        <div className='text-center'>
          <div className='text-lg font-semibold text-gray-700'>Memuat riwayat...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto py-6'>
        <div className='text-center'>
          <div className='text-lg font-semibold text-red-600 mb-4'>{error}</div>
          <Button onClick={() => refetch()}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Riwayat Persetujuan</h1>
        <p className='text-muted-foreground'>
          Daftar peminjaman yang sudah diproses
        </p>
      </div>

      {approvalItems.length === 0 ? (
        <div className='bg-white rounded-lg border border-gray-200 p-8 text-center'>
          <p className='text-gray-500'>Belum ada riwayat persetujuan</p>
        </div>
      ) : (
        <ApprovalHistory
          bookings={approvalItems}
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
  );
}

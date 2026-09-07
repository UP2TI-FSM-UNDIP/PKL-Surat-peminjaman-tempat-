import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import { documentService, type Document } from '@/services/document.service';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RevisionDialog } from '@/components/common/RevisionDialog';

export const Route = createFileRoute('/preview-document')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      documentId: search.documentId as number | undefined,
      return: search.return as string | undefined,
    };
  },
});

type DocumentType = 'proposal' | 'approval-sheet' | 'executive-summary';

export function DocumentPreviewContent({
  documentId,
  returnPath,
}: {
  documentId: number | undefined;
  returnPath: string;
}) {
  const navigate = useNavigate();

  const [selectedDocType, setSelectedDocType] =
    useState<DocumentType>('approval-sheet');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [dialogState, setDialogState] = useState<{
    type: 'approve' | 'revise' | null;
  }>({ type: null });

  useEffect(() => {
    if (documentId) {
      loadDocumentPreview(selectedDocType);
      loadDocument();
    }
  }, [documentId, selectedDocType]);

  const loadDocument = async () => {
    if (!documentId) return;

    try {
      const doc = await documentService.getDocument(documentId);
      setDocument(doc);
    } catch (err) {
      console.error('Failed to load document:', err);
    }
  };

  const loadDocumentPreview = async (docType: DocumentType) => {
    if (!documentId) return;

    try {
      setLoading(true);
      setError(null);
      // Clean up previous URL
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }

      const response = await api.get(
        `/documents/${documentId}/file/${docType}/pdf`,
        {
          responseType: 'blob',
        },
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Failed to load document preview:', err);
      const error = err as AxiosError<{ message?: string }>;
      if (error.response?.status === 404) {
        setPdfUrl(null);
        setError(`Dokumen ${docType} belum tersedia`);
      } else {
        setError('Gagal memuat preview dokumen');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setDialogState({ type: 'approve' });
  };

  const onConfirmApprove = async () => {
    if (!documentId) return;

    try {
      setApproveLoading(true);
      await documentService.approveDocument(
        documentId,
        '',
        'Disetujui melalui preview',
      );
      navigate({ to: returnPath as any });
    } catch (err) {
      console.error('Failed to approve document:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(
        axiosError.response?.data?.message || 'Gagal menyetujui dokumen',
      );
    } finally {
      setApproveLoading(false);
      setDialogState({ type: null });
    }
  };

  const handleRevise = () => {
    setDialogState({ type: 'revise' });
  };

  const onConfirmRevise = async (note: string) => {
    if (!documentId || !document) return;

    try {
      setApproveLoading(true);
      await documentService.reviseDocument(
        documentId,
        document.creator_id,
        note,
      );
      navigate({ to: returnPath as any });
    } catch (err) {
      console.error('Failed to revise document:', err);
      const error = err as AxiosError<{ message?: string }>;
      setError(
        error.response?.data?.message ||
          'Gagal mengembalikan dokumen untuk revisi',
      );
    } finally {
      setApproveLoading(false);
      setDialogState({ type: null });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Preview Dokumen</h1>
        <p className='text-gray-600 mt-1'>Lihat dokumen yang telah diajukan</p>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Preview Dokumen</CardTitle>
            <Select
              value={selectedDocType}
              onValueChange={(val) => setSelectedDocType(val as DocumentType)}
            >
              <SelectTrigger className='w-50'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='proposal'>Proposal</SelectItem>
                <SelectItem value='approval-sheet'>
                  Lembar Pengesahan
                </SelectItem>
                <SelectItem value='executive-summary'>
                  Executive Summary
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Preview PDF */}
          {loading && (
            <div className='flex items-center justify-center h-200 border rounded-lg bg-gray-50'>
              <p className='text-gray-500'>Memuat dokumen...</p>
            </div>
          )}
          {!loading && pdfUrl && (
            <div className='border rounded-lg overflow-hidden'>
              <iframe
                src={pdfUrl}
                className='w-full h-200'
                title='Document Preview'
              />
            </div>
          )}
          {!loading && !pdfUrl && (
            <div className='flex items-center justify-center h-200 border rounded-lg bg-gray-50'>
              <p className='text-gray-500'>Dokumen tidak tersedia</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {documentId && (
        <div className='mt-6 flex gap-3 justify-center w-full'>
          <Button
            onClick={handleRevise}
            disabled={loading || approveLoading}
            variant='destructive'
            className='flex-1'
          >
            {approveLoading ? 'Memproses...' : 'Kirim Revisi'}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading || approveLoading}
            className='flex-1'
          >
            {approveLoading ? 'Memproses...' : 'Setujui Dokumen'}
          </Button>
        </div>
      )}

      {error && (
        <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center'>
          {error}
        </div>
      )}

      <div className='mt-6 flex justify-end'>
        <Button
          onClick={() => navigate({ to: returnPath as any })}
          variant='outline'
        >
          Kembali
        </Button>
      </div>

      <ConfirmDialog
        isOpen={dialogState.type === 'approve'}
        onClose={() => setDialogState({ type: null })}
        onConfirm={onConfirmApprove}
        title='⚠️ Persetujuan Dokumen'
        description='Apakah Anda yakin ingin menyetujui dokumen ini? Dokumen akan diteruskan ke step berikutnya.'
        confirmLabel='Setujui'
      />

      <RevisionDialog
        isOpen={dialogState.type === 'revise'}
        onClose={() => setDialogState({ type: null })}
        onConfirm={onConfirmRevise}
        variant='destructive'
      />
    </div>
  );
}

function RouteComponent() {
  const { documentId, return: returnPath } = Route.useSearch();
  return (
    <DocumentPreviewContent
      documentId={documentId}
      returnPath={returnPath || '/'}
    />
  );
}

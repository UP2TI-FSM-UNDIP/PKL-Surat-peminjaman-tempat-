import { createFileRoute } from '@tanstack/react-router';
import { HistoryDetailContent } from '@/features/approvals';

export const Route = createFileRoute('/dosen-pendamping/preview-document')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      documentId: search.documentId as number | undefined,
    };
  },
});

function RouteComponent() {
  const { documentId } = Route.useSearch();

  return <HistoryDetailContent documentId={documentId} returnPath='/dosen-pendamping/riwayat-persetujuan' />;
}

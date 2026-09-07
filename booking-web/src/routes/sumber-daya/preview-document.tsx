import { createFileRoute } from '@tanstack/react-router';
import { HistoryDetailContent } from '@/features/approvals';

export const Route = createFileRoute('/sumber-daya/preview-document')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      documentId: search.documentId as number | undefined,
    };
  },
});

function RouteComponent() {
  const { documentId } = Route.useSearch();

  return <HistoryDetailContent documentId={documentId} returnPath='/sumber-daya/riwayat-persetujuan' />;
}

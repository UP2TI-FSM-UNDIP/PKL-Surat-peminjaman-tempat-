import { createFileRoute } from '@tanstack/react-router';
import { HistoryDetailContent } from '@/features/approvals';

export const Route = createFileRoute('/wadek1/preview-document')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      documentId: search.documentId as number | undefined,
    };
  },
});

function RouteComponent() {
  const { documentId } = Route.useSearch();

  return <HistoryDetailContent documentId={documentId} returnPath='/wadek1/riwayat-persetujuan' />;
}

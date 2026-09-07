import { createFileRoute } from '@tanstack/react-router';
import { SignDocumentContent } from '@/features/documents/components/SignDocumentContent';

export const Route = createFileRoute('/senat/sign-document')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      documentId: search.documentId as number | undefined,
    };
  },
});

function RouteComponent() {
  const { documentId } = Route.useSearch();

  return <SignDocumentContent documentId={documentId} returnPath='/senat' />;
}

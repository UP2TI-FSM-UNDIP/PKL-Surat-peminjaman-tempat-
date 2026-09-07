import { createFileRoute } from '@tanstack/react-router';
import { SignDocumentContent } from '@/features/documents/components/SignDocumentContent';

export const Route = createFileRoute('/sign-document')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      documentId: search.documentId as number | undefined,
      return: search.return as string | undefined,
    };
  },
});

function RouteComponent() {
  const { documentId, return: returnPath } = Route.useSearch();
  return (
    <SignDocumentContent
      documentId={documentId}
      returnPath={returnPath || '/'}
    />
  );
}

import { createFileRoute } from '@tanstack/react-router';
import { SignDocumentContent } from '@/features/documents/components/SignDocumentContent';

export const Route = createFileRoute('/sumber-daya/approve-document')({
    component: RouteComponent,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            documentId: search.documentId as number | undefined,
        };
    },
});

function RouteComponent() {
    const { documentId } = Route.useSearch();

    return <SignDocumentContent documentId={documentId} returnPath='/sumber-daya' />;
}

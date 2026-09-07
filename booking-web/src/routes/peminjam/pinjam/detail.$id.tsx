import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { documentService } from '@/services/document.service';
import { HistoryDetailContent } from '@/features/approvals/HistoryDetailContent';

export const Route = createFileRoute('/peminjam/pinjam/detail/$id')({
    component: DetailPengajuanPage,
});

function DetailPengajuanPage() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const docId = parseInt(id, 10);

    // We fetch the document just to check its status for showing the button.
    // HistoryDetailContent will also fetch it (React Query handles deduplication).
    const { data: doc } = useQuery({
        queryKey: ['document', docId],
        queryFn: () => documentService.getDocument(docId),
        enabled: !isNaN(docId),
    });

    const isDraftOrRevision = doc && (doc.status === 'DRAFT' || doc.status === 'REVISION');

    return (
        <HistoryDetailContent
            documentId={docId}
            returnPath="/peminjam/pinjam?status=ALL"
        >
            {isDraftOrRevision && (
                <button
                    onClick={() =>
                        navigate({
                            to: '/peminjam/pinjam/detail-tempat',
                            search: {
                                editId: doc.id,
                                roomId: undefined,
                                bookingDate: undefined,
                                startTime: undefined,
                                endTime: undefined,
                                purpose: undefined,
                                ketuaNama: undefined,
                                ketuaNim: undefined,
                                ketuaHp: undefined,
                            },
                        })
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                    <ClipboardList className="w-4 h-4" />
                    Lengkapi Pengajuan
                </button>
            )}
        </HistoryDetailContent>
    );
}

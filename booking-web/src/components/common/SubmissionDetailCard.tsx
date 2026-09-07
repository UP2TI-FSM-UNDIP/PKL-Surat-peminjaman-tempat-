import { DocumentStatusBadge } from '@/components/DocumentStatusBadge';
import { documentHelpers } from '@/utils/documentUtils';
import type { Document } from '@/services/document.service';

interface SubmissionDetailCardProps {
    doc: Document;
}

export function SubmissionDetailCard({ doc }: SubmissionDetailCardProps) {
    const content = doc.content || {};
    const logs = doc.logs ?? [];

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
            <h2 className="text-base font-semibold text-gray-800 border-b pb-2">
                Informasi Kegiatan
            </h2>

            <InfoRow label="Nama Peminjam" value={doc.content?.ketua_pelaksana_nama || doc.creator?.name || '-'} />
            <InfoRow label="Nama Kegiatan" value={documentHelpers.getEventName(doc)} />
            <InfoRow label="Organisasi" value={doc.unit?.name} />
            <InfoRow
                label="Tgl Pengajuan"
                value={new Date(doc.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                })}
            />
            <InfoRow label="Tanggal Acara" value={documentHelpers.getBookingDate(doc)} />
            <InfoRow
                label="Waktu"
                value={
                    content.start_time && content.end_time
                        ? `${content.start_time} – ${content.end_time}`
                        : '-'
                }
            />
            <InfoRow label="Ruangan" value={documentHelpers.getRoomInfo(doc)} />

            <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <DocumentStatusBadge doc={doc} />
            </div>

            {doc.status === 'IN_PROGRESS' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                    Dokumen sedang direview oleh{' '}
                    <span className="font-semibold">{documentHelpers.getCurrentHolder(doc)}</span>
                </div>
            )}

            {(doc.status === 'REVISION' || doc.status === 'REJECTED') && (() => {
                const returnedLog = [...logs].reverse().find((l) => l.action === 'RETURNED');
                const note = returnedLog?.note || 'Perlu revisi';
                const revisor = returnedLog?.user
                    ? `${returnedLog.user.name}${returnedLog.user.unit ? ` (${returnedLog.user.unit.name})` : ''}`
                    : 'Approver';
                return (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-1">
                        <div className="text-xs font-bold text-red-500 uppercase tracking-wide">Perlu Revisi</div>
                        <div className="text-xs text-gray-700">Oleh: <span className="font-semibold">{revisor}</span></div>
                        <div className="text-xs text-gray-600 italic">"{note}"</div>
                    </div>
                );
            })()}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-sm font-medium text-gray-900">{value || '-'}</div>
        </div>
    );
}

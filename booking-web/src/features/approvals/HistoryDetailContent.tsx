import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, CheckCircle2, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { documentService } from '@/services/document.service';

import { SubmissionDetailCard } from '@/components/common/SubmissionDetailCard';
import api from '@/lib/axios';

type DocType = 'proposal' | 'executive-summary' | 'approval-sheet';

const DOC_LABELS: Record<DocType, string> = {
    proposal: 'Proposal',
    'executive-summary': 'Executive Summary',
    'approval-sheet': 'Lembar Pengesahan',
};

interface HistoryDetailContentProps {
    documentId: number | undefined;
    returnPath: string;
    children?: React.ReactNode;
}

export function HistoryDetailContent({
    documentId,
    returnPath,
    children,
}: HistoryDetailContentProps) {
    const navigate = useNavigate();
    const docId = documentId ?? 0;

    // ── Fetch dokumen ─────────────────────────────────────────────────────────
    const {
        data: doc,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['document', docId],
        queryFn: () => documentService.getDocument(docId),
        enabled: docId > 0,
    });



    // ── PDF Preview State ─────────────────────────────────────────────────────
    const [selectedDocType, setSelectedDocType] = useState<DocType>('proposal');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const prevBlobRef = useRef<string | null>(null);

    const setBlobUrl = useCallback((url: string | null) => {
        if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
        prevBlobRef.current = url;
        setPdfUrl(url);
    }, []);

    useEffect(() => {
        return () => {
            if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
        };
    }, []);

    const loadPdf = useCallback(
        async (type: DocType) => {
            if (!docId || docId <= 0) return;
            setPdfLoading(true);
            try {
                const response = await api.get(
                    `/documents/${docId}/file/${type}/pdf`,
                    { responseType: 'blob' },
                );
                const blob = new Blob([response.data], { type: 'application/pdf' });
                setBlobUrl(URL.createObjectURL(blob));
            } catch {
                setBlobUrl(null);
            } finally {
                setPdfLoading(false);
            }
        },
        [docId, setBlobUrl],
    );

    useEffect(() => {
        if (doc) loadPdf(selectedDocType);
    }, [doc, selectedDocType, loadPdf]);

    // ── Loading / Error ───────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-500">Memuat detail pengajuan...</span>
            </div>
        );
    }

    if (isError || !doc) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-gray-500">Pengajuan tidak ditemukan.</p>
                <Button
                    variant="outline"
                    onClick={() => navigate({ to: returnPath as string })}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
            </div>
        );
    }

    const currentStep = doc.current_step_order ?? 0;
    const steps = doc.workflow?.steps ?? [];
    const logs = doc.logs ?? [];

    // ── Build log-based timeline ─────────────────────────────────────────────
    const stepsMap = new Map(steps.map((s) => [s.step_order, s.step_name]));

    type TimelineEntry =
        | { type: 'step'; action: string; stepName: string; user?: string; roleName?: string; note?: string; date: string }
        | { type: 'returned'; user?: string; roleName?: string; note?: string; date: string }
        | { type: 'submitted'; user?: string; note?: string; date: string; isResubmit: boolean }
        | { type: 'active'; stepName: string; holder?: string }
        | { type: 'pending'; stepName: string };

    const timeline: TimelineEntry[] = [];
    let hasBeenReturned = false;

    // Process logs chronologically (already sorted by created_at asc from backend)
    for (const log of logs) {
        const action = log.action as string;

        if (action === 'APPROVED' && log.step_snapshot != null && log.step_snapshot > 0) {
            timeline.push({
                type: 'step',
                action: 'APPROVED',
                stepName: stepsMap.get(log.step_snapshot) ?? `Step ${log.step_snapshot}`,
                user: log.user?.name,
                roleName: log.user?.role?.name,
                note: log.note,
                date: log.created_at,
            });
        } else if (action === 'RETURNED') {
            hasBeenReturned = true;
            timeline.push({
                type: 'returned',
                user: log.user?.name,
                roleName: log.user?.role?.name,
                note: log.note,
                date: log.created_at,
            });
        } else if (action === 'SUBMITTED') {
            timeline.push({
                type: 'submitted',
                user: log.user?.name,
                note: log.note,
                date: log.created_at,
                isResubmit: hasBeenReturned,
            });
        }
    }

    // Add active + pending steps for in-progress or revision documents
    if (doc.status === 'IN_PROGRESS' || doc.status === 'REVISION') {
        const sortedSteps = steps.slice().sort((a, b) => a.step_order - b.step_order);
        for (const step of sortedSteps) {
            if (step.step_order === currentStep) {
                timeline.push({
                    type: 'active',
                    stepName: step.step_name,
                    holder: doc.current_holder?.name,
                });
            } else if (step.step_order > currentStep) {
                timeline.push({
                    type: 'pending',
                    stepName: step.step_name,
                });
            }
        }
    }

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const availableDocs: { type: DocType; hasFile: boolean }[] = [
        { type: 'proposal', hasFile: !!doc.file_proposal },
        { type: 'executive-summary', hasFile: !!doc.file_executive_summary },
        { type: 'approval-sheet', hasFile: !!doc.file_approval_sheet },
    ];
    const hasAnyDoc = availableDocs.some((d) => d.hasFile);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: returnPath as string })}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
                <h1 className="text-xl font-bold text-gray-900">
                    Detail Pengajuan
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-8 gap-6 items-start">
                {/* ── Kolom Kiri: Info + Workflow Timeline ── */}
                <div className="lg:col-span-3 space-y-4">
                    <SubmissionDetailCard doc={doc} />

                    {children && <div className="mt-4">{children}</div>}

                    {/* Log-based Workflow Timeline */}
                    {timeline.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                            <h2 className="text-base font-semibold text-gray-800 border-b pb-2 mb-4">
                                Riwayat Alur
                            </h2>
                            <div className="relative">
                                {timeline.map((entry, idx) => {
                                    const isLast = idx === timeline.length - 1;

                                    // ── Approved Step ──
                                    if (entry.type === 'step') {
                                        return (
                                            <div key={`step-${idx}`} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center shrink-0">
                                                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    {!isLast && (
                                                        <div className="w-0.5 flex-1 my-1 bg-blue-300" style={{ minHeight: '24px' }} />
                                                    )}
                                                </div>
                                                <div className="pb-5 flex-1">
                                                    <div className="text-sm font-semibold text-blue-700">{entry.stepName}</div>
                                                    {entry.user && (
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            Disetujui oleh: {entry.user}{entry.roleName ? ` (${entry.roleName})` : ''}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-blue-500 mt-0.5">
                                                        {formatDate(entry.date)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // ── Returned / Revision ──
                                    if (entry.type === 'returned') {
                                        return (
                                            <div key={`returned-${idx}`} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 rounded-full border-2 border-orange-400 bg-orange-50 flex items-center justify-center shrink-0">
                                                        <RotateCcw className="w-4 h-4 text-orange-500" />
                                                    </div>
                                                    {!isLast && (
                                                        <div className="w-0.5 flex-1 my-1 bg-orange-300" style={{ minHeight: '24px' }} />
                                                    )}
                                                </div>
                                                <div className="pb-5 flex-1">
                                                    <div className="text-sm font-semibold text-orange-700">Dikembalikan untuk Revisi</div>
                                                    {entry.user && (
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            Oleh: {entry.user}{entry.roleName ? ` (${entry.roleName})` : ''}
                                                        </div>
                                                    )}
                                                    {entry.note && (
                                                        <div className="text-xs text-orange-600 mt-1 bg-orange-50 border border-orange-200 rounded px-2 py-1 italic">
                                                            "{entry.note}"
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-400 mt-0.5">
                                                        {formatDate(entry.date)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // ── Submitted / Resubmitted ──
                                    if (entry.type === 'submitted') {
                                        return (
                                            <div key={`submitted-${idx}`} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${entry.isResubmit ? 'border-green-400 bg-green-50' : 'border-gray-400 bg-gray-50'}`}>
                                                        <Send className={`w-4 h-4 ${entry.isResubmit ? 'text-green-500' : 'text-gray-500'}`} />
                                                    </div>
                                                    {!isLast && (
                                                        <div className={`w-0.5 flex-1 my-1 ${entry.isResubmit ? 'bg-green-300' : 'bg-gray-300'}`} style={{ minHeight: '24px' }} />
                                                    )}
                                                </div>
                                                <div className="pb-5 flex-1">
                                                    <div className={`text-sm font-semibold ${entry.isResubmit ? 'text-green-700' : 'text-gray-700'}`}>
                                                        {entry.isResubmit ? 'Diajukan Ulang' : 'Dokumen Diajukan'}
                                                    </div>
                                                    {entry.user && (
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            Oleh: {entry.user}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-400 mt-0.5">
                                                        {formatDate(entry.date)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // ── Active Step ──
                                    if (entry.type === 'active') {
                                        return (
                                            <div key={`active-${idx}`} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 rounded-full border-2 border-blue-400 bg-white flex items-center justify-center shrink-0">
                                                        <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                                                    </div>
                                                    {!isLast && (
                                                        <div className="w-0.5 flex-1 my-1 bg-gray-200" style={{ minHeight: '24px' }} />
                                                    )}
                                                </div>
                                                <div className="pb-5 flex-1">
                                                    <div className="text-sm font-semibold text-gray-900">{entry.stepName}</div>
                                                    {entry.holder && (
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            Menunggu: {entry.holder}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-blue-500 font-medium mt-0.5">Sedang diproses</div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // ── Pending Step ──
                                    if (entry.type === 'pending') {
                                        return (
                                            <div key={`pending-${idx}`} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center shrink-0">
                                                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                                                    </div>
                                                    {!isLast && (
                                                        <div className="w-0.5 flex-1 my-1 bg-gray-200" style={{ minHeight: '24px' }} />
                                                    )}
                                                </div>
                                                <div className="pb-5 flex-1">
                                                    <div className="text-sm font-semibold text-gray-400">{entry.stepName}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5">Menunggu</div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return null;
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Kolom Kanan: Preview Dokumen ── */}
                <div className="lg:col-span-5 bg-white rounded-lg border border-gray-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-800">
                            Preview Dokumen
                        </h2>
                        <Select
                            value={selectedDocType}
                            onValueChange={(val) => setSelectedDocType(val as DocType)}
                        >
                            <SelectTrigger className="w-52">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableDocs.map(({ type, hasFile }) => (
                                    <SelectItem key={type} value={type} disabled={!hasFile}>
                                        {DOC_LABELS[type]}
                                        {!hasFile && ' (belum ada)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {!hasAnyDoc ? (
                        <div className="flex items-center justify-center h-[500px] border rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">
                                Belum ada dokumen yang diunggah
                            </p>
                        </div>
                    ) : pdfLoading ? (
                        <div className="flex items-center justify-center h-[500px] border rounded-lg bg-gray-50">
                            <div className="text-center text-gray-500">
                                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                                <p className="text-sm">Memuat dokumen...</p>
                            </div>
                        </div>
                    ) : pdfUrl ? (
                        <div className="border rounded-lg overflow-hidden">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-[600px]"
                                title={`Preview ${DOC_LABELS[selectedDocType]}`}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[500px] border rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">
                                {DOC_LABELS[selectedDocType]} belum tersedia
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

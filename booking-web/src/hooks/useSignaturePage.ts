import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { documentService } from '@/services/document.service';
import { bookingService } from '@/services/booking.service';
import { signatureService } from '@/services/signature.service';
import type { Signature } from '@/services/signature.service';
import { useBookingContext } from '@/contexts/BookingContext';
import type { BookingContent } from '@/types/document';
import api from '@/lib/axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentType = 'proposal' | 'executive-summary' | 'approval-sheet';

export interface GeneratedUrls {
    executiveSummary?: string;
    approvalSheet?: string;
}

type MessageType = 'error' | 'success' | 'warning';
export interface StatusMessage {
    type: MessageType;
    text: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseAxiosError(err: unknown, fallback: string): string {
    if (err instanceof AxiosError) {
        const msg = err.response?.data?.message || fallback;
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
            const details = Object.entries(validationErrors)
                .map(([field, messages]) => `${field}: ${messages}`)
                .join('; ');
            return `${msg} — ${details}`;
        }
        return msg;
    }
    return fallback;
}

/** Download a file blob via authenticated API and trigger browser download. */
async function downloadAuthenticatedFile(
    apiPath: string,
    filename: string,
): Promise<void> {
    const response = await api.get(apiPath, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSignaturePage() {
    const navigate = useNavigate();
    const { formData, resetFormData } = useBookingContext();

    // Redirect if no document_id
    useEffect(() => {
        if (!formData.document_id) {
            navigate({
                to: '/peminjam/pinjam',
                search: {
                    status: 'ALL',
                },
            });
        }
    }, [formData.document_id, navigate]);

    // --- SIGNATURE via useQuery ---
    const {
        data: signature = null,
        isLoading: loadingSignature,
        refetch: refetchSignature,
    } = useQuery<Signature | null>({
        queryKey: ['user-signature'],
        queryFn: () => signatureService.getSignature(),
        retry: false,
    });

    const handleSignatureUploaded = useCallback(
        (_sig: Signature) => {
            refetchSignature();
        },
        [refetchSignature],
    );

    // --- STATE ---
    const [ttdExecutiveSummary, setTtdExecutiveSummary] = useState(false);
    const [ttdLembarPengesahan, setTtdLembarPengesahan] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [generatingDocs, setGeneratingDocs] = useState(false);
    const [generatedUrls, setGeneratedUrls] = useState<GeneratedUrls>({});
    const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

    // --- PREVIEW ---
    const [selectedDocType, setSelectedDocType] = useState<DocumentType>('proposal');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const prevBlobRef = useRef<string | null>(null);

    // Cleanup old blob URLs when PDF changes
    const setBlobUrl = useCallback((url: string | null) => {
        if (prevBlobRef.current) {
            URL.revokeObjectURL(prevBlobRef.current);
        }
        prevBlobRef.current = url;
        setPdfUrl(url);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
        };
    }, []);

    const loadFilePreview = useCallback(
        async (fileType: DocumentType) => {
            if (!formData.document_id) return;
            try {
                setPdfLoading(true);
                const response = await api.get(
                    `/documents/${formData.document_id}/file/${fileType}/pdf`,
                    { responseType: 'blob' },
                );
                const blob = new Blob([response.data], { type: 'application/pdf' });
                setBlobUrl(URL.createObjectURL(blob));
            } catch (err) {
                setBlobUrl(null);
                if (err instanceof AxiosError && err.response?.status !== 404) {
                    setStatusMessage({
                        type: 'error',
                        text: parseAxiosError(err, 'Gagal memuat preview'),
                    });
                }
            } finally {
                setPdfLoading(false);
            }
        },
        [formData.document_id, setBlobUrl],
    );

    // Load preview when doc type changes
    useEffect(() => {
        if (formData.document_id && selectedDocType) {
            loadFilePreview(selectedDocType);
        }
    }, [formData.document_id, selectedDocType, loadFilePreview]);

    // --- GENERATE DOCUMENTS ---
    const handleGenerateDocuments = useCallback(async () => {
        if (!formData.document_id) {
            setStatusMessage({ type: 'error', text: 'Document ID tidak ditemukan' });
            return;
        }
        if (!signature) {
            setStatusMessage({
                type: 'warning',
                text: 'Tanda tangan belum diupload. Silakan upload tanda tangan terlebih dahulu.',
            });
            return;
        }

        try {
            setGeneratingDocs(true);
            setStatusMessage(null);

            const execSummary = await documentService.generateExecutiveSummary(
                formData.document_id,
            );
            const approvalSheet = await documentService.generateApprovalSheet(
                formData.document_id,
            );

            setGeneratedUrls({
                executiveSummary: execSummary.download_url,
                approvalSheet: approvalSheet.download_url,
            });

            setStatusMessage({
                type: 'success',
                text: 'Dokumen berhasil digenerate! Tanda tangan telah tertanam. Silakan lihat preview dan download.',
            });

            // Refresh preview
            loadFilePreview(selectedDocType);
        } catch (err) {
            setStatusMessage({
                type: 'error',
                text: parseAxiosError(err, 'Gagal generate dokumen'),
            });
        } finally {
            setGeneratingDocs(false);
        }
    }, [formData.document_id, signature, selectedDocType, loadFilePreview]);

    // --- DOWNLOAD ---
    const handleDownload = useCallback(
        async (docType: DocumentType) => {
            if (!formData.document_id) return;
            const docId = formData.document_id;

            try {
                setDownloadingFile(docType);
                setStatusMessage(null);

                if (docType === 'proposal') {
                    await downloadAuthenticatedFile(
                        `/documents/${docId}/file/proposal`,
                        `proposal-${docId}.docx`,
                    );
                } else {
                    // For generated docs, extract API path from full URL
                    const url =
                        docType === 'executive-summary'
                            ? generatedUrls.executiveSummary
                            : generatedUrls.approvalSheet;

                    if (!url) return;

                    let apiPath = url;
                    try {
                        const urlObj = new URL(url);
                        apiPath = urlObj.pathname.replace(/^\/api/, '');
                    } catch {
                        // Already a relative path
                    }

                    const ext = docType === 'executive-summary' ? 'executive-summary' : 'lembar-pengesahan';
                    await downloadAuthenticatedFile(apiPath, `${ext}-${docId}.docx`);
                }
            } catch (err) {
                setStatusMessage({
                    type: 'error',
                    text: parseAxiosError(err, 'Gagal mengunduh file'),
                });
            } finally {
                setDownloadingFile(null);
            }
        },
        [formData.document_id, generatedUrls],
    );

    // --- SUBMIT ---
    const handleSubmit = useCallback(async () => {
        setStatusMessage(null);

        if (!generatedUrls.executiveSummary || !generatedUrls.approvalSheet) {
            setStatusMessage({
                type: 'warning',
                text: 'Dokumen belum digenerate. Pastikan tanda tangan sudah diupload, lalu klik "Generate".',
            });
            return;
        }

        if (!ttdExecutiveSummary || !ttdLembarPengesahan) {
            setStatusMessage({
                type: 'warning',
                text: 'Mohon centang kedua konfirmasi sebelum mengajukan peminjaman.',
            });
            return;
        }

        if (!formData.document_id) return;

        try {
            setIsSubmitting(true);

            // 1. Fetch latest document (fresh status & content)
            const doc = await documentService.getDocument(formData.document_id);
            const content = (doc.content as BookingContent) || {};

            // 2. Build booking data
            const bookingData = {
                document_id: formData.document_id,
                room_id: formData.room_id || content.room_id || 0,
                booking_date: formData.booking_date || content.booking_date || '',
                start_time: formData.start_time || content.start_time || '',
                end_time: formData.end_time || content.end_time || '',
                purpose:
                    formData.purpose ||
                    formData.event_name ||
                    content.purpose ||
                    content.event_name ||
                    'Peminjaman Ruangan',
                special_requirements: (formData.equipment || content.equipment)
                    ? String(formData.equipment || content.equipment)
                    : undefined,
                expected_participants: undefined,
            };

            // 3. Upsert booking
            const existingBooking = await bookingService.getBookingByDocumentId(
                formData.document_id,
            );

            if (existingBooking) {
                await bookingService.updateBooking(existingBooking.id, bookingData);
            } else {
                await bookingService.createBooking(bookingData as Parameters<typeof bookingService.createBooking>[0]);
            }

            // 4. Submit document if DRAFT or REVISION
            if (doc.status === 'DRAFT' || doc.status === 'REVISION') {
                try {
                    await documentService.submitDocument(formData.document_id);
                } catch (submitErr) {
                    // Race condition: already submitted — treat as success
                    const isAlreadySubmitted =
                        submitErr instanceof AxiosError &&
                        submitErr.response?.status === 400 &&
                        submitErr.response?.data?.message?.includes('status IN_PROGRESS');
                    if (!isAlreadySubmitted) throw submitErr;
                }
            }

            // 5. Success
            resetFormData();
            navigate({ to: '/peminjam/pinjam', search: { status: 'ALL' } });
        } catch (err) {
            setStatusMessage({
                type: 'error',
                text: parseAxiosError(err, 'Terjadi kesalahan saat mengajukan peminjaman'),
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [
        formData,
        generatedUrls,
        ttdExecutiveSummary,
        ttdLembarPengesahan,
        resetFormData,
        navigate,
    ]);

    const handleBack = useCallback(() => {
        navigate({ to: '/peminjam/pinjam', search: { status: 'ALL' } });
    }, [navigate]);

    return {
        // Signature
        signature,
        loadingSignature,
        handleSignatureUploaded,

        // Checkboxes
        ttdExecutiveSummary,
        setTtdExecutiveSummary,
        ttdLembarPengesahan,
        setTtdLembarPengesahan,

        // Generate
        generatingDocs,
        generatedUrls,
        handleGenerateDocuments,

        // Preview
        selectedDocType,
        setSelectedDocType,
        pdfUrl,
        pdfLoading,

        // Download
        downloadingFile,
        handleDownload,

        // Submit
        isSubmitting,
        handleSubmit,
        handleBack,

        // Status
        statusMessage,
        setStatusMessage,
        hasDocumentId: !!formData.document_id,
        documentId: formData.document_id,
    };
}

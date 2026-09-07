import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InfoIcon, AlertCircleIcon, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { signatureService } from '@/services/signature.service';
import { documentService, type Document } from '@/services/document.service';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import { SignatureUpload } from '@/components/common/SignatureUpload';
import { RevisionDialog } from '@/components/common/RevisionDialog';
import { SubmissionDetailCard } from '@/components/common/SubmissionDetailCard';

type DocumentType = 'proposal' | 'approval-sheet' | 'executive-summary';

interface SignDocumentContentProps {
  documentId: number | undefined;
  returnPath: string;
}

export function SignDocumentContent({
  documentId,
  returnPath,
}: SignDocumentContentProps) {
  const navigate = useNavigate();

  const [signature, setSignature] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] =
    useState<DocumentType>('proposal');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviseDialogOpen, setReviseDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    action: () => void;
    actionLabel: string;
  } | null>(null);

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    name: string;
    role?: { slug: string };
  } | null>(null);

  const [signedDocTypes, setSignedDocTypes] = useState<Set<DocumentType>>(
    new Set(),
  );

  const isWadek1 = currentUser?.role?.slug === 'wadek1';
  const userRole = currentUser?.role?.slug ?? '';
  const rolesWithoutSignature = ['sumber-daya', 'kemahasiswaan'];
  const isSignatureRequiredForRole = !rolesWithoutSignature.includes(userRole);

  const needsSignatureCurrentDoc = useMemo(() => {
    if (!isSignatureRequiredForRole) return false;
    if (isWadek1) {
      return selectedDocType === 'approval-sheet' || selectedDocType === 'executive-summary';
    }
    return selectedDocType === 'approval-sheet';
  }, [userRole, isWadek1, isSignatureRequiredForRole, selectedDocType]);

  const isAllSigned = useMemo(() => {
    if (!isSignatureRequiredForRole) return true;
    if (!isWadek1) return signedDocTypes.has('approval-sheet');
    return (
      signedDocTypes.has('approval-sheet') &&
      signedDocTypes.has('executive-summary')
    );
  }, [isWadek1, signedDocTypes, isSignatureRequiredForRole]);

  // Global loading lock to prevent any concurrent operations
  const globalLockRef = useRef({
    signature: false,
    document: false,
    pdf: false,
  });

  // Loading states for individual operations
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Cache flags to prevent redundant calls - using refs for performance
  const signatureLoadedRef = useRef(false);
  const documentLoadedRef = useRef(false);
  const pdfCacheRef = useRef<Map<string, string>>(new Map()); // Use string key for better cache
  const currentDocumentIdRef = useRef<number | undefined>(documentId);
  const currentDocTypeRef = useRef<DocumentType>(selectedDocType);

  // Refs to track blob URLs for cleanup
  const pdfUrlRef = useRef<string | null>(null);
  const signatureUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce timeouts
  const timeoutsRef = useRef<{
    signature?: number;
    document?: number;
    pdf?: number;
  }>({});

  // Memoized stable functions to prevent useEffect re-triggers
  const loadDocument = useMemo(() => {
    let timeoutId: number;

    return () => {
      if (
        !documentId ||
        globalLockRef.current.document ||
        documentLoadedRef.current
      ) {
        return;
      }

      // Clear any pending timeout
      if (timeoutsRef.current.document) {
        clearTimeout(timeoutsRef.current.document);
      }

      // Debounce to prevent rapid calls
      timeoutId = setTimeout(async () => {
        if (globalLockRef.current.document || documentLoadedRef.current) {
          return;
        }

        try {
          globalLockRef.current.document = true;
          const doc = await documentService.getDocument(documentId);
          setDocument(doc);
          documentLoadedRef.current = true;
        } catch (err) {
          console.error('Failed to load document:', err);
        } finally {
          globalLockRef.current.document = false;
        }
      }, 50);

      timeoutsRef.current.document = timeoutId;
    };
  }, [documentId]);

  const loadCurrentUser = useMemo(() => {
    return async () => {
      try {
        const response = await api.get('/user');
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Failed to load current user:', err);
      }
    };
  }, []);

  const loadSignature = useMemo(() => {
    let timeoutId: number;

    return () => {
      if (globalLockRef.current.signature || signatureLoadedRef.current) {
        return;
      }

      // Clear any pending timeout
      if (timeoutsRef.current.signature) {
        clearTimeout(timeoutsRef.current.signature);
      }

      // Debounce to prevent rapid calls
      timeoutId = setTimeout(async () => {
        if (globalLockRef.current.signature || signatureLoadedRef.current) {
          return;
        }

        try {
          globalLockRef.current.signature = true;
          setSignatureLoading(true);

          const sig = await signatureService.getSignature();
          if (sig) {
            // Get the signature file URL from backend with signature ID
            const url = await signatureService.getSignatureFileUrl(sig.id);

            // Revoke old blob URL before setting new one
            if (
              signatureUrlRef.current &&
              signatureUrlRef.current.startsWith('blob:')
            ) {
              try {
                window.URL.revokeObjectURL(signatureUrlRef.current);
              } catch {
                // Ignore errors
              }
            }

            signatureUrlRef.current = url;
            setSignature(url);
          }
          signatureLoadedRef.current = true;
        } catch {
          signatureLoadedRef.current = true; // Mark as loaded even on error to prevent retry
        } finally {
          globalLockRef.current.signature = false;
          setSignatureLoading(false);
        }
      }, 50);

      timeoutsRef.current.signature = timeoutId;
    };
  }, []);

  const loadDocumentPreview = useMemo(() => {
    let timeoutId: number;

    return (docType: DocumentType) => {
      if (!documentId || globalLockRef.current.pdf) {
        return;
      }

      // Check if we have cached PDF for this type
      const cacheKey = `${documentId}-${docType}`;
      const cachedUrl = pdfCacheRef.current.get(cacheKey);
      if (cachedUrl) {
        setPdfUrl(cachedUrl);
        return;
      }

      // Clear any pending timeout
      if (timeoutsRef.current.pdf) {
        clearTimeout(timeoutsRef.current.pdf);
      }

      // Debounce to prevent rapid calls
      timeoutId = setTimeout(async () => {
        if (globalLockRef.current.pdf) {
          return;
        }

        // Double-check cache after timeout
        const cachedUrl = pdfCacheRef.current.get(cacheKey);
        if (cachedUrl) {
          setPdfUrl(cachedUrl);
          return;
        }

        try {
          globalLockRef.current.pdf = true;
          setPdfLoading(true);

          // Cancel any previous request
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }

          // Create new abort controller for this request
          abortControllerRef.current = new AbortController();

          // We no longer revoke the previously displayed URL here because it might still
          // be needed by the cache if the user switches back to that document type.

          const response = await api.get(
            `/documents/${documentId}/file/${docType}/pdf`,
            {
              responseType: 'blob',
              signal: abortControllerRef.current.signal,
            },
          );

          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);

          pdfUrlRef.current = url;
          setPdfUrl(url);

          // Cache the URL with composite key
          pdfCacheRef.current.set(cacheKey, url);
        } catch (err: any) {
          if (err.name === 'AbortError' || err.name === 'CanceledError') {
            return;
          }

          console.error('Failed to load document preview:', err);
          const error = err as AxiosError<{ message?: string }>;
          if (error.response?.status === 404) {
            pdfUrlRef.current = null;
            setPdfUrl(null);
            alert(`Dokumen ${docType} belum tersedia`);
          } else {
            alert('Gagal memuat preview dokumen');
          }
        } finally {
          globalLockRef.current.pdf = false;
          setPdfLoading(false);
          abortControllerRef.current = null;
        }
      }, 50);

      timeoutsRef.current.pdf = timeoutId;
    };
  }, [documentId]);

  // Single initialization effect - runs once on mount
  useEffect(() => {
    let mounted = true;

    const initialize = () => {
      if (!mounted) return;

      // Load current user
      loadCurrentUser();

      // Load signature once on mount
      if (!signatureLoadedRef.current) {
        loadSignature();
      }

      // Load document if documentId exists
      if (documentId && !documentLoadedRef.current) {
        loadDocument();
      }

      // Load PDF if both documentId and selectedDocType exist
      if (documentId && selectedDocType) {
        loadDocumentPreview(selectedDocType);
      }
    };

    // Run initialization after a small delay to prevent race conditions
    const initTimeout = setTimeout(initialize, 100);

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
    };
  }, []); // Empty dependencies - runs only once on mount

  // Handle documentId changes
  useEffect(() => {
    if (currentDocumentIdRef.current !== documentId) {
      // Reset cache when document changes
      documentLoadedRef.current = false;
      pdfCacheRef.current.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          try {
            window.URL.revokeObjectURL(url);
          } catch {
            // Ignore error
          }
        }
      });
      pdfCacheRef.current.clear();
      currentDocumentIdRef.current = documentId;

      if (documentId && !globalLockRef.current.document) {
        loadDocument();
      }
    }
  }, [documentId, loadDocument]);

  // Restore signed documents state from local storage so it persists across refreshes
  useEffect(() => {
    if (documentId && currentUser?.id) {
      const storedKeys = localStorage.getItem(`signed-${currentUser.id}-${documentId}`);
      if (storedKeys) {
        try {
          const parsed = JSON.parse(storedKeys);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSignedDocTypes(new Set(parsed as DocumentType[]));
          }
        } catch (e) { }
      }
    }
  }, [documentId, currentUser?.id]);

  // Handle document type changes
  useEffect(() => {
    if (currentDocTypeRef.current !== selectedDocType) {
      currentDocTypeRef.current = selectedDocType;

      if (documentId && selectedDocType && !globalLockRef.current.pdf) {
        loadDocumentPreview(selectedDocType);
      }
    }
  }, [selectedDocType, documentId, loadDocumentPreview]);

  const showConfirmation = (
    title: string,
    message: string,
    action: () => void,
    actionLabel: string = 'Ya, Lanjutkan',
  ) => {
    setConfirmAction({ title, message, action, actionLabel });
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction.action();
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  const handleEmbedSignature = async () => {
    if (!signature) {
      alert('Silakan upload atau gambar tanda tangan terlebih dahulu');
      return;
    }

    if (!documentId) {
      alert('Document ID tidak ditemukan');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/documents/${documentId}/apply-signature`, {
        type: selectedDocType,
      });
      setSignedDocTypes((prev) => {
        const newSet = new Set(prev).add(selectedDocType);
        if (currentUser?.id) {
          localStorage.setItem(`signed-${currentUser.id}-${documentId}`, JSON.stringify(Array.from(newSet)));
        }
        return newSet;
      });
      // Reload the document preview to show updated signature
      const cacheKey = `${documentId}-${selectedDocType}`;
      const oldUrl = pdfCacheRef.current.get(cacheKey);
      if (oldUrl && oldUrl.startsWith('blob:')) {
        try {
          window.URL.revokeObjectURL(oldUrl);
        } catch {
          // Ignore error
        }
      }
      pdfCacheRef.current.delete(cacheKey);
      loadDocumentPreview(selectedDocType);
    } catch (err) {
      console.error('Failed to embed signature:', err);
      const error = err as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message || 'Gagal membubuhkan tanda tangan');
    } finally {
      setLoading(false);
    }
  };

  const confirmEmbedSignature = () => {
    showConfirmation(
      'Konfirmasi Bubuhkan Tanda Tangan',
      'Apakah Anda yakin ingin membubuhkan tanda tangan pada dokumen ini? Tanda tangan akan diterapkan pada dokumen yang sedang dipilih.',
      handleEmbedSignature,
      'Bubuhkan',
    );
  };

  const confirmApproveDocument = () => {
    if (isWadek1) {
      const missing = [];
      if (!signedDocTypes.has('approval-sheet'))
        missing.push('Lembar Pengesahan');
      if (!signedDocTypes.has('executive-summary'))
        missing.push('Executive Summary');

      if (missing.length > 0) {
        showConfirmation(
          'Tanda Tangan Belum Lengkap',
          `Sebagai Wadek 1, Anda wajib menandatangani ${missing.join(' dan ')} sebelum menyetujui dokumen. Silakan pilih dokumen tersebut pada dropdown dan klik "Bubuhkan tanda tangan".`,
          () => { },
          'Mengerti',
        );
        return;
      }
    } else if (isSignatureRequiredForRole && !signedDocTypes.has('approval-sheet')) {
      // Validate signature for roles that require it
      showConfirmation(
        'Tanda Tangan Belum Dibubuhkan',
        'Silakan klik button "Bubuhkan tanda tangan" terlebih dahulu untuk melihat pratinjau tanda tangan Anda pada dokumen sebelum menyetujuinya.',
        () => { }, // Just to close the dialog
        'Mengerti',
      );
      return;
    }

    showConfirmation(
      'Konfirmasi Persetujuan Dokumen',
      'Apakah Anda yakin ingin menyetujui dokumen ini? Dokumen yang disetujui tidak dapat diubah lagi dan akan melanjutkan ke tahap berikutnya.',
      handleApproveDocument,
      'Ya, Setujui',
    );
  };

  const handleApproveDocument = async () => {
    if (isSignatureRequiredForRole && !signature) {
      alert('Silakan upload atau gambar tanda tangan terlebih dahulu');
      return;
    }

    if (!documentId) {
      alert('Document ID tidak ditemukan');
      return;
    }

    try {
      setLoading(true);
      // Call approve API which will auto-apply signature
      await documentService.approveDocument(
        documentId,
        '',
        'Approved with signature',
      );

      if (currentUser?.id) {
        localStorage.removeItem(`signed-${currentUser.id}-${documentId}`);
      }

      if (returnPath) {
        navigate({ to: returnPath });
      } else {
        navigate({ to: '/' });
      }
    } catch (err) {
      console.error('Failed to approve document:', err);
      const error = err as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message || 'Gagal menyetujui dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handleReviseDocument = () => {
    setReviseDialogOpen(true);
  };

  const handleRejectDocument = () => {
    setRejectDialogOpen(true);
  };

  const onConfirmReject = async (note: string) => {
    if (!documentId) {
      alert('Document ID tidak ditemukan');
      return;
    }

    try {
      setLoading(true);
      await documentService.rejectDocument(documentId, note);

      setRejectDialogOpen(false);

      if (returnPath) {
        navigate({ to: returnPath });
      } else {
        navigate({ to: '/' });
      }
    } catch (err) {
      console.error('Failed to reject document:', err);
      const error = err as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message || 'Gagal menolak dokumen');
    } finally {
      setLoading(false);
    }
  };

  const onConfirmRevise = async (note: string) => {
    if (!documentId || !document) {
      alert('Document ID tidak ditemukan');
      return;
    }

    try {
      setLoading(true);
      await documentService.reviseDocument(
        documentId,
        document.creator_id,
        note,
      );

      setReviseDialogOpen(false);

      if (returnPath) {
        navigate({ to: returnPath });
      } else {
        navigate({ to: '/' });
      }
    } catch (err) {
      console.error('Failed to revise document:', err);
      const error = err as AxiosError<{ message?: string }>;
      alert(
        error.response?.data?.message ||
        'Gagal mengembalikan dokumen untuk revisi',
      );
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      Object.values(timeoutsRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Cleanup using refs to get latest values
      if (pdfUrlRef.current) {
        try {
          window.URL.revokeObjectURL(pdfUrlRef.current);
        } catch {
          // Ignore cleanup errors
        }
      }

      // Cleanup cached PDFs
      pdfCacheRef.current.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          try {
            window.URL.revokeObjectURL(url);
          } catch {
            // Ignore cleanup errors
          }
        }
      });
      pdfCacheRef.current.clear();

      if (
        signatureUrlRef.current &&
        signatureUrlRef.current.startsWith('blob:')
      ) {
        try {
          window.URL.revokeObjectURL(signatureUrlRef.current);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []); // Empty dependency array - cleanup runs only on unmount

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>
          Review & Persetujuan
        </h1>
        <p className='text-gray-600 mt-1'>
          Silakan periksa detail pengajuan dan pratinjau dokumen sebelum memberikan persetujuan atau catatan revisi.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-8 gap-6 items-start'>
        {/* Card Kiri: Detail Pengajuan & Tanda Tangan */}
        <div className='lg:col-span-3 self-start fix md:sticky top-24 z-10 space-y-6'>
          {document && (
            <SubmissionDetailCard doc={document} />
          )}

          {isSignatureRequiredForRole && (
            <SignatureUpload
              onSignatureUploaded={() => {
                signatureLoadedRef.current = false;
                loadSignature();
              }}
            />
          )}
        </div>

        {/* Container Kanan */}
        <div className='lg:col-span-5 relative z-0 space-y-4'>

          {/* Info Alert untuk dokumen yang harus ditandatangani */}
          {isSignatureRequiredForRole && !isAllSigned && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3'>
              <InfoIcon className='w-5 h-5 text-blue-600 shrink-0 mt-0.5' />
              <div>
                <h5 className='font-semibold text-blue-800 text-sm mb-1'>
                  Informasi Tanda Tangan
                </h5>
                <div className='text-sm text-blue-700'>
                  {isWadek1
                    ? 'Sebagai Wadek 1, Anda diwajibkan untuk menandatangani Lembar Pengesahan dan Executive Summary sebelum dapat menyetujui dokumen ini.'
                    : 'Anda diwajibkan untuk membubuhkan tanda tangan pada Lembar Pengesahan sebelum dapat menyetujui dokumen ini.'}
                  <br />
                  <span className='font-medium'>Silakan pilih dokumen pada dropdown di bawah dan klik "Bubuhkan tanda tangan".</span>
                </div>
              </div>
            </div>
          )}

          {isSignatureRequiredForRole && isAllSigned && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3'>
              <InfoIcon className='w-5 h-5 text-green-600 shrink-0 mt-0.5' />
              <div>
                <h5 className='font-semibold text-green-800 text-sm mb-1'>
                  Tanda Tangan Lengkap
                </h5>
                <div className='text-sm text-green-700'>
                  Semua dokumen yang memerlukan tanda tangan Anda telah ditandatangani. Anda dapat melanjutkan untuk menyetujui dokumen.
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Preview Dokumen</CardTitle>
                <Select
                  value={selectedDocType}
                  onValueChange={(val) => setSelectedDocType(val as DocumentType)}
                >
                  <SelectTrigger className='w-50'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='proposal'>Proposal</SelectItem>
                    <SelectItem value='approval-sheet'>
                      Lembar Pengesahan
                      {signedDocTypes.has('approval-sheet') && ' (Signed)'}
                    </SelectItem>
                    <SelectItem value='executive-summary'>
                      Executive Summary
                      {signedDocTypes.has('executive-summary') && ' (Signed)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Preview PDF */}
              {pdfLoading && (
                <div className='flex items-center justify-center h-150 border rounded-lg bg-gray-50'>
                  <p className='text-gray-500'>Memuat dokumen...</p>
                </div>
              )}
              {!pdfLoading && pdfUrl && (
                <div className='border rounded-lg overflow-hidden'>
                  <iframe
                    src={pdfUrl}
                    className='w-full h-150'
                    title='Document Preview'
                  />
                </div>
              )}
              {!pdfLoading && !pdfUrl && (
                <div className='flex items-center justify-center h-150 border rounded-lg bg-gray-50'>
                  <p className='text-gray-500'>Dokumen tidak tersedia</p>
                </div>
              )}

              {/* Signature Button only shown when the current doc type needs a signature from the current user role */}
              {needsSignatureCurrentDoc && signature && pdfUrl && !signedDocTypes.has(selectedDocType) && (
                <div className='w-full mt-4'>
                  <Button
                    onClick={confirmEmbedSignature}
                    disabled={loading || pdfLoading}
                    variant='outline'
                    className='w-full'
                  >
                    {loading ? 'Memproses...' : 'Bubuhkan tanda tangan'}
                  </Button>
                </div>
              )}
              {needsSignatureCurrentDoc && signature && pdfUrl && signedDocTypes.has(selectedDocType) && (
                <div className='w-full mt-4 flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 text-sm font-medium border border-green-200 rounded-lg'>
                  <CheckCircle className='w-5 h-5' />
                  Dokumen ini telah ditandatangani
                </div>
              )}
              {needsSignatureCurrentDoc && !signature && !signatureLoading && !signedDocTypes.has(selectedDocType) && (
                <div className='text-center text-sm text-gray-500 p-4 bg-yellow-50 rounded-lg mt-4'>
                  Silakan upload atau gambar tanda tangan terlebih dahulu
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons Pindah Ke Card Tersendiri (Bawah) */}
          <Card className='mt-6'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>Tindakan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex gap-4 flex-wrap'>
                <Button
                  onClick={handleRejectDocument}
                  disabled={loading || pdfLoading}
                  variant='outline'
                  className='flex-1 h-12 text-base border-destructive text-destructive hover:bg-destructive/10'
                >
                  {loading ? 'Memproses...' : 'Tolak Dokumen'}
                </Button>
                <Button
                  onClick={handleReviseDocument}
                  disabled={loading || pdfLoading}
                  variant='destructive'
                  className='flex-1 h-12 text-base'
                >
                  {loading ? 'Memproses...' : 'Kirim Revisi'}
                </Button>
                <Button
                  onClick={confirmApproveDocument}
                  disabled={loading || pdfLoading}
                  className={`flex-1 h-12 text-base ${isWadek1 && !isAllSigned
                    ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50'
                    : ''
                    }`}
                >
                  {loading ? 'Memproses...' : 'Setujui Dokumen'}
                </Button>
              </div>
              {isWadek1 && !isAllSigned && (
                <p className='text-xs text-center text-gray-500 mt-3 flex items-center justify-center gap-1'>
                  <AlertCircleIcon className='w-3 h-3' />
                  Setujui Dinonaktifkan: Harap tandatangani semua dokumen yang diperlukan terlebih dahulu.
                </p>
              )}
              {!isWadek1 && isSignatureRequiredForRole && !isAllSigned && (
                <p className='text-xs text-center text-gray-500 mt-3 flex items-center justify-center gap-1'>
                  <AlertCircleIcon className='w-3 h-3' />
                  Setujui memerlukan tanda tangan terlebih dahulu.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className='mt-6 flex justify-end'>
        <Button
          onClick={() => {
            if (returnPath) {
              navigate({ to: returnPath });
            } else {
              navigate({ to: '/' });
            }
          }}
          variant='outline'
        >
          Kembali
        </Button>
      </div>

      {/* Dialog Konfirmasi */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className='sm:max-w-125'>
          <DialogHeader>
            <DialogTitle>{confirmAction?.title}</DialogTitle>
            <DialogDescription>{confirmAction?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setConfirmDialogOpen(false);
                setConfirmAction(null);
              }}
              disabled={loading}
            >
              Batal
            </Button>
            <Button onClick={handleConfirmAction} disabled={loading}>
              {loading ? 'Memproses...' : confirmAction?.actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog untuk Catatan Revisi */}
      <RevisionDialog
        isOpen={reviseDialogOpen}
        onClose={() => setReviseDialogOpen(false)}
        onConfirm={onConfirmRevise}
        variant='destructive'
      />

      {/* Dialog untuk Alasan Penolakan */}
      <RevisionDialog
        isOpen={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={onConfirmReject}
        loading={loading}
        title='Tolak Dokumen'
        description='Dokumen yang ditolak akan dihentikan secara final dan tidak dapat dilanjutkan lagi. Booking ruangan terkait (jika ada) juga akan ikut ditolak.'
        placeholder='Jelaskan alasan penolakan (minimal 10 karakter)...'
        confirmLabel='Ya, Tolak Dokumen'
        variant='destructive'
      />
    </div>
  );
}

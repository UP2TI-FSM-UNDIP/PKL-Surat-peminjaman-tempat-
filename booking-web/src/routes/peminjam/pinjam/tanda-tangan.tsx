import { createFileRoute } from '@tanstack/react-router';
import { Stepper } from '@/components/common/Stepper';
import { Button } from '@/components/ui/button/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, RefreshCw, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { SignatureUpload } from '@/components/common/SignatureUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSignaturePage,
  type DocumentType,
} from '@/hooks/useSignaturePage';

export const Route = createFileRoute('/peminjam/pinjam/tanda-tangan')({
  component: RouteComponent,
});

const STEPS = [
  { number: 1, title: 'Detail Tempat' },
  { number: 2, title: 'Proposal' },
  { number: 3, title: 'Tanda Tangan' },
];

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  proposal: 'Proposal',
  'executive-summary': 'Executive Summary',
  'approval-sheet': 'Lembar Pengesahan',
};

function RouteComponent() {
  const sp = useSignaturePage();

  const statusIcon = {
    error: <AlertCircle className='w-4 h-4 shrink-0' />,
    warning: <AlertTriangle className='w-4 h-4 shrink-0' />,
    success: <CheckCircle className='w-4 h-4 shrink-0' />,
  };

  const statusColors = {
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className='space-y-3'>
      <Stepper steps={STEPS} currentStep={3} />

      <div className='max-w-4xl mx-auto'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-6'>
            Tanda Tangan
          </h2>

          <div className='space-y-6'>
            {/* Status Message Banner */}
            {sp.statusMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-md text-sm border ${statusColors[sp.statusMessage.type]}`}
              >
                {statusIcon[sp.statusMessage.type]}
                <span className='flex-1'>{sp.statusMessage.text}</span>
                <button
                  type='button'
                  onClick={() => sp.setStatusMessage(null)}
                  className='opacity-60 hover:opacity-100 font-bold'
                >
                  ×
                </button>
              </div>
            )}

            {/* Signature Upload Component */}
            <SignatureUpload
              onSignatureUploaded={sp.handleSignatureUploaded}
              className='border border-gray-200 rounded-lg'
            />

            {/* Generate Documents */}
            <div className='border border-gray-200 rounded-lg p-4'>
              <div className='flex items-center justify-between gap-4'>
                <div className='flex-1'>
                  <h3 className='text-sm font-medium text-gray-900'>
                    Generate Dokumen
                  </h3>
                  <p className='text-xs text-gray-600 mt-1'>
                    Generate Executive Summary dan Lembar Pengesahan dengan
                    tanda tangan
                  </p>
                </div>
                <Button
                  type='button'
                  onClick={sp.handleGenerateDocuments}
                  disabled={
                    sp.generatingDocs ||
                    !sp.hasDocumentId ||
                    sp.loadingSignature ||
                    !sp.signature
                  }
                  className='bg-green-600 hover:bg-green-700 disabled:opacity-50'
                >
                  {sp.generatingDocs ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>

            {/* Preview Dokumen */}
            <div className='border border-gray-200 rounded-lg p-4'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-sm font-medium text-gray-900'>
                  Preview Dokumen
                </h3>
                <Select
                  value={sp.selectedDocType}
                  onValueChange={(val) =>
                    sp.setSelectedDocType(val as DocumentType)
                  }
                >
                  <SelectTrigger className='w-50'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='proposal'>Proposal</SelectItem>
                    <SelectItem value='executive-summary'>
                      Executive Summary
                    </SelectItem>
                    <SelectItem value='approval-sheet'>
                      Lembar Pengesahan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* PDF Preview */}
              {sp.pdfLoading && (
                <div className='flex items-center justify-center h-150 border rounded-lg bg-gray-50'>
                  <div className='text-center text-gray-500'>
                    <RefreshCw className='h-8 w-8 mx-auto mb-2 animate-spin' />
                    <p className='text-sm'>Memuat dokumen...</p>
                  </div>
                </div>
              )}
              {!sp.pdfLoading && sp.pdfUrl && (
                <div className='border rounded-lg overflow-hidden'>
                  <iframe
                    src={sp.pdfUrl}
                    className='w-full h-150'
                    title='Document Preview'
                  />
                </div>
              )}
              {!sp.pdfLoading && !sp.pdfUrl && (
                <div className='flex items-center justify-center h-150 border rounded-lg bg-gray-50'>
                  <p className='text-sm text-gray-500'>
                    {sp.selectedDocType === 'proposal'
                      ? 'Proposal tidak tersedia'
                      : 'Dokumen belum digenerate'}
                  </p>
                </div>
              )}

              {/* Download Button */}
              {sp.pdfUrl && (
                <div className='mt-4'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => sp.handleDownload(sp.selectedDocType)}
                    disabled={
                      sp.downloadingFile !== null ||
                      (sp.selectedDocType !== 'proposal' &&
                        !sp.generatedUrls[
                        sp.selectedDocType === 'executive-summary'
                          ? 'executiveSummary'
                          : 'approvalSheet'
                        ])
                    }
                    className='w-full'
                  >
                    <Download className='h-4 w-4 mr-2' />
                    {sp.downloadingFile !== null
                      ? 'Downloading...'
                      : `Download ${DOC_TYPE_LABELS[sp.selectedDocType]}`}
                  </Button>
                </div>
              )}
            </div>

            {/* Konfirmasi Dokumen */}
            <div className='border border-gray-200 rounded-lg p-4'>
              <h3 className='text-sm font-medium text-gray-900 mb-3'>
                Konfirmasi Dokumen
              </h3>
              <div className='space-y-2'>
                <div className='flex items-center space-x-3'>
                  <Checkbox
                    id='ttd-lembar-pengesahan'
                    checked={sp.ttdLembarPengesahan}
                    onCheckedChange={(checked) =>
                      sp.setTtdLembarPengesahan(checked as boolean)
                    }
                    disabled={!sp.generatedUrls.approvalSheet}
                  />
                  <label
                    htmlFor='ttd-lembar-pengesahan'
                    className={`text-sm cursor-pointer ${!sp.generatedUrls.approvalSheet ? 'text-gray-400' : ''}`}
                  >
                    Lembar Pengesahan sudah digenerate
                  </label>
                </div>
                <div className='flex items-center space-x-3'>
                  <Checkbox
                    id='ttd-executive-summary'
                    checked={sp.ttdExecutiveSummary}
                    onCheckedChange={(checked) =>
                      sp.setTtdExecutiveSummary(checked as boolean)
                    }
                    disabled={!sp.generatedUrls.executiveSummary}
                  />
                  <label
                    htmlFor='ttd-executive-summary'
                    className={`text-sm cursor-pointer ${!sp.generatedUrls.executiveSummary ? 'text-gray-400' : ''}`}
                  >
                    Executive Summary sudah digenerate
                  </label>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className='flex justify-between gap-4 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={sp.handleBack}
                disabled={sp.isSubmitting}
              >
                Kembali
              </Button>
              <Button
                type='button'
                onClick={sp.handleSubmit}
                disabled={
                  !(sp.ttdExecutiveSummary && sp.ttdLembarPengesahan) ||
                  sp.isSubmitting
                }
              >
                {sp.isSubmitting ? 'Mengajukan...' : 'Ajukan Peminjaman'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

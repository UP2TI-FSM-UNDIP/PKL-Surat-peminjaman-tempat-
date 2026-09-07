import { createFileRoute } from '@tanstack/react-router';
import { Stepper } from '@/components/common/Stepper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button/button';
import { AlertCircle } from 'lucide-react';
import { useProposalForm, type ProposalFields } from '@/hooks/useProposalForm';

export const Route = createFileRoute('/peminjam/pinjam/proposal')({
  component: RouteComponent,
});

// ---------------------------------------------------------------------------
// Field config — drives the form inputs, avoids repetitive JSX
// ---------------------------------------------------------------------------

interface FieldConfig {
  key: keyof ProposalFields;
  label: string;
  placeholder: string;
}

const FIELDS: FieldConfig[] = [
  { key: 'event_name', label: 'Nama Kegiatan', placeholder: 'Masukkan nama kegiatan' },
  { key: 'event_nature', label: 'Sifat', placeholder: 'Masukkan sifat kegiatan (contoh: Internal, Eksternal)' },
  { key: 'event_form', label: 'Bentuk', placeholder: 'Masukkan bentuk kegiatan (contoh: Seminar, Workshop)' },
  { key: 'objectives', label: 'Tujuan', placeholder: 'Masukkan tujuan kegiatan' },
  { key: 'benefits', label: 'Manfaat', placeholder: 'Masukkan manfaat kegiatan' },
  { key: 'target_audience', label: 'Sasaran', placeholder: 'Masukkan sasaran kegiatan (contoh: Mahasiswa Informatika)' },
  { key: 'location', label: 'Tempat', placeholder: 'Masukkan tempat pelaksanaan' },
  { key: 'equipment', label: 'Alat Yang Dibutuhkan', placeholder: 'Masukkan alat yang dibutuhkan' },
  { key: 'invitations', label: 'Undangan', placeholder: 'Masukkan daftar undangan' },
];

const STEPS = [
  { number: 1, title: 'Detail Tempat' },
  { number: 2, title: 'Proposal' },
  { number: 3, title: 'Tanda Tangan' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function RouteComponent() {
  const {
    fields,
    handleFieldChange,
    proposalFile,
    handleFileChange,
    fileError,
    existingFileProposal,
    isSubmitting,
    isAutoSaving,
    error,
    setError,
    handleSubmit,
    handleBack,
  } = useProposalForm();

  return (
    <div className='space-y-3'>
      <Stepper steps={STEPS} currentStep={2} />

      <div className='max-w-4xl mx-auto'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-semibold text-gray-900'>Proposal</h2>
            {isAutoSaving && (
              <span className='text-sm text-gray-500'>Menyimpan...</span>
            )}
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Error Banner */}
            {error && (
              <div className='flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200'>
                <AlertCircle className='w-4 h-4 shrink-0' />
                <span className='flex-1'>{error}</span>
                <button
                  type='button'
                  onClick={() => setError(null)}
                  className='text-red-400 hover:text-red-600 font-bold'
                >
                  x
                </button>
              </div>
            )}

            {/* Dynamic Form Fields */}
            <div className='space-y-4'>
              {FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {label} <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    value={fields[key]}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    placeholder={placeholder}
                    required
                  />
                </div>
              ))}
            </div>

            {/* Upload Proposal */}
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700'>
                Unggah Proposal{' '}
                <span className='text-red-500'>{existingFileProposal ? '' : '*'}</span>
              </label>

              {/* Existing file saved on server */}
              {existingFileProposal && !proposalFile && (
                <div className='flex items-center gap-2 p-2 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-sm'>
                  <span>📎</span>
                  <span>
                    File proposal sudah tersimpan. Upload file baru hanya jika ingin menggantikan.
                  </span>
                </div>
              )}

              <Input
                type='file'
                accept='.pdf'
                onChange={handleFileChange}
              />
              <p className='text-xs text-gray-500'>Format: PDF (Max 20MB)</p>

              {fileError && (
                <p className='text-sm text-red-600'>{fileError}</p>
              )}
              {proposalFile && (
                <p className='text-sm text-green-600'>
                  ✓ File terpilih: {proposalFile.name} (
                  {(proposalFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className='flex justify-between gap-3 pt-4'>
              <Button type='button' variant='outline' onClick={handleBack}>
                Kembali
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Selanjutnya'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

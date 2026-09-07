import { createFileRoute } from '@tanstack/react-router';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useTemplateManagement,
  TemplateTable,
  TemplateUploadModal,
  TemplateEditModal,
  TemplatePreview,
} from '@/features/templates';

export const Route = createFileRoute('/kemahasiswaan/template-dokumen/')({
  component: RouteComponent,
});

function RouteComponent() {
  const tm = useTemplateManagement();

  // ---- Loading ----
  if (tm.isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <p className='text-gray-500'>Memuat template...</p>
      </div>
    );
  }

  // ---- Error ----
  if (tm.isError) {
    return (
      <div className='flex flex-col items-center justify-center h-64 text-center'>
        <AlertCircle className='w-12 h-12 text-red-400 mb-4' />
        <h3 className='text-lg font-semibold text-gray-700 mb-2'>
          Gagal Memuat Template
        </h3>
        <p className='text-sm text-gray-500 mb-4'>
          Terjadi kesalahan saat memuat data template. Silakan coba lagi.
        </p>
        <Button onClick={() => tm.refetch()} variant='outline'>
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Template Dokumen</h1>
        <p className='text-gray-600 mt-1'>
          Kelola template Executive Summary dan Lembar Pengesahan
        </p>
      </div>

      {/* Action Error Banner */}
      {tm.actionError && (
        <div className='mb-4 flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200'>
          <AlertCircle className='w-4 h-4 shrink-0' />
          <span className='flex-1'>{tm.actionError}</span>
          <button
            onClick={() => tm.setActionError(null)}
            className='text-red-400 hover:text-red-600 font-bold'
          >
            ×
          </button>
        </div>
      )}

      {/* Table + Filters */}
      <TemplateTable
        templates={tm.filteredTemplates}
        typeFilter={tm.typeFilter}
        onTypeFilterChange={tm.setTypeFilter}
        onUploadClick={tm.handleUploadClick}
        onPreview={tm.handlePreviewClick}
        onDownload={tm.handleDownload}
        onEdit={tm.handleEditClick}
        onDelete={tm.handleDeleteClick}
        onStatusChange={tm.handleStatusChange}
      />

      {/* Upload Modal */}
      <TemplateUploadModal
        open={tm.isUploadModalOpen}
        onOpenChange={tm.setIsUploadModalOpen}
        formData={tm.formData}
        onFormChange={tm.setFormData}
        selectedFile={tm.selectedFile}
        onFileChange={tm.handleFileChange}
        formError={tm.formError}
        isSubmitting={tm.isUploading}
        onSubmit={tm.handleUploadSubmit}
      />

      {/* Edit Modal */}
      <TemplateEditModal
        open={tm.isEditModalOpen}
        onOpenChange={tm.setIsEditModalOpen}
        formData={tm.formData}
        onFormChange={tm.setFormData}
        selectedFile={tm.selectedFile}
        onFileChange={tm.handleFileChange}
        formError={tm.formError}
        isSubmitting={tm.isEditing}
        onSubmit={tm.handleEditSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={tm.isDeleteDialogOpen} onOpenChange={tm.setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus template "
              {tm.selectedTemplate?.template_name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={tm.handleDelete}
              className='bg-red-600 hover:bg-red-700'
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      <Dialog open={tm.isPreviewModalOpen} onOpenChange={tm.setIsPreviewModalOpen}>
        <DialogContent className='!max-w-[95vw] !w-[95vw] !h-[95vh] flex flex-col p-6'>
          <DialogHeader>
            <DialogTitle>Preview Template</DialogTitle>
            <DialogDescription>
              {tm.selectedTemplate?.template_name}
            </DialogDescription>
          </DialogHeader>
          <div className='flex-1 overflow-auto bg-gray-50 rounded-md border p-4'>
            {tm.selectedTemplate && (
              <TemplatePreview
                file={null}
                templateId={tm.selectedTemplate.id}
                onDownload={() => tm.handleDownload(tm.selectedTemplate!)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RouteComponent;

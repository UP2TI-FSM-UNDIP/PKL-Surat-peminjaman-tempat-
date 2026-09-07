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

interface WorkflowStepDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepName?: string;
  onConfirm: () => void;
}

export function WorkflowStepDeleteDialog({
  open,
  onOpenChange,
  stepName,
  onConfirm,
}: WorkflowStepDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Step</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus step "{stepName || ''}"? Tindakan
            ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className='bg-red-600 hover:bg-red-700'
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default WorkflowStepDeleteDialog;

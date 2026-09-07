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

interface WorkflowDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowName?: string;
  onConfirm: () => void;
}

export function WorkflowDeleteDialog({
  open,
  onOpenChange,
  workflowName,
  onConfirm,
}: WorkflowDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Workflow</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus workflow "{workflowName || ''}"?
            Tindakan ini tidak dapat dibatalkan.
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

export default WorkflowDeleteDialog;

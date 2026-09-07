import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button/button';
import type { Workflow } from '@/services/workflow.service';

interface WorkflowDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedWorkflow: Workflow | null;
  getScopeTypeLabel: (scopeType: string) => string;
  getCategoryLabel: (category: string) => string;
}

export function WorkflowDetailDialog({
  open,
  onOpenChange,
  selectedWorkflow,
  getScopeTypeLabel,
  getCategoryLabel,
}: WorkflowDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Detail Workflow</DialogTitle>
        </DialogHeader>
        <div className='max-h-[calc(100vh-200px)] overflow-y-auto'>
          {selectedWorkflow && (
            <div className='space-y-4 py-4'>
              <div>
                <Label className='font-semibold'>Nama Workflow</Label>
                <p>{selectedWorkflow.name}</p>
              </div>
              <div>
                <Label className='font-semibold'>Kategori</Label>
                <p>{getCategoryLabel(selectedWorkflow.applies_to_category)}</p>
              </div>
              <div>
                <Label className='font-semibold'>Deskripsi</Label>
                <p>{selectedWorkflow.description || '-'}</p>
              </div>
              <div>
                <Label className='font-semibold'>Langkah-langkah</Label>
                {selectedWorkflow.steps && selectedWorkflow.steps.length > 0 ? (
                  <div className='space-y-2 mt-2'>
                    {selectedWorkflow.steps.map((step) => (
                      <Card key={step.id}>
                        <CardContent className='p-3'>
                          <div className='flex items-center gap-2 mb-1'>
                            <Badge variant='outline'>
                              Step {step.step_order}
                            </Badge>
                            <span className='font-medium'>
                              {step.step_name}
                            </span>
                          </div>
                          <div className='text-sm text-gray-600'>
                            <div>Role: {step.target_role_slug}</div>
                            <div>
                              Scope: {getScopeTypeLabel(step.scope_type)}
                            </div>
                            {step.target_category_lookup && (
                              <div>
                                Target:{' '}
                                {getCategoryLabel(step.target_category_lookup)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className='text-gray-500 mt-2'>Tidak ada step</p>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WorkflowDetailDialog;

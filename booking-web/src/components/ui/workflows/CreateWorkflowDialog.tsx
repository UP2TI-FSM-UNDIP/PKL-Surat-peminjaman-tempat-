import type { Dispatch, SetStateAction } from 'react';
import type { Role } from '@/services/role.service';
import type { WorkflowStep } from '@/services/workflow.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

export type ScopeType =
  | 'SELF'
  | 'PARENT'
  | 'FACULTY_LEADER'
  | 'SPECIFIC_CATEGORY';

export type StepFormData = {
  step_order: number;
  step_name: string;
  target_role_slug: string;
  scope_type: ScopeType;
  target_category_lookup: string;
};

export type WorkflowFormData = {
  name: string;
  description: string;
  applies_to_category: string;
};

type StepInput = Omit<
  WorkflowStep,
  'id' | 'workflow_id' | 'created_at' | 'updated_at'
>;

type ScopeOption = {
  value: ScopeType;
  label: string;
  description: string;
};

type CategoryOption = {
  value: string;
  label: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: WorkflowFormData;
  setFormData: Dispatch<SetStateAction<WorkflowFormData>>;
  categories: readonly CategoryOption[];
  steps: StepInput[];
  removeStepFromForm: (index: number) => void;
  stepFormData: StepFormData;
  setStepFormData: Dispatch<SetStateAction<StepFormData>>;
  roles: Role[];
  scopeTypes: readonly ScopeOption[];
  getScopeTypeLabel: (scopeType: string) => string;
  addStepToForm: () => void;
  submitCreateWorkflow: () => void;
};

export function CreateWorkflowDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  categories,
  steps,
  removeStepFromForm,
  stepFormData,
  setStepFormData,
  roles,
  scopeTypes,
  getScopeTypeLabel,
  addStepToForm,
  submitCreateWorkflow,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Buat Workflow Baru</DialogTitle>
          <DialogDescription>
            Isi informasi workflow dan tambahkan langkah-langkah approval
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div>
            <Label htmlFor='name'>Nama Workflow *</Label>
            <Input
              id='name'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder='Contoh: Approval Peminjaman Ruangan'
            />
          </div>
          <div>
            <Label htmlFor='description'>Deskripsi</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder='Deskripsi workflow...'
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor='category'>Berlaku untuk Kategori *</Label>
            <Select
              value={formData.applies_to_category}
              onValueChange={(value) =>
                setFormData({ ...formData, applies_to_category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='border-t pt-4'>
            <h3 className='font-semibold mb-3'>Langkah-langkah Workflow *</h3>

            {steps.length > 0 && (
              <div className='space-y-2 mb-4'>
                {steps.map((step, index) => (
                  <Card key={index}>
                    <CardContent className='p-3'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <div className='flex items-center gap-2 mb-1'>
                            <Badge variant='outline'>
                              Step {step.step_order}
                            </Badge>
                            <span className='font-medium text-sm'>
                              {step.step_name}
                            </span>
                          </div>
                          <div className='text-xs text-gray-600'>
                            Role: {step.target_role_slug} | Scope:{' '}
                            {getScopeTypeLabel(step.scope_type)}
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => removeStepFromForm(index)}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Tambah Step Baru</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <Label htmlFor='step_name'>Nama Step</Label>
                  <Input
                    id='step_name'
                    value={stepFormData.step_name}
                    onChange={(e) =>
                      setStepFormData({
                        ...stepFormData,
                        step_name: e.target.value,
                      })
                    }
                    placeholder='Contoh: Approval Ketua'
                  />
                </div>
                <div>
                  <Label htmlFor='target_role'>Target Role</Label>
                  <Select
                    value={stepFormData.target_role_slug}
                    onValueChange={(value) =>
                      setStepFormData({
                        ...stepFormData,
                        target_role_slug: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Pilih role...' />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.slug}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='scope_type'>Scope Type</Label>
                  <Select
                    value={stepFormData.scope_type}
                    onValueChange={(value: ScopeType) =>
                      setStepFormData({ ...stepFormData, scope_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scopeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className='font-medium'>{type.label}</div>
                            <div className='text-xs text-gray-500'>
                              {type.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {stepFormData.scope_type === 'SPECIFIC_CATEGORY' && (
                  <div>
                    <Label htmlFor='target_category'>Target Category</Label>
                    <Select
                      value={stepFormData.target_category_lookup}
                      onValueChange={(value) =>
                        setStepFormData({
                          ...stepFormData,
                          target_category_lookup: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Pilih kategori...' />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  type='button'
                  onClick={addStepToForm}
                  variant='outline'
                  className='w-full'
                >
                  <Plus className='h-4 w-4 mr-2' /> Tambah Step
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submitCreateWorkflow}>Buat Workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button/button';
import type { Role } from '@/services/role.service';

export type StepFormData = {
  step_order: number;
  step_name: string;
  target_role_slug: string;
  scope_type: 'SELF' | 'PARENT' | 'FACULTY_LEADER' | 'SPECIFIC_CATEGORY';
  target_category_lookup: string;
};

interface CategoryOption {
  value: string;
  label: string;
}

interface ScopeTypeOption {
  value: string;
  label: string;
  description?: string;
}

interface WorkflowStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  stepFormData: StepFormData;
  setStepFormData: (
    updater: StepFormData | ((prev: StepFormData) => StepFormData),
  ) => void;
  roles: Role[];
  categories: readonly CategoryOption[];
  scopeTypes: readonly ScopeTypeOption[];
  onSubmit: () => void;
  submitLabel: string;
}

export function WorkflowStepDialog({
  open,
  onOpenChange,
  title,
  description,
  stepFormData,
  setStepFormData,
  roles,
  categories,
  scopeTypes,
  onSubmit,
  submitLabel,
}: WorkflowStepDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div>
            <Label htmlFor='step_name'>Nama Step</Label>
            <Input
              id='step_name'
              value={stepFormData.step_name}
              onChange={(e) =>
                setStepFormData({ ...stepFormData, step_name: e.target.value })
              }
              placeholder='Contoh: Approval Ketua'
            />
          </div>
          <div>
            <Label htmlFor='target_role'>Target Role</Label>
            <Select
              value={stepFormData.target_role_slug}
              onValueChange={(value) =>
                setStepFormData({ ...stepFormData, target_role_slug: value })
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
              onValueChange={(
                value:
                  | 'SELF'
                  | 'PARENT'
                  | 'FACULTY_LEADER'
                  | 'SPECIFIC_CATEGORY',
              ) => setStepFormData({ ...stepFormData, scope_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scopeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className='font-medium'>{type.label}</div>
                      {type.description && (
                        <div className='text-xs text-gray-500'>
                          {type.description}
                        </div>
                      )}
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
          <div>
            <Label htmlFor='step_order'>Order</Label>
            <Input
              id='step_order'
              type='number'
              value={stepFormData.step_order}
              onChange={(e) =>
                setStepFormData({
                  ...stepFormData,
                  step_order: Number.parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WorkflowStepDialog;

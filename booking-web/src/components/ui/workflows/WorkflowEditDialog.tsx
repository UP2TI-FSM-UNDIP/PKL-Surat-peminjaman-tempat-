import type { Dispatch, SetStateAction } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button/button';

export type WorkflowEditFormData = {
  name: string;
  description: string;
  applies_to_category: string;
};

export type CategoryOption = {
  value: string;
  label: string;
};

interface WorkflowEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: WorkflowEditFormData;
  setFormData: Dispatch<SetStateAction<WorkflowEditFormData>>;
  categories: readonly CategoryOption[];
  onSubmit: () => void;
}

export function WorkflowEditDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  categories,
  onSubmit,
}: WorkflowEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Workflow</DialogTitle>
          <DialogDescription>Update informasi workflow</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div>
            <Label htmlFor='edit_name'>Nama Workflow</Label>
            <Input
              id='edit_name'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor='edit_description'>Deskripsi</Label>
            <Textarea
              id='edit_description'
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor='edit_category'>Berlaku untuk Kategori</Label>
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
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={onSubmit}>Simpan Perubahan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WorkflowEditDialog;

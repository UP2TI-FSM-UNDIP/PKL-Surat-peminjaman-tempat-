import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import {
  workflowService,
  type Workflow,
  type WorkflowStep,
  type CreateWorkflowData,
} from '@/services/workflow.service';
import { roleService, type Role } from '@/services/role.service';
import { categories, scopeTypes } from '@/services/workflow.constants';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateWorkflowDialog } from '@/components/ui/workflows/CreateWorkflowDialog';
import { WorkflowDetailDialog } from '@/components/ui/workflows/WorkflowDetailDialog';
import { WorkflowDeleteDialog } from '@/components/ui/workflows/WorkflowDeleteDialog';
import { WorkflowTable } from '@/components/ui/workflows/WorkflowTable';
import { WorkflowStepDialog } from '@/components/ui/workflows/WorkflowStepDialog';
import { WorkflowStepDeleteDialog } from '@/components/ui/workflows/WorkflowStepDeleteDialog';

export const Route = createFileRoute('/admin/workflows/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<number>>(
    new Set(),
  );

  // Step management states
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [isEditStepModalOpen, setIsEditStepModalOpen] = useState(false);
  const [isDeleteStepDialogOpen, setIsDeleteStepDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [workflowForStep, setWorkflowForStep] = useState<Workflow | null>(null);

  // Form states for workflow
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    applies_to_category: 'HIMA',
  });

  // Form states for steps
  const [steps, setSteps] = useState<
    Omit<WorkflowStep, 'id' | 'workflow_id' | 'created_at' | 'updated_at'>[]
  >([]);
  const [stepFormData, setStepFormData] = useState({
    step_order: 1,
    step_name: '',
    target_role_slug: '',
    scope_type: 'SELF' as
      | 'SELF'
      | 'PARENT'
      | 'FACULTY_LEADER'
      | 'SPECIFIC_CATEGORY',
    target_category_lookup: '',
  });

  // Load workflows and roles
  useEffect(() => {
    loadWorkflows();
    loadRoles();
  }, []);

  // Filter workflows based on search and category
  useEffect(() => {
    let filtered = workflows;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (workflow) => workflow.applies_to_category === selectedCategory,
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (workflow) =>
          workflow.name.toLowerCase().includes(query) ||
          workflow.applies_to_category.toLowerCase().includes(query) ||
          (workflow.description &&
            workflow.description.toLowerCase().includes(query)),
      );
    }

    setFilteredWorkflows(filtered);
  }, [searchQuery, selectedCategory, workflows]);

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
      setFilteredWorkflows(data);
      setError(null);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Gagal memuat workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const toggleWorkflowExpansion = (workflowId: number) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(workflowId)) {
      newExpanded.delete(workflowId);
    } else {
      newExpanded.add(workflowId);
    }
    setExpandedWorkflows(newExpanded);
  };

  const handleCreateWorkflow = () => {
    setFormData({ name: '', description: '', applies_to_category: 'HIMA' });
    setSteps([]);
    setIsCreateModalOpen(true);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      applies_to_category: workflow.applies_to_category,
    });
    setIsEditModalOpen(true);
  };

  const handleViewWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsDetailModalOpen(true);
  };

  const handleDeleteWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsDeleteDialogOpen(true);
  };

  const addStepToForm = () => {
    if (!stepFormData.step_name || !stepFormData.target_role_slug) {
      alert('Harap isi nama step dan role target');
      return;
    }

    const newStep = {
      step_order: steps.length + 1,
      step_name: stepFormData.step_name,
      target_role_slug: stepFormData.target_role_slug,
      scope_type: stepFormData.scope_type,
      target_category_lookup:
        stepFormData.scope_type === 'SPECIFIC_CATEGORY'
          ? stepFormData.target_category_lookup
          : null,
    };

    setSteps([...steps, newStep]);
    setStepFormData({
      step_order: steps.length + 2,
      step_name: '',
      target_role_slug: '',
      scope_type: 'SELF',
      target_category_lookup: '',
    });
  };

  const removeStepFromForm = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Re-order steps
    const reorderedSteps = newSteps.map((step, i) => ({
      ...step,
      step_order: i + 1,
    }));
    setSteps(reorderedSteps);
  };

  const submitCreateWorkflow = async () => {
    if (!formData.name || steps.length === 0) {
      alert('Harap isi nama workflow dan minimal 1 step');
      return;
    }

    try {
      const createData: CreateWorkflowData = {
        name: formData.name,
        description: formData.description || undefined,
        applies_to_category: formData.applies_to_category,
        steps: steps,
      };

      await workflowService.createWorkflow(createData);
      setIsCreateModalOpen(false);
      loadWorkflows();
      setFormData({ name: '', description: '', applies_to_category: 'HIMA' });
      setSteps([]);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || 'Gagal membuat workflow');
    }
  };

  const submitEditWorkflow = async () => {
    if (!selectedWorkflow || !formData.name) {
      return;
    }

    try {
      await workflowService.updateWorkflow(selectedWorkflow.id, {
        name: formData.name,
        description: formData.description || undefined,
        applies_to_category: formData.applies_to_category,
      });

      setIsEditModalOpen(false);
      loadWorkflows();
      setSelectedWorkflow(null);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || 'Gagal mengupdate workflow');
    }
  };

  const confirmDeleteWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      await workflowService.deleteWorkflow(selectedWorkflow.id);
      setIsDeleteDialogOpen(false);
      loadWorkflows();
      setSelectedWorkflow(null);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || 'Gagal menghapus workflow');
    }
  };

  // Step management functions
  const handleManageSteps = (workflow: Workflow) => {
    setWorkflowForStep(workflow);
    setStepFormData({
      step_order: (workflow.steps?.length || 0) + 1,
      step_name: '',
      target_role_slug: '',
      scope_type: 'SELF',
      target_category_lookup: '',
    });
    setIsStepModalOpen(true);
  };

  const submitAddStep = async () => {
    if (
      !workflowForStep ||
      !stepFormData.step_name ||
      !stepFormData.target_role_slug
    ) {
      alert('Harap isi semua field yang diperlukan');
      return;
    }

    try {
      await workflowService.addStep(workflowForStep.id, {
        step_order: stepFormData.step_order,
        step_name: stepFormData.step_name,
        target_role_slug: stepFormData.target_role_slug,
        scope_type: stepFormData.scope_type,
        target_category_lookup:
          stepFormData.scope_type === 'SPECIFIC_CATEGORY'
            ? stepFormData.target_category_lookup
            : undefined,
      });

      setIsStepModalOpen(false);
      loadWorkflows();
      setWorkflowForStep(null);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || 'Gagal menambah step');
    }
  };

  const handleEditStep = (workflow: Workflow, step: WorkflowStep) => {
    setWorkflowForStep(workflow);
    setSelectedStep(step);
    setStepFormData({
      step_order: step.step_order,
      step_name: step.step_name,
      target_role_slug: step.target_role_slug,
      scope_type: step.scope_type,
      target_category_lookup: step.target_category_lookup || '',
    });
    setIsEditStepModalOpen(true);
  };

  const submitEditStep = async () => {
    if (!workflowForStep || !selectedStep) return;

    try {
      await workflowService.updateStep(workflowForStep.id, selectedStep.id!, {
        step_order: stepFormData.step_order,
        step_name: stepFormData.step_name,
        target_role_slug: stepFormData.target_role_slug,
        scope_type: stepFormData.scope_type,
        target_category_lookup:
          stepFormData.scope_type === 'SPECIFIC_CATEGORY'
            ? stepFormData.target_category_lookup
            : undefined,
      });

      setIsEditStepModalOpen(false);
      loadWorkflows();
      setWorkflowForStep(null);
      setSelectedStep(null);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || 'Gagal mengupdate step');
    }
  };

  const handleDeleteStep = (workflow: Workflow, step: WorkflowStep) => {
    setWorkflowForStep(workflow);
    setSelectedStep(step);
    setIsDeleteStepDialogOpen(true);
  };

  const confirmDeleteStep = async () => {
    if (!workflowForStep || !selectedStep) return;

    try {
      await workflowService.deleteStep(workflowForStep.id, selectedStep.id!);
      setIsDeleteStepDialogOpen(false);
      loadWorkflows();
      setWorkflowForStep(null);
      setSelectedStep(null);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || 'Gagal menghapus step');
    }
  };

  const getScopeTypeLabel = (scopeType: string) => {
    const type = scopeTypes.find((t) => t.value === scopeType);
    return type?.label || scopeType;
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat?.label || category;
  };

  if (isLoading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-lg'>Loading workflows...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-7xl'>
      {/* Header */}
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2'>
          Manajemen Alur
        </h1>
        <p className='text-sm sm:text-base text-gray-600'>
          Kelola workflow approval untuk berbagai kategori unit
        </p>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      {/* Search and Create Button */}
      <div className='mb-4 sm:mb-6 flex flex-row justify-between gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400' />
          <Input
            type='text'
            placeholder='Cari workflow...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-7 sm:pl-10 text-sm h-9 sm:h-10'
          />
        </div>
        <Button
          onClick={handleCreateWorkflow}
          className='whitespace-nowrap h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base'
        >
          <Plus className='h-5 w-5 mr-2' />
          <span>Buat Workflow</span>
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className='mb-4 flex flex-wrap gap-2'>
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size='sm'
          onClick={() => setSelectedCategory(null)}
          className='text-xs sm:text-sm'
        >
          Semua
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedCategory(cat.value)}
            className='text-xs sm:text-sm'
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Workflows Table */}
      <WorkflowTable
        workflows={filteredWorkflows}
        expandedWorkflows={expandedWorkflows}
        onToggleExpand={toggleWorkflowExpansion}
        onView={handleViewWorkflow}
        onManageSteps={handleManageSteps}
        onEdit={handleEditWorkflow}
        onDelete={handleDeleteWorkflow}
        onEditStep={handleEditStep}
        onDeleteStep={handleDeleteStep}
        getScopeTypeLabel={getScopeTypeLabel}
        getCategoryLabel={getCategoryLabel}
      />

      {/* Create Workflow Modal */}
      <CreateWorkflowDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        steps={steps}
        removeStepFromForm={removeStepFromForm}
        stepFormData={stepFormData}
        setStepFormData={setStepFormData}
        roles={roles}
        scopeTypes={scopeTypes}
        getScopeTypeLabel={getScopeTypeLabel}
        addStepToForm={addStepToForm}
        submitCreateWorkflow={submitCreateWorkflow}
      />

      {/* Edit Workflow Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
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
            <Button variant='outline' onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={submitEditWorkflow}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Detail Modal */}
      <WorkflowDetailDialog
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        selectedWorkflow={selectedWorkflow}
        getScopeTypeLabel={getScopeTypeLabel}
        getCategoryLabel={getCategoryLabel}
      />

      {/* Delete Workflow Dialog */}
      <WorkflowDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        workflowName={selectedWorkflow?.name ?? ''}
        onConfirm={confirmDeleteWorkflow}
      />

      {/* Add Step Modal */}
      <WorkflowStepDialog
        open={isStepModalOpen}
        onOpenChange={setIsStepModalOpen}
        title='Tambah Step ke Workflow'
        description={`Tambahkan langkah baru ke workflow "${workflowForStep?.name || ''}"`}
        stepFormData={stepFormData}
        setStepFormData={setStepFormData}
        roles={roles}
        categories={categories}
        scopeTypes={scopeTypes}
        onSubmit={submitAddStep}
        submitLabel='Tambah Step'
      />

      {/* Edit Step Modal */}
      <WorkflowStepDialog
        open={isEditStepModalOpen}
        onOpenChange={setIsEditStepModalOpen}
        title='Edit Step'
        description='Update informasi step workflow'
        stepFormData={stepFormData}
        setStepFormData={setStepFormData}
        roles={roles}
        categories={categories}
        scopeTypes={scopeTypes}
        onSubmit={submitEditStep}
        submitLabel='Simpan Perubahan'
      />

      {/* Delete Step Dialog */}
      <WorkflowStepDeleteDialog
        open={isDeleteStepDialogOpen}
        onOpenChange={setIsDeleteStepDialogOpen}
        stepName={selectedStep?.step_name || ''}
        onConfirm={confirmDeleteStep}
      />
    </div>
  );
}

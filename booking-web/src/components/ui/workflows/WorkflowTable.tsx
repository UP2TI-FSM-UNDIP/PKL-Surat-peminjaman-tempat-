import { Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button/button';
import {
  Eye,
  Settings,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Workflow, WorkflowStep } from '@/services/workflow.service';

interface WorkflowTableProps {
  workflows: Workflow[];
  expandedWorkflows: Set<number>;
  onToggleExpand: (workflowId: number) => void;
  onView: (workflow: Workflow) => void;
  onManageSteps: (workflow: Workflow) => void;
  onEdit: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
  onEditStep: (workflow: Workflow, step: WorkflowStep) => void;
  onDeleteStep: (workflow: Workflow, step: WorkflowStep) => void;
  getScopeTypeLabel: (scopeType: string) => string;
  getCategoryLabel: (category: string) => string;
}

export function WorkflowTable({
  workflows,
  expandedWorkflows,
  onToggleExpand,
  onView,
  onManageSteps,
  onEdit,
  onDelete,
  onEditStep,
  onDeleteStep,
  getScopeTypeLabel,
  getCategoryLabel,
}: WorkflowTableProps) {
  return (
    <div className='bg-white rounded-lg shadow overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-8 sm:w-12'></TableHead>
            <TableHead className='min-w-[150px]'>Nama Workflow</TableHead>
            <TableHead className='hidden sm:table-cell'>Kategori</TableHead>
            <TableHead className='hidden md:table-cell'>Jumlah Step</TableHead>
            <TableHead className='hidden lg:table-cell'>Deskripsi</TableHead>
            <TableHead className='text-right w-[100px] sm:w-auto'>
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className='text-center py-8 text-gray-500'>
                Tidak ada workflow ditemukan
              </TableCell>
            </TableRow>
          ) : (
            workflows.map((workflow) => (
              <Fragment key={workflow.id}>
                <WorkflowRow
                  workflow={workflow}
                  expanded={expandedWorkflows.has(workflow.id)}
                  onToggleExpand={onToggleExpand}
                  onView={onView}
                  onManageSteps={onManageSteps}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onEditStep={onEditStep}
                  onDeleteStep={onDeleteStep}
                  getScopeTypeLabel={getScopeTypeLabel}
                  getCategoryLabel={getCategoryLabel}
                />
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface WorkflowRowProps {
  workflow: Workflow;
  expanded: boolean;
  onToggleExpand: (workflowId: number) => void;
  onView: (workflow: Workflow) => void;
  onManageSteps: (workflow: Workflow) => void;
  onEdit: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
  onEditStep: (workflow: Workflow, step: WorkflowStep) => void;
  onDeleteStep: (workflow: Workflow, step: WorkflowStep) => void;
  getScopeTypeLabel: (scopeType: string) => string;
  getCategoryLabel: (category: string) => string;
}

function WorkflowRow({
  workflow,
  expanded,
  onToggleExpand,
  onView,
  onManageSteps,
  onEdit,
  onDelete,
  onEditStep,
  onDeleteStep,
  getScopeTypeLabel,
  getCategoryLabel,
}: WorkflowRowProps) {
  return (
    <>
      <TableRow>
        <TableCell className='py-2 sm:py-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onToggleExpand(workflow.id)}
            className='h-7 w-7 p-0 sm:h-8 sm:w-8'
          >
            {expanded ? (
              <ChevronUp className='h-3 w-3 sm:h-4 sm:w-4' />
            ) : (
              <ChevronDown className='h-3 w-3 sm:h-4 sm:w-4' />
            )}
          </Button>
        </TableCell>
        <TableCell className='font-medium py-2 sm:py-4'>
          <div>
            <div className='text-sm sm:text-base'>{workflow.name}</div>
            <div className='sm:hidden text-xs text-gray-500 mt-1 space-y-0.5'>
              <div>
                <Badge variant='secondary' className='text-xs'>
                  {getCategoryLabel(workflow.applies_to_category)}
                </Badge>
              </div>
              <div>{workflow.steps?.length || 0} step(s)</div>
            </div>
          </div>
        </TableCell>
        <TableCell className='hidden sm:table-cell py-2 sm:py-4'>
          <Badge variant='secondary'>
            {getCategoryLabel(workflow.applies_to_category)}
          </Badge>
        </TableCell>
        <TableCell className='hidden md:table-cell py-2 sm:py-4'>
          {workflow.steps?.length || 0} step(s)
        </TableCell>
        <TableCell className='hidden lg:table-cell max-w-md truncate py-2 sm:py-4'>
          {workflow.description || '-'}
        </TableCell>
        <TableCell className='text-right py-2 sm:py-4'>
          <div className='flex justify-end gap-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onView(workflow)}
              className='h-7 w-7 p-0 sm:h-8 sm:w-8'
              title='View'
            >
              <Eye className='h-3 w-3 sm:h-4 sm:w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onManageSteps(workflow)}
              className='h-7 w-7 p-0 sm:h-8 sm:w-8'
              title='Manage Steps'
            >
              <Settings className='h-3 w-3 sm:h-4 sm:w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onEdit(workflow)}
              className='h-7 w-7 p-0 sm:h-8 sm:w-8'
              title='Edit'
            >
              <Pencil className='h-3 w-3 sm:h-4 sm:w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onDelete(workflow)}
              className='h-7 w-7 p-0 sm:h-8 sm:w-8'
              title='Delete'
            >
              <Trash2 className='h-3 w-3 sm:h-4 sm:w-4 text-red-500' />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={6} className='bg-gray-50 p-2 sm:p-4'>
            <WorkflowSteps
              steps={workflow.steps || []}
              getScopeTypeLabel={getScopeTypeLabel}
              getCategoryLabel={getCategoryLabel}
              onEditStep={(step) => onEditStep(workflow, step)}
              onDeleteStep={(step) => onDeleteStep(workflow, step)}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

interface WorkflowStepsProps {
  steps: WorkflowStep[];
  getScopeTypeLabel: (scopeType: string) => string;
  getCategoryLabel: (category: string) => string;
  onEditStep?: (step: WorkflowStep) => void;
  onDeleteStep?: (step: WorkflowStep) => void;
}

function WorkflowSteps({
  steps,
  getScopeTypeLabel,
  getCategoryLabel,
  onEditStep,
  onDeleteStep,
}: WorkflowStepsProps) {
  return (
    <div>
      <h4 className='font-semibold mb-2 sm:mb-3 text-sm sm:text-base'>
        Workflow Steps:
      </h4>
      {steps && steps.length > 0 ? (
        <div className='space-y-2'>
          {steps.map((step) => (
            <Card key={step.id}>
              <CardContent className='p-2 sm:p-4'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1 sm:mb-2 flex-wrap'>
                      <Badge variant='outline' className='text-xs'>
                        Step {step.step_order}
                      </Badge>
                      <span className='font-medium text-sm sm:text-base'>
                        {step.step_name}
                      </span>
                    </div>
                    <div className='text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1'>
                      <div className='break-words'>
                        <span className='font-medium'>Role:</span>{' '}
                        {step.target_role_slug}
                      </div>
                      <div>
                        <span className='font-medium'>Scope:</span>{' '}
                        {getScopeTypeLabel(step.scope_type)}
                      </div>
                      {step.target_category_lookup && (
                        <div>
                          <span className='font-medium'>Target Category:</span>{' '}
                          {getCategoryLabel(step.target_category_lookup)}
                        </div>
                      )}
                    </div>
                  </div>
                  {(onEditStep || onDeleteStep) && (
                    <div className='flex gap-1 flex-shrink-0'>
                      {onEditStep && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onEditStep(step)}
                          className='h-7 w-7 p-0'
                        >
                          <Pencil className='h-3 w-3' />
                        </Button>
                      )}
                      {onDeleteStep && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onDeleteStep(step)}
                          className='h-7 w-7 p-0'
                        >
                          <Trash2 className='h-3 w-3 text-red-500' />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className='text-gray-500 text-sm'>
          Belum ada step untuk workflow ini
        </p>
      )}
    </div>
  );
}

export default WorkflowTable;

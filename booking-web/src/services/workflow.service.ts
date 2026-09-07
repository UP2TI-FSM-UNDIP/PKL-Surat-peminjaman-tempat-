import api from '@/lib/axios';

export interface WorkflowStep {
  id?: number;
  workflow_id?: number;
  step_order: number;
  step_name: string;
  target_role_slug: string;
  scope_type: 'SELF' | 'PARENT' | 'FACULTY_LEADER' | 'SPECIFIC_CATEGORY';
  target_category_lookup?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string | null;
  applies_to_category: string;
  steps?: WorkflowStep[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowResponse {
  success: boolean;
  data: Workflow[];
}

export interface SingleWorkflowResponse {
  success: boolean;
  data: Workflow;
}

export interface CreateWorkflowData {
  name: string;
  description?: string;
  applies_to_category: string;
  steps: Omit<WorkflowStep, 'id' | 'workflow_id' | 'created_at' | 'updated_at'>[];
}

export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  applies_to_category?: string;
}

export interface CreateStepData {
  step_order: number;
  step_name: string;
  target_role_slug: string;
  scope_type: 'SELF' | 'PARENT' | 'FACULTY_LEADER' | 'SPECIFIC_CATEGORY';
  target_category_lookup?: string;
}

export interface UpdateStepData {
  step_order?: number;
  step_name?: string;
  target_role_slug?: string;
  scope_type?: 'SELF' | 'PARENT' | 'FACULTY_LEADER' | 'SPECIFIC_CATEGORY';
  target_category_lookup?: string;
}

export const workflowService = {
  /**
   * Get all workflows
   */
  async getWorkflows(): Promise<Workflow[]> {
    const response = await api.get<WorkflowResponse>('/workflows');
    // Backend returns plain array (not paginated)
    return response.data.data ?? [];
  },

  /**
   * Get single workflow by ID
   */
  async getWorkflow(id: number): Promise<Workflow> {
    const response = await api.get<SingleWorkflowResponse>(`/workflows/${id}`);
    return response.data.data;
  },

  /**
   * Create new workflow
   */
  async createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
    const response = await api.post<SingleWorkflowResponse>('/workflows', data);
    return response.data.data;
  },

  /**
   * Update existing workflow
   */
  async updateWorkflow(id: number, data: UpdateWorkflowData): Promise<Workflow> {
    const response = await api.put<SingleWorkflowResponse>(`/workflows/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: number): Promise<void> {
    await api.delete(`/workflows/${id}`);
  },

  /**
   * Add step to workflow
   */
  async addStep(workflowId: number, data: CreateStepData): Promise<WorkflowStep> {
    const response = await api.post<{ success: boolean; data: WorkflowStep }>(
      `/workflows/${workflowId}/steps`,
      data
    );
    return response.data.data;
  },

  /**
   * Update workflow step
   */
  async updateStep(
    workflowId: number,
    stepId: number,
    data: UpdateStepData
  ): Promise<WorkflowStep> {
    const response = await api.put<{ success: boolean; data: WorkflowStep }>(
      `/workflows/${workflowId}/steps/${stepId}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete workflow step
   */
  async deleteStep(workflowId: number, stepId: number): Promise<void> {
    await api.delete(`/workflows/${workflowId}/steps/${stepId}`);
  },
};

import api from '@/lib/axios';
import type {
  DocumentTemplate,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  ActiveTemplates,
  TemplateType,
  AvailableField,
  PlaceholderMetadata,
} from '@/types/template.types';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export const documentTemplateService = {
  /**
   * Get all templates with optional filters
   */
  async getTemplates(params?: {
    type?: TemplateType;
    is_active?: boolean;
  }): Promise<DocumentTemplate[]> {
    const response = await api.get<ApiResponse<DocumentTemplate[]>>(
      '/document-templates',
      { params },
    );
    return response.data.data ?? [];
  },

  /**
   * Get single template by ID
   */
  async getTemplate(id: number): Promise<DocumentTemplate> {
    const response = await api.get<ApiResponse<DocumentTemplate>>(
      `/document-templates/${id}`,
    );
    return response.data.data;
  },

  /**
   * Get active templates (both types)
   */
  async getActiveTemplates(): Promise<ActiveTemplates | null> {
    const response = await api.get<ApiResponse<ActiveTemplates>>(
      '/document-templates/active',
    );
    return response.data.data ?? null;
  },

  /**
   * Upload new template
   */
  async createTemplate(data: CreateTemplateDTO): Promise<DocumentTemplate> {
    const formData = new FormData();
    formData.append('template_type', data.template_type);
    formData.append('template_name', data.template_name);
    formData.append('file', data.file);

    if (data.organization_type) {
      formData.append('organization_type', data.organization_type);
    }

    if (data.description) {
      formData.append('description', data.description);
    }

    if (data.set_as_active !== undefined) {
      formData.append('set_as_active', data.set_as_active ? '1' : '0');
    }

    const response = await api.post<ApiResponse<DocumentTemplate>>(
      '/document-templates',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data.data;
  },

  /**
   * Update existing template
   */
  async updateTemplate(
    id: number,
    data: UpdateTemplateDTO,
  ): Promise<DocumentTemplate> {
    const formData = new FormData();

    if (data.template_name) {
      formData.append('template_name', data.template_name);
    }

    if (data.file) {
      formData.append('file', data.file);
    }

    if (data.description !== undefined) {
      formData.append('description', data.description);
    }

    const response = await api.post<ApiResponse<DocumentTemplate>>(
      `/document-templates/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data.data;
  },

  /**
   * Delete template
   */
  async deleteTemplate(id: number): Promise<void> {
    await api.delete(`/document-templates/${id}`);
  },

  /**
   * Set template as active
   */
  async activateTemplate(id: number): Promise<DocumentTemplate> {
    const response = await api.patch<ApiResponse<DocumentTemplate>>(
      `/document-templates/${id}/activate`,
    );
    return response.data.data;
  },

  /**
   * Set template as inactive
   */
  async deactivateTemplate(id: number): Promise<DocumentTemplate> {
    const response = await api.patch<ApiResponse<DocumentTemplate>>(
      `/document-templates/${id}/deactivate`,
    );
    return response.data.data;
  },

  /**
   * Download template file
   */
  async downloadTemplate(id: number, filename: string): Promise<void> {
    const response = await api.get(`/document-templates/${id}/download`, {
      responseType: 'blob',
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Get download URL for template
   */
  getDownloadUrl(id: number): string {
    return `${api.defaults.baseURL}/document-templates/${id}/download`;
  },

  /**
   * Get all available fields for placeholders
   */
  async getAvailableFields(): Promise<Record<string, AvailableField>> {
    const response = await api.get<
      ApiResponse<{
        all: Record<string, AvailableField>;
        grouped: Record<string, Record<string, AvailableField>>;
        total: number;
      }>
    >('/document-templates/available-fields');
    return response.data.data?.all ?? {};
  },

  /**
   * Update placeholder metadata for a template
   */
  async updatePlaceholderMetadata(
    id: number,
    metadata: Record<string, PlaceholderMetadata>,
  ): Promise<DocumentTemplate> {
    const response = await api.put<ApiResponse<DocumentTemplate>>(
      `/document-templates/${id}/placeholder-metadata`,
      { metadata },
    );
    return response.data.data;
  },
};

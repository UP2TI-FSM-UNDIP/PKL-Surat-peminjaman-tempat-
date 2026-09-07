export type TemplateType = 'executive_summary' | 'lembar_pengesahan';
export type OrganizationType = 'hmd' | 'bem_ukm' | 'senat';

export interface PlaceholderMetadata {
  label: string;
  available: boolean;
  example?: string | null;
  category: string;
  type: string;
  source?: string | null;
}

export interface AvailableField {
  key: string;
  label: string;
  source: string;
  example: string;
  category: string;
  type?: string;
}

export interface DocumentTemplate {
  id: number;
  template_type: TemplateType;
  organization_type?: OrganizationType | null; // Untuk lembar pengesahan
  template_name: string;
  file_path: string;
  file_url: string | null;
  version: number;
  is_active: boolean;
  uploaded_by: number;
  description: string | null;
  detected_placeholders?: string[] | null;
  placeholder_metadata?: Record<string, PlaceholderMetadata> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  uploader?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateTemplateDTO {
  template_type: TemplateType;
  organization_type?: OrganizationType; // Required jika lembar_pengesahan
  template_name: string;
  file: File;
  description?: string;
  set_as_active?: boolean;
}

export interface UpdateTemplateDTO {
  template_name?: string;
  file?: File;
  description?: string;
}

export interface ActiveTemplates {
  executive_summary: DocumentTemplate | null;
  lembar_pengesahan: DocumentTemplate | null;
}

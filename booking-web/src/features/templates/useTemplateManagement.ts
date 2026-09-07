import { useState, useMemo } from 'react';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentTemplateService } from '@/services/document-template.service';
import type { DocumentTemplate, TemplateType, OrganizationType } from '@/types/template.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function parseAxiosError(err: unknown, fallback: string): string {
    if (err instanceof AxiosError) {
        const errors = err.response?.data?.errors;
        if (errors) return Object.values(errors).flat().join(', ');
        return err.response?.data?.message || fallback;
    }
    return fallback;
}

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
    executive_summary: 'Executive Summary',
    lembar_pengesahan: 'Lembar Pengesahan',
};

export const ORG_TYPE_LABELS: Record<string, string> = {
    general: 'Umum / Semua',
    hmd: 'HMD',
    bem_ukm: 'BEM/UKM',
    senat: 'Senat',
};

export const INITIAL_FORM = {
    template_type: 'executive_summary' as TemplateType,
    organization_type: 'general' as OrganizationType | 'general',
    template_name: '',
    description: '',
    set_as_active: true,
};

export type TemplateFormData = typeof INITIAL_FORM;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTemplateManagement() {
    const queryClient = useQueryClient();

    // Filter
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Modal states
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

    // Form states
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formError, setFormError] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);

    // ---- DATA FETCHING ----
    const {
        data: templates = [],
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['document-templates'],
        queryFn: () => documentTemplateService.getTemplates(),
    });

    // ---- DERIVED FILTERING ----
    const filteredTemplates = useMemo(() => {
        if (typeFilter === 'all') return templates;
        return templates.filter((t) => t.template_type === typeFilter);
    }, [templates, typeFilter]);

    // ---- MUTATIONS ----
    const invalidateTemplates = () =>
        queryClient.invalidateQueries({ queryKey: ['document-templates'] });

    const uploadMutation = useMutation({
        mutationFn: (params: { formData: TemplateFormData; file: File }) =>
            documentTemplateService.createTemplate({
                template_type: params.formData.template_type,
                organization_type: params.formData.organization_type === 'general'
                    ? undefined
                    : params.formData.organization_type as OrganizationType,
                template_name: params.formData.template_name,
                file: params.file,
                description: params.formData.description || undefined,
                set_as_active: params.formData.set_as_active,
            }),
        onSuccess: () => {
            setIsUploadModalOpen(false);
            invalidateTemplates();
        },
        onError: (err) => setFormError(parseAxiosError(err, 'Gagal upload template')),
    });

    const editMutation = useMutation({
        mutationFn: (params: { id: number; formData: TemplateFormData; file: File | null }) =>
            documentTemplateService.updateTemplate(params.id, {
                template_name: params.formData.template_name,
                file: params.file || undefined,
                description: params.formData.description || undefined,
            }),
        onSuccess: () => {
            setIsEditModalOpen(false);
            invalidateTemplates();
        },
        onError: (err) => setFormError(parseAxiosError(err, 'Gagal update template')),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => documentTemplateService.deleteTemplate(id),
        onSuccess: () => {
            setIsDeleteDialogOpen(false);
            invalidateTemplates();
        },
        onError: (err) => {
            setActionError(parseAxiosError(err, 'Gagal menghapus template'));
            setIsDeleteDialogOpen(false);
        },
    });

    const statusMutation = useMutation({
        mutationFn: (params: { template: DocumentTemplate; newStatus: string }) => {
            if (params.newStatus === 'active') {
                return documentTemplateService.activateTemplate(params.template.id);
            }
            return documentTemplateService.deactivateTemplate(params.template.id);
        },
        onSuccess: () => invalidateTemplates(),
        onError: (err) => setActionError(parseAxiosError(err, 'Gagal mengubah status template')),
    });

    // ---- HANDLERS ----
    const handleUploadClick = () => {
        setFormData(INITIAL_FORM);
        setSelectedFile(null);
        setFormError('');
        setIsUploadModalOpen(true);
    };

    const handleEditClick = (template: DocumentTemplate) => {
        setSelectedTemplate(template);
        setFormData({
            template_type: template.template_type,
            organization_type: (template.organization_type || 'general') as OrganizationType | 'general',
            template_name: template.template_name,
            description: template.description || '',
            set_as_active: template.is_active,
        });
        setSelectedFile(null);
        setFormError('');
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (template: DocumentTemplate) => {
        setSelectedTemplate(template);
        setIsDeleteDialogOpen(true);
    };

    const handlePreviewClick = (template: DocumentTemplate) => {
        setSelectedTemplate(template);
        setIsPreviewModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
            ];
            if (!validTypes.includes(file.type)) {
                setFormError('File harus berformat .docx atau .doc');
                setSelectedFile(null);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setFormError('Ukuran file maksimal 10MB');
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setFormError('');
        }
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setFormError('Pilih file template terlebih dahulu');
            return;
        }
        if (!formData.template_name.trim()) {
            setFormError('Nama template harus diisi');
            return;
        }
        if (formData.template_type === 'lembar_pengesahan' && !formData.organization_type) {
            setFormError('Jenis organisasi harus dipilih untuk Lembar Pengesahan');
            return;
        }
        setFormError('');
        uploadMutation.mutate({ formData, file: selectedFile });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;
        if (!formData.template_name.trim()) {
            setFormError('Nama template harus diisi');
            return;
        }
        setFormError('');
        editMutation.mutate({ id: selectedTemplate.id, formData, file: selectedFile });
    };

    const handleDelete = () => {
        if (!selectedTemplate) return;
        deleteMutation.mutate(selectedTemplate.id);
    };

    const handleStatusChange = (template: DocumentTemplate, newStatus: string) => {
        statusMutation.mutate({ template, newStatus });
    };

    const handleDownload = async (template: DocumentTemplate) => {
        try {
            await documentTemplateService.downloadTemplate(
                template.id,
                `${template.template_name}.docx`,
            );
        } catch (err) {
            setActionError(parseAxiosError(err, 'Gagal download template'));
        }
    };

    const isSubmitting =
        uploadMutation.isPending || editMutation.isPending || deleteMutation.isPending;

    return {
        // Data
        templates,
        filteredTemplates,
        isLoading,
        isError,
        refetch,

        // Filter
        typeFilter,
        setTypeFilter,

        // Modals
        isUploadModalOpen,
        setIsUploadModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isPreviewModalOpen,
        setIsPreviewModalOpen,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        selectedTemplate,

        // Form
        formData,
        setFormData,
        selectedFile,
        formError,
        actionError,
        setActionError,
        isSubmitting,

        // Mutation states
        isUploading: uploadMutation.isPending,
        isEditing: editMutation.isPending,

        // Handlers
        handleUploadClick,
        handleEditClick,
        handleDeleteClick,
        handlePreviewClick,
        handleFileChange,
        handleUploadSubmit,
        handleEditSubmit,
        handleDelete,
        handleStatusChange,
        handleDownload,
    };
}

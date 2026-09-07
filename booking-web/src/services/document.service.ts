import api from '@/lib/axios';

// Import Types dan Interface dari file terpisah
import type {
  Document,
  DocumentsResponse,
  SingleDocumentResponse,
  CreateDocumentData,
  UpdateDocumentData,
} from '@/types/document';

// Export Document type for use in other files
export type { Document };

export const documentService = {
  /**
   * Get list dokumen user
   * Axios otomatis meng-handle query params object
   */
  async getDocuments(filters?: { status?: string; workflow_id?: number; per_page?: number; page_my?: number; page_pending?: number; page_processed?: number }) {
    // Optimasi: Gunakan opsi 'params' milik Axios, tidak perlu URLSearchParams manual
    const response = await api.get<DocumentsResponse>('/documents', {
      params: { per_page: 10, ...filters },
    });

    const myDocs = response.data.data.my_documents;
    const pendingDocs = response.data.data.pending_documents;
    const processedDocs = response.data.data.processed_documents;

    return {
      my_documents: myDocs.data,
      pending_documents: pendingDocs.data,
      processed_documents: processedDocs.data,
      // Pagination metadata untuk my_documents
      my_documents_pagination: {
        current_page: myDocs.current_page,
        last_page: myDocs.last_page,
        per_page: myDocs.per_page,
        total: myDocs.total,
        from: myDocs.from,
        to: myDocs.to,
      },
      // Pagination metadata untuk pending_documents
      pending_documents_pagination: {
        current_page: pendingDocs.current_page,
        last_page: pendingDocs.last_page,
        per_page: pendingDocs.per_page,
        total: pendingDocs.total,
        from: pendingDocs.from,
        to: pendingDocs.to,
      },
      // Pagination metadata untuk processed_documents
      processed_documents_pagination: {
        current_page: processedDocs.current_page,
        last_page: processedDocs.last_page,
        per_page: processedDocs.per_page,
        total: processedDocs.total,
        from: processedDocs.from,
        to: processedDocs.to,
      },
    };
  },

  async getDocument(id: number) {
    const response = await api.get<SingleDocumentResponse>(`/documents/${id}`);
    return response.data.data;
  },

  /**
   * Buat dokumen baru
   * Mendukung JSON biasa atau FormData (file upload)
   */
  async createDocument(data: CreateDocumentData | FormData): Promise<Document> {
    const headers =
      data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};

    const response = await api.post<SingleDocumentResponse>(
      '/documents',
      data,
      { headers },
    );
    return response.data.data;
  },

  /**
   * Update dokumen
   * Menangani logika '_method: PUT' untuk FormData di Laravel
   */
  async updateDocument(
    id: number,
    data: UpdateDocumentData | FormData,
  ): Promise<Document> {
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      const response = await api.post<SingleDocumentResponse>(
        `/documents/${id}`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return response.data.data;
    }

    const response = await api.put<SingleDocumentResponse>(
      `/documents/${id}`,
      data,
    );
    return response.data.data;
  },

  // --- WORKFLOW ACTIONS ---

  async submitDocument(id: number): Promise<Document> {
    const response = await api.post<SingleDocumentResponse>(
      `/documents/${id}/submit`,
    );
    return response.data.data;
  },

  async approveDocument(
    id: number,
    signature: string,
    note?: string,
  ): Promise<Document> {
    const response = await api.post<SingleDocumentResponse>(
      `/documents/${id}/approve`,
      { signature, note },
    );
    return response.data.data;
  },

  async rejectDocument(id: number, note: string): Promise<Document> {
    const response = await api.post<SingleDocumentResponse>(
      `/documents/${id}/reject`,
      { note },
    );
    return response.data.data;
  },

  async reviseDocument(
    id: number,
    targetUserId: number,
    note: string,
  ): Promise<Document> {
    const response = await api.post<SingleDocumentResponse>(
      `/documents/${id}/revise`,
      {
        target_user_id: targetUserId,
        note,
      },
    );
    return response.data.data;
  },

  // --- GENERATE FILES ---

  async generateExecutiveSummary(documentId: number) {
    const response = await api.post<{
      data: { file_path: string; download_url: string };
    }>(`/documents/${documentId}/generate/executive-summary`);
    return response.data.data;
  },

  async generateApprovalSheet(documentId: number) {
    const response = await api.post<{
      data: { file_path: string; download_url: string };
    }>(`/documents/${documentId}/generate/approval-sheet`);
    return response.data.data;
  },

  // --- UTILITIES ---

  /**
   * Helper untuk mendownload file binary (PDF/Docx)
   * Menangani Blob creation dan revocation untuk mencegah memory leak
   */
  async downloadFileBlob(url: string, filename: string) {
    try {
      const response = await api.get(url, { responseType: 'blob' });

      // Cek apakah server mengembalikan JSON error alih-alih file (Edge case)
      if (response.data.type === 'application/json') {
        throw new Error('Gagal mengunduh: File tidak ditemukan atau rusak.');
      }

      const href = URL.createObjectURL(response.data);

      // Buat elemen anchor invisible
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', filename);
      document.body.appendChild(link);

      // Trigger click
      link.click();

      // Cleanup DOM & Memory
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (error) {
      console.error('Download error:', error);
      throw error; // Lempar error agar bisa ditangkap UI (Toast notif)
    }
  },
};

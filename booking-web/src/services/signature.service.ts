import api from '@/lib/axios';

export interface Signature {
  id: number;
  user_id: number;
  signature: string; // path to signature file in storage
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface SignatureResponse {
  success: boolean;
  data?: Signature;
  message?: string;
}

class SignatureService {
  /**
   * Get authenticated user's signature
   */
  async getSignature(): Promise<Signature | null> {
    try {
      const response = await api.get<SignatureResponse>('/signs');
      return response.data.data || null;
    } catch (error: any) {
      console.error('❌ [SignatureService] Error fetching signature:', error);
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Upload a new signature
   */
  async uploadSignature(signatureFile: File): Promise<Signature> {
    const formData = new FormData();
    formData.append('signature', signatureFile);

    const response = await api.post<SignatureResponse>('/signs', formData);
    if (!response.data.data) {
      throw new Error('Upload tanda tangan gagal: data tidak ditemukan dalam respons server.');
    }
    return response.data.data;
  }

  /**
   * Update existing signature
   */
  async updateSignature(id: number, signatureFile: File): Promise<Signature> {
    const formData = new FormData();
    formData.append('signature', signatureFile);
    formData.append('_method', 'PUT'); // Force Laravel to treat this as partial update

    const response = await api.post<SignatureResponse>(`/signs/${id}`, formData);
    if (!response.data.data) {
      throw new Error('Update tanda tangan gagal: data tidak ditemukan dalam respons server.');
    }
    return response.data.data;
  }

  /**
   * Delete signature
   */
  async deleteSignature(id: number): Promise<void> {
    await api.delete(`/signs/${id}`);
  }

  /**
   * Get signature file URL (for preview)
   * Returns blob URL that can be used in <img> tag
   */
  /**
   * Get signature file URL (for preview)
   * If `signatureId` is provided, include it as a query param so the backend
   * can return the specific file for that signature (if supported).
   */
  async getSignatureFileUrl(signatureId?: number): Promise<string | null> {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const endpoint = signatureId
        ? `/signs/file?signature_id=${encodeURIComponent(String(signatureId))}&_t=${timestamp}`
        : `/signs/file?_t=${timestamp}`;
      const response = await api.get(endpoint, {
        responseType: 'blob',
      });
      const blob = response.data;
      return URL.createObjectURL(blob);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

export const signatureService = new SignatureService();

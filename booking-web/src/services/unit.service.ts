export const UNIT_CATEGORIES = [
  { value: 'FAKULTAS', label: 'Fakultas' },
  { value: 'DEPARTEMEN', label: 'Departemen' },
  { value: 'HMD', label: 'Himpunan Mahasiswa (HMD)' },
  { value: 'BEM', label: 'BEM' },
  { value: 'SENAT', label: 'Senat Mahasiswa' },
  { value: 'UKM', label: 'UKM' },
] as const;

export type UnitCategory = (typeof UNIT_CATEGORIES)[number]['value'];

import api from '@/lib/axios';

export interface Unit {
  id: number;
  name: string;
  code: string;
  description?: string;
  category: UnitCategory;
  parent_id?: number;
  parent?: Unit;
  children?: Unit[];
  created_at: string;
  updated_at: string;
}

export interface UnitResponse {
  success: boolean;
  data: Unit[];
}

export interface SingleUnitResponse {
  success: boolean;
  data: Unit;
}

export interface CreateUnitData {
  name: string;
  code: string;
  description?: string;
  category: UnitCategory;
  parent_id?: number;
}

export interface UpdateUnitData {
  name?: string;
  code?: string;
  description?: string;
  category?: UnitCategory;
  parent_id?: number;
}

export const unitService = {
  /**
   * Get all units
   */
  async getUnits(): Promise<Unit[]> {
    const response = await api.get<UnitResponse>('/units');
    // Backend returns plain array (not paginated)
    return response.data.data ?? [];
  },

  /**
   * Get single unit by ID
   */
  async getUnit(id: number): Promise<Unit> {
    const response = await api.get<SingleUnitResponse>(`/units/${id}`);
    return response.data.data;
  },

  /**
   * Create new unit
   */
  async createUnit(data: CreateUnitData): Promise<Unit> {
    const response = await api.post<SingleUnitResponse>('/units', data);
    return response.data.data;
  },

  /**
   * Update unit
   */
  async updateUnit(id: number, data: UpdateUnitData): Promise<Unit> {
    const response = await api.put<SingleUnitResponse>(`/units/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete unit
   */
  async deleteUnit(id: number): Promise<void> {
    await api.delete(`/units/${id}`);
  },
};

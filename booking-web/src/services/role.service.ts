import api from '@/lib/axios';

export interface Role {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface RoleResponse {
  success: boolean;
  data: Role[];
}

export interface SingleRoleResponse {
  success: boolean;
  data: Role;
}

export interface CreateRoleData {
  name: string;
  slug: string;
}

export interface UpdateRoleData {
  name?: string;
  slug?: string;
}

export const roleService = {
  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    const response = await api.get<RoleResponse>('/roles');
    return response.data.data ?? [];
  },

  /**
   * Get single role by ID
   */
  async getRole(id: number): Promise<Role> {
    const response = await api.get<SingleRoleResponse>(`/roles/${id}`);
    return response.data.data;
  },

  /**
   * Create new role
   */
  async createRole(data: CreateRoleData): Promise<Role> {
    const response = await api.post<SingleRoleResponse>('/roles', data);
    return response.data.data;
  },

  /**
   * Update existing role
   */
  async updateRole(id: number, data: UpdateRoleData): Promise<Role> {
    const response = await api.put<SingleRoleResponse>(`/roles/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete role
   */
  async deleteRole(id: number): Promise<void> {
    await api.delete(`/roles/${id}`);
  },
};

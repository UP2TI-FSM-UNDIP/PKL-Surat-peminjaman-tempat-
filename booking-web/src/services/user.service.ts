import api from '@/lib/axios';

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  unit_id: number;
  status?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  role?: {
    id: number;
    name: string;
    slug: string;
  };
  unit?: {
    id: number;
    name: string;
    code: string;
    category: string;
  };
}

export interface UserResponse {
  success: boolean;
  data: {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface SingleUserResponse {
  success: boolean;
  data: User;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role_id: number;
  unit_id: number;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role_id?: number;
  unit_id?: number;
}

export interface PaginatedUserResponse {
  users: User[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const userService = {
  /**
   * Get all users (Paginated)
   */
  async getUsers(params?: {
    role_id?: number | string;
    unit_id?: number | string;
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedUserResponse> {
    // Clean params: convert 'all' strings to undefined
    const cleanParams = { ...params };
    if (cleanParams.role_id === 'all') cleanParams.role_id = undefined;
    if (cleanParams.unit_id === 'all') cleanParams.unit_id = undefined;

    const response = await api.get<UserResponse>('/users', {
      params: cleanParams,
    });

    return {
      users: response.data.data?.data ?? [],
      meta: {
        current_page: response.data.data?.current_page ?? 1,
        last_page: response.data.data?.last_page ?? 1,
        per_page: response.data.data?.per_page ?? 15,
        total: response.data.data?.total ?? 0,
      },
    };
  },

  /**
   * Get single user by ID
   */
  async getUser(id: number): Promise<User> {
    const response = await api.get<SingleUserResponse>(`/users/${id}`);
    return response.data.data;
  },

  /**
   * Create new user
   */
  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post<SingleUserResponse>('/users', data);
    return response.data.data;
  },

  /**
   * Update user
   */
  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const response = await api.put<SingleUserResponse>(`/users/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};

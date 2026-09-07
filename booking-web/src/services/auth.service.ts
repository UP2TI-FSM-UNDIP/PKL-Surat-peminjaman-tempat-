import api from '@/lib/axios';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    nim_nip?: string | null;
    role_id: number;
    unit_id: number;
    role?: {
      id: number;
      name: string;
    };
    unit?: {
      id: number;
      name: string;
      category?: string;
    };
    is_profile_completed: boolean;
  };
  unit_category?: string; // Untuk dynamic workflow selection
}

interface LogoutResponse {
  message: string;
}

export const authService = {
  /**
   * Login dengan email dan password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/login', credentials);
    return response.data;
  },

  /**
   * Register user baru
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/register', data);
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<LogoutResponse> {
    const response = await api.post<LogoutResponse>('/logout');
    return response.data;
  },

  /**
   * Get authenticated user
   */
  async getUser() {
    const response = await api.get('/user');
    return response.data;
  },

  /**
   * Simpan data autentikasi ke localStorage
   */
  saveAuthData(data: LoginResponse): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('userName', data.user.name);
    localStorage.setItem('userId', data.user.id.toString());

    // Simpan NIM/NIP jika ada
    if (data.user.nim_nip) {
      localStorage.setItem('userNim', data.user.nim_nip);
    }

    if (data.user.role) {
      localStorage.setItem('role', data.user.role.name);
      localStorage.setItem('roleId', data.user.role.id.toString());
    }

    if (data.user.unit) {
      localStorage.setItem('userUnit', data.user.unit.name);
      localStorage.setItem('unitId', data.user.unit.id.toString());
    }

    // Simpan unit category untuk dynamic workflow selection
    if (data.unit_category) {
      localStorage.setItem('userUnitCategory', data.unit_category);
    } else if (data.user.unit?.category) {
      localStorage.setItem('userUnitCategory', data.user.unit.category);
    }

    localStorage.setItem('isProfileCompleted', data.user.is_profile_completed ? 'true' : 'false');
  },

  /**
   * Hapus data autentikasi dari localStorage
   */
  clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userNim');
    localStorage.removeItem('role');
    localStorage.removeItem('roleId');
    localStorage.removeItem('userUnit');
    localStorage.removeItem('unitId');
    localStorage.removeItem('userUnitCategory');
    localStorage.removeItem('isProfileCompleted');
  },

  /**
   * Cek apakah user sudah login
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  /**
   * Get role dari localStorage
   */
  getRole(): string | null {
    return localStorage.getItem('role');
  },

  /**
   * Mendapatkan path halaman utama sesuai role
   */
  getRolePath(role: string): string {
    const roleRoutes: Record<string, string> = {
      // Admin & Pimpinan
      Admin: '/admin/',
      'Wakil Dekan 1': '/wadek1/',

      // Staff Fakultas
      Kemahasiswaan: '/kemahasiswaan/',
      'Sumber Daya': '/sumber-daya/',

      // Dosen & Ketua Departemen (approval only, tapi kalau login redirect ke dashboard)
      'Dosen Pendamping Ormawa': '/dosen-pendamping/',
      'Ketua Departemen': '/ketua-departemen/',

      // Ketua Organisasi (BEM, HIMA, UKM ke ketua-ormawa)
      'Ketua Ormawa': '/ketua-ormawa/',

      // Senat punya route sendiri
      Senat: '/senat/',

      // Sekretaris & Mahasiswa -> Peminjam
      Sekretaris: '/peminjam/',
      Peminjam: '/peminjam/',
    };

    return roleRoutes[role] || '/peminjam/'; // Default ke peminjam
  },

  /**
   * Redirect ke halaman sesuai role
   */
  redirectByRole(role: string, navigate?: (options: { to: string }) => void): void {
    const path = this.getRolePath(role);
    
    if (navigate) {
      // Use TanStack Router navigate (automatically handles basepath)
      navigate({ to: path });
    } else {
      // Fallback to window.location (must prefix with BASE_URL for sub-path deployment)
      const baseUrl = import.meta.env.BASE_URL || '/';
      // Ensure we don't double slash
      const fullPath = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path}`;
      window.location.href = fullPath;
    }
  },

  /**
   * Update profile (NIM/NIP, Unit, Role)
   */
  async updateProfile(data: { name: string; nim_nip: string; role_id: number; unit_id: number }) {
    const response = await api.patch('/user/profile', data);
    return response.data;
  },
};

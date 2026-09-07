import api from '@/lib/axios';

export interface DashboardStats {
    pending_approvals: number;
    active_rooms: number;
    total_users: number;
}

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/admin/dashboard/stats');
        return response.data.data;
    },
};

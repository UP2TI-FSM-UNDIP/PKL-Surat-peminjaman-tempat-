import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Clock, DoorOpen, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatCard } from '@/components/common/StatCard';
import BookingCalendar from '@/features/bookings/BookingCalendar';
import {
  dashboardService,
  type DashboardStats,
} from '@/services/dashboard.service';

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Pending Approval',
      value: isLoading ? '...' : stats?.pending_approvals?.toString() || '0',
      icon: Clock,
      textColor: 'text-yellow-600',
      bgLight: 'bg-yellow-50',
      onClick: () => navigate({ to: '/admin/peminjaman', search: { status: 'PENDING' } as any }),
    },
    {
      title: 'Total Ruangan Aktif',
      value: isLoading ? '...' : stats?.active_rooms?.toString() || '0',
      icon: DoorOpen,
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      onClick: () => navigate({ to: '/admin/rooms' }),
    },
    {
      title: 'Total User',
      value: isLoading ? '...' : stats?.total_users?.toString() || '0',
      icon: Users,
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
      onClick: () => navigate({ to: '/admin/users' }),
    },
  ];

  return (
    <>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600 mt-1'>
          Ringkasan sistem peminjaman ruang FSM
        </p>
      </div>

      <div className='grid grid-cols-3 gap-2 sm:gap-4 mb-8'>
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            textColor={stat.textColor}
            bgLight={stat.bgLight}
            onClick={stat.onClick}
          />
        ))}
      </div>
      <BookingCalendar />
    </>
  );
}

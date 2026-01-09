import { createFileRoute, Outlet } from '@tanstack/react-router';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/shadcn/sidebar';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';

export const Route = createFileRoute('/peminjam')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarTrigger />
      <Outlet />
    </SidebarProvider>
  );
}

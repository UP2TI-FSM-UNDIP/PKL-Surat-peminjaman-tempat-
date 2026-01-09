import { AdminSidebar } from '@/components/layouts/AdminSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/shadcn/sidebar';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarTrigger />
        <Outlet />
      </SidebarProvider>
    </div>
  );
}

import { authService } from '@/services/auth.service';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SideBar, TopBar, getMenuConfig } from '@/layouts';

export const Route = createFileRoute('/peminjam')({
  beforeLoad: ({ location }) => {
    if (!authService.isAuthenticated()) throw redirect({ to: '/' });
    const role = authService.getRole() || '';
    const validPath = authService.getRolePath(role);
    if (!location.pathname.startsWith(validPath.replace(/\/$/, ''))) {
      throw redirect({ to: validPath });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [open, setOpen] = React.useState(false);
  const menuConfig = getMenuConfig('peminjam');

  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className='gap-0'>
      <SideBar
        menuSections={menuConfig.menuSections}
        footerLink={menuConfig.footerLink}
      />
      <main className='flex-1 flex flex-col w-full min-w-0'>
        <TopBar actionLabel='Login' />
        <div className='flex-1 p-6 space-y-6'>
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}

import type { LucideIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar/sidebar';
import { Link, useRouterState } from '@tanstack/react-router';

export type MenuItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export type MenuSection = {
  label: string;
  items: MenuItem[];
};

export type SidebarFooterLink = {
  label: string;
  url: string;
  icon: LucideIcon;
};

type SideBarProps = {
  menuSections: MenuSection[];
  footerLink?: SidebarFooterLink;
};

export function SideBar({ menuSections, footerLink }: SideBarProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='pt-6'>
        <SidebarTrigger className='text-foreground group-data-[collapsible=icon]:ml-0' />
      </SidebarHeader>

      <SidebarContent>
        {menuSections.map((section, index) => (
          <SidebarGroup
            key={section.label}
            className={
              index < menuSections.length - 1
                ? 'border-b border-border pb-4'
                : ''
            }
          >
            <SidebarGroupLabel className='text-muted-foreground uppercase text-xs'>
              {section.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={
                        isActive
                          ? 'bg-primary/20! border-l-4! border-primary! hover:bg-primary/30!'
                          : 'hover:bg-accent/50! hover:border-l-4! hover:border-primary/30!'
                      }
                    >
                      <Link to={item.url}>
                        <item.icon
                          className={
                            isActive
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          }
                        />
                        <span
                          className={
                            isActive
                              ? 'text-foreground! font-semibold!'
                              : 'text-foreground'
                          }
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {footerLink && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className='bg-primary text-primary-foreground hover:bg-primary/90'
              >
                <Link to={footerLink.url}>
                  <footerLink.icon />
                  <span>{footerLink.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

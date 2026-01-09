import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/manajemen-user')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/admin/manajemen-user"!</div>;
}

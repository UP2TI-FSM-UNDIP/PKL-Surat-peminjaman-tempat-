import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/peminjam/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/peminjam/"!</div>;
}

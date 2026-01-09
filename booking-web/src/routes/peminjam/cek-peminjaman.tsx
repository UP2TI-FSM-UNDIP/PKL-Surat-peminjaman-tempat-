import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/peminjam/cek-peminjaman')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/peminjam/cek-peminjaman"!</div>;
}

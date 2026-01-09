import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/peminjaman-ruang')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/peminjaman-ruang"!</div>
}

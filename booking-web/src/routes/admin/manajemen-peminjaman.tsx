import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/manajemen-peminjaman')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/manajemen-peminjaman"!</div>
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/approval_kemahasiswaan')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/approval_kemahasiswaan"!</div>
}

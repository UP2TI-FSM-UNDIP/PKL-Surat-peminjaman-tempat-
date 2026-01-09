import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/approval_sumberdaya')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/approval_sumberdaya"!</div>
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTimeId } from '@/lib/date';
import { summarizePolicyAudit } from '@/lib/policyAudit';
import type { PolicyAudit } from '@/types/booking-policy';

const ACTION_LABELS: Record<PolicyAudit['action'], string> = {
  CREATED: 'Dibuat',
  UPDATED: 'Diperbarui',
  RECALCULATED: 'Dihitung ulang',
};

export function PolicyAuditTable({ audits }: { audits: PolicyAudit[] }) {
  if (audits.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada perubahan kebijakan.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Aksi</TableHead>
          <TableHead>Aktor</TableHead>
          <TableHead>Waktu</TableHead>
          <TableHead>Perubahan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {audits.map((audit) => {
          const summary = summarizePolicyAudit(audit);
          const actor = audit.user?.name ?? (audit.user_id ? `User #${audit.user_id}` : 'Sistem');

          return (
            <TableRow key={audit.id}>
              <TableCell className="align-top">{ACTION_LABELS[audit.action]}</TableCell>
              <TableCell className="align-top">{actor}</TableCell>
              <TableCell className="whitespace-nowrap align-top">
                {formatDateTimeId(audit.created_at)}
              </TableCell>
              <TableCell className="align-top">
                <ul className="space-y-1 text-sm">
                  {summary.map((line, index) => (
                    <li key={`${audit.id}-${index}`}>{line}</li>
                  ))}
                </ul>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-blue-700">
                    Lihat detail
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-gray-50 p-2 text-[11px] leading-relaxed">
                    {JSON.stringify({ before: audit.before_json, after: audit.after_json }, null, 2)}
                  </pre>
                </details>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

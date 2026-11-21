import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { formatDateId } from '@/lib/date';
import { simulatePolicy, validatePolicyDraft } from '@/lib/policyRules';
import type { PolicyDraft } from '@/types/booking-policy';

export function PolicySimulator({ draft }: { draft: PolicyDraft }) {
  const [applicationDate, setApplicationDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [hDate, setHDate] = useState(() => format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const errors = validatePolicyDraft({
    min_booking_days: draft.min_booking_days,
    tiers: draft.tiers ?? [],
  });
  const hasErrors = Object.keys(errors).length > 0;
  const result = simulatePolicy(draft, applicationDate, hDate);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="simulator-application-date">Tanggal pengajuan</Label>
          <DateInput
            id="simulator-application-date"
            value={applicationDate}
            onChange={setApplicationDate}
            aria-label="Tanggal pengajuan"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="simulator-h-date">Tanggal peminjaman (H)</Label>
          <DateInput
            id="simulator-h-date"
            value={hDate}
            onChange={setHDate}
            aria-label="Tanggal peminjaman (H)"
          />
        </div>
      </div>

      {hasErrors ? (
        <p className="text-sm text-destructive">
          Perbaiki tier deadline dulu agar simulasi akurat.
        </p>
      ) : !result.valid ? (
        <p className="text-sm text-destructive">{result.reason}</p>
      ) : (
        <div className="space-y-1 rounded-md border bg-gray-50 p-3 text-sm">
          <p>Diajukan H-{result.daysBefore} sebelum tanggal peminjaman.</p>
          <p>
            Tier yang berlaku: minimal H-{result.tier.min_days_before}
            {result.tier.label ? ` (${result.tier.label})` : ''}.
          </p>
          <p>
            Proposal harus lengkap paling lambat{' '}
            <strong>{formatDateId(result.deadline)}</strong> atau H-{result.tier.deadline_offset}.
          </p>
        </div>
      )}
    </div>
  );
}

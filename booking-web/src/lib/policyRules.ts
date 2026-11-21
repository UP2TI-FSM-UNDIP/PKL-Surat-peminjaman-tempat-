import { differenceInCalendarDays, format, isValid, parseISO, subDays } from 'date-fns';
import type { PolicyDraft } from '@/types/booking-policy';

export function validatePolicyDraft(input: {
  min_booking_days: number;
  tiers: Array<{ min_days_before: number; deadline_offset: number; label?: string | null }>;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.tiers.length === 0) {
    errors.tiers = 'Minimal satu tier.';
    return errors;
  }

  const thresholds = input.tiers.map((tier) => tier.min_days_before);
  const messages: string[] = [];
  if (new Set(thresholds).size !== thresholds.length) {
    messages.push('Threshold tidak boleh duplikat.');
  }

  const last = [...input.tiers].sort((a, b) => a.min_days_before - b.min_days_before)[0];
  if (last.min_days_before !== input.min_booking_days) {
    messages.push('Baris terakhir harus sama dengan minimal hari.');
  }
  if (messages.length > 0) errors.tiers = messages.join(' ');

  input.tiers.forEach((tier, index) => {
    if (tier.deadline_offset < 1 || tier.deadline_offset > tier.min_days_before) {
      errors[`tiers.${index}.deadline_offset`] = `Offset harus 1..${tier.min_days_before}.`;
    }
  });

  return errors;
}

export type PolicySimulation =
  | {
      valid: true;
      daysBefore: number;
      tier: PolicyDraft['tiers'][number];
      deadline: string;
    }
  | { valid: false; reason: string };

export function simulatePolicy(
  draft: PolicyDraft,
  applicationDate: string,
  hDate: string,
): PolicySimulation {
  if (!applicationDate || !hDate) {
    return { valid: false, reason: 'Isi tanggal pengajuan dan tanggal peminjaman.' };
  }

  const application = parseISO(applicationDate);
  const target = parseISO(hDate);
  if (!isValid(application) || !isValid(target)) {
    return { valid: false, reason: 'Tanggal tidak valid.' };
  }

  const daysBefore = differenceInCalendarDays(target, application);
  if (daysBefore < 1) {
    return { valid: false, reason: 'Tanggal pengajuan harus sebelum tanggal peminjaman.' };
  }

  const tiers = [...(draft.tiers ?? [])].sort((a, b) => b.min_days_before - a.min_days_before);
  const tier = tiers.find((item) => daysBefore >= item.min_days_before);
  if (!tier) {
    return {
      valid: false,
      reason: 'Tidak ada tier yang cocok. Pengajuan terlalu dekat dengan tanggal peminjaman.',
    };
  }

  return {
    valid: true,
    daysBefore,
    tier,
    deadline: format(subDays(target, tier.deadline_offset), 'yyyy-MM-dd'),
  };
}

import type { PolicyAudit } from '@/types/booking-policy';

interface TierSnapshot {
  min_days_before: number;
  deadline_offset: number;
  label: string | null;
}

interface PolicySnapshot {
  name?: unknown;
  min_booking_days?: unknown;
  max_dates_per_room?: unknown;
  max_rooms_per_date?: unknown;
  max_total_room_hours?: unknown;
  tiers?: unknown;
}

function readTiers(snapshot: PolicySnapshot): TierSnapshot[] {
  return Array.isArray(snapshot.tiers) ? (snapshot.tiers as TierSnapshot[]) : [];
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

export function summarizePolicyAudit(audit: PolicyAudit): string[] {
  if (audit.action === 'RECALCULATED') {
    const after = audit.after_json as { affected?: unknown[] } | null;
    return [`${after?.affected?.length ?? 0} dokumen dihitung ulang.`];
  }

  if (audit.action === 'CREATED') {
    const after = (audit.after_json ?? {}) as PolicySnapshot;
    return [`Kebijakan dibuat dengan ${readTiers(after).length} tier.`];
  }

  const before = (audit.before_json ?? {}) as PolicySnapshot;
  const after = (audit.after_json ?? {}) as PolicySnapshot;
  const changes: string[] = [];

  const fields: Array<{ key: keyof PolicySnapshot; label: string }> = [
    { key: 'name', label: 'Nama' },
    { key: 'min_booking_days', label: 'Minimal hari' },
    { key: 'max_dates_per_room', label: 'Maks. tanggal per ruang' },
    { key: 'max_rooms_per_date', label: 'Maks. ruang per tanggal' },
    { key: 'max_total_room_hours', label: 'Maks. total jam' },
  ];

  for (const field of fields) {
    if (before[field.key] !== after[field.key]) {
      changes.push(`${field.label}: ${display(before[field.key])} → ${display(after[field.key])}`);
    }
  }

  const beforeTiers = readTiers(before);
  const afterTiers = readTiers(after);
  const beforeByThreshold = new Map(beforeTiers.map((tier) => [tier.min_days_before, tier]));
  const afterByThreshold = new Map(afterTiers.map((tier) => [tier.min_days_before, tier]));

  if (beforeTiers.length !== afterTiers.length) {
    changes.push(`Jumlah tier: ${beforeTiers.length} → ${afterTiers.length}`);
  }

  for (const tier of afterTiers) {
    const previous = beforeByThreshold.get(tier.min_days_before);
    if (!previous) {
      changes.push(`Tier H-${tier.min_days_before} ditambahkan (offset ${tier.deadline_offset})`);
      continue;
    }
    if (previous.deadline_offset !== tier.deadline_offset) {
      changes.push(`Tier H-${tier.min_days_before}: offset ${previous.deadline_offset} → ${tier.deadline_offset}`);
    }
    if ((previous.label ?? '') !== (tier.label ?? '')) {
      changes.push(`Tier H-${tier.min_days_before}: label "${previous.label ?? '-'}" → "${tier.label ?? '-'}"`);
    }
  }

  for (const tier of beforeTiers) {
    if (!afterByThreshold.has(tier.min_days_before)) {
      changes.push(`Tier H-${tier.min_days_before} dihapus`);
    }
  }

  return changes.length > 0 ? changes : ['Tidak ada perubahan nilai.'];
}

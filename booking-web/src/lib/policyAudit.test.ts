import { describe, expect, it } from 'vitest';
import { summarizePolicyAudit } from './policyAudit';
import type { PolicyAudit } from '@/types/booking-policy';

const base: PolicyAudit = {
  id: 1,
  booking_policy_id: 1,
  user_id: 1,
  action: 'UPDATED',
  before_json: null,
  after_json: null,
  created_at: '2026-11-21T06:14:33.000000Z',
};

describe('summarizePolicyAudit', () => {
  it('meringkas perubahan nama dan tier', () => {
    const summary = summarizePolicyAudit({
      ...base,
      before_json: {
        name: 'Kebijakan Lama',
        min_booking_days: 1,
        tiers: [{ min_days_before: 15, deadline_offset: 14, label: 'H-15 atau lebih' }],
      },
      after_json: {
        name: 'Kebijakan Baru',
        min_booking_days: 1,
        tiers: [{ min_days_before: 15, deadline_offset: 13, label: 'H-15' }],
      },
    });

    expect(summary).toContain('Nama: Kebijakan Lama → Kebijakan Baru');
    expect(summary).toContain('Tier H-15: offset 14 → 13');
    expect(summary).toContain('Tier H-15: label "H-15 atau lebih" → "H-15"');
  });

  it('meringkas tier yang ditambahkan dan dihapus', () => {
    const summary = summarizePolicyAudit({
      ...base,
      before_json: {
        tiers: [{ min_days_before: 15, deadline_offset: 14, label: null }],
      },
      after_json: {
        tiers: [
          { min_days_before: 15, deadline_offset: 14, label: null },
          { min_days_before: 7, deadline_offset: 6, label: null },
        ],
      },
    });

    expect(summary).toContain('Jumlah tier: 1 → 2');
    expect(summary).toContain('Tier H-7 ditambahkan (offset 6)');
  });

  it('meringkas pembuatan kebijakan', () => {
    const summary = summarizePolicyAudit({
      ...base,
      action: 'CREATED',
      after_json: {
        tiers: [
          { min_days_before: 15, deadline_offset: 14, label: null },
          { min_days_before: 1, deadline_offset: 1, label: null },
        ],
      },
    });

    expect(summary).toEqual(['Kebijakan dibuat dengan 2 tier.']);
  });

  it('meringkas hitung ulang', () => {
    const summary = summarizePolicyAudit({
      ...base,
      action: 'RECALCULATED',
      after_json: { affected: [{ document_id: 1 }, { document_id: 2 }, { document_id: 3 }] },
    });

    expect(summary).toEqual(['3 dokumen dihitung ulang.']);
  });

  it('menampilkan pesan saat tidak ada perubahan nilai', () => {
    const snapshot = { name: 'Sama', tiers: [{ min_days_before: 1, deadline_offset: 1, label: null }] };
    const summary = summarizePolicyAudit({
      ...base,
      before_json: snapshot,
      after_json: snapshot,
    });

    expect(summary).toEqual(['Tidak ada perubahan nilai.']);
  });
});

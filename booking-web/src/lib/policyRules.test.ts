import { describe, expect, it } from 'vitest';
import { simulatePolicy, validatePolicyDraft } from './policyRules';
import type { PolicyDraft } from '@/types/booking-policy';

const draft: PolicyDraft = {
  name: 'Kebijakan Peminjaman',
  min_booking_days: 1,
  max_dates_per_room: 10,
  max_rooms_per_date: 5,
  max_total_room_hours: null,
  tiers: [
    { min_days_before: 15, deadline_offset: 14, label: 'H-15 atau lebih' },
    { min_days_before: 10, deadline_offset: 9, label: 'H-14 s.d. H-10' },
    { min_days_before: 6, deadline_offset: 5, label: 'H-9 s.d. H-6' },
    { min_days_before: 1, deadline_offset: 1, label: 'H-5 s.d. H-1' },
  ],
};

function expectValid(result: ReturnType<typeof simulatePolicy>) {
  expect(result.valid).toBe(true);
  if (!result.valid) throw new Error(result.reason);
  return result;
}

describe('validatePolicyDraft', () => {
  it('menolak threshold duplikat', () => {
    const errors = validatePolicyDraft({
      min_booking_days: 1,
      tiers: [
        { min_days_before: 10, deadline_offset: 9, label: null },
        { min_days_before: 10, deadline_offset: 5, label: null },
      ],
    });
    expect(errors.tiers).toContain('duplikat');
  });

  it('menolak baris terakhir tidak sama dengan min_booking_days', () => {
    const errors = validatePolicyDraft({
      min_booking_days: 1,
      tiers: [{ min_days_before: 5, deadline_offset: 4, label: null }],
    });
    expect(errors.tiers).toContain('terakhir');
  });

  it('menolak offset di luar rentang', () => {
    const errors = validatePolicyDraft({
      min_booking_days: 1,
      tiers: [
        { min_days_before: 5, deadline_offset: 6, label: null },
        { min_days_before: 1, deadline_offset: 1, label: null },
      ],
    });
    expect(errors['tiers.0.deadline_offset']).toContain('1..5');
  });
});

describe('simulatePolicy', () => {
  it('memilih tier 15/14 untuk pengajuan H-20', () => {
    const result = expectValid(simulatePolicy(draft, '2026-12-01', '2026-12-21'));
    expect(result.daysBefore).toBe(20);
    expect(result.tier.min_days_before).toBe(15);
    expect(result.tier.deadline_offset).toBe(14);
    expect(result.deadline).toBe('2026-12-07');
  });

  it('memilih tier 10/9 untuk pengajuan H-12', () => {
    const result = expectValid(simulatePolicy(draft, '2026-12-01', '2026-12-13'));
    expect(result.daysBefore).toBe(12);
    expect(result.tier.min_days_before).toBe(10);
    expect(result.deadline).toBe('2026-12-04');
  });

  it('memilih tier 6/5 untuk pengajuan H-7', () => {
    const result = expectValid(simulatePolicy(draft, '2026-12-01', '2026-12-08'));
    expect(result.daysBefore).toBe(7);
    expect(result.tier.min_days_before).toBe(6);
    expect(result.deadline).toBe('2026-12-03');
  });

  it('memilih tier 1/1 untuk pengajuan H-3', () => {
    const result = expectValid(simulatePolicy(draft, '2026-12-01', '2026-12-04'));
    expect(result.daysBefore).toBe(3);
    expect(result.tier.min_days_before).toBe(1);
    expect(result.deadline).toBe('2026-12-03');
  });

  it('menolak tanggal pengajuan setelah tanggal peminjaman', () => {
    const result = simulatePolicy(draft, '2026-12-10', '2026-12-08');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain('sebelum');
  });

  it('menolak jika tidak ada tier yang cocok', () => {
    const result = simulatePolicy(
      { ...draft, tiers: [{ min_days_before: 15, deadline_offset: 14, label: null }] },
      '2026-12-01',
      '2026-12-05',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain('Tidak ada tier');
  });

  it('meminta kedua tanggal diisi', () => {
    const result = simulatePolicy(draft, '', '2026-12-08');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain('Isi tanggal');
  });
});

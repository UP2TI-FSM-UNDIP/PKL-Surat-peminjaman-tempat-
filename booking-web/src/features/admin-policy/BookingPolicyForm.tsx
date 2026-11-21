import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { bookingPolicyService } from '@/services/booking-policy.service';
import { validatePolicyDraft } from '@/lib/policyRules';
import { getErrorMessage } from '@/lib/errors';
import type { PolicyDraft } from '@/types/booking-policy';
import { PolicyTierEditor } from './PolicyTierEditor';
import { PolicySimulator } from './PolicySimulator';
import { PolicyAuditTable } from './PolicyAuditTable';

export function BookingPolicyForm() {
  const queryClient = useQueryClient();
  const policyQuery = useQuery({ queryKey: ['booking-policy'], queryFn: () => bookingPolicyService.get() });
  const auditsQuery = useQuery({ queryKey: ['booking-policy-audits', 1], queryFn: () => bookingPolicyService.audits(1) });
  const { register, control, reset, handleSubmit, formState: { isDirty } } = useForm<PolicyDraft>({
    defaultValues: {
      name: 'Kebijakan Peminjaman', min_booking_days: 1, max_dates_per_room: 10,
      max_rooms_per_date: 5, max_total_room_hours: null, tiers: [],
    },
  });
  const draft = useWatch({ control }) as PolicyDraft;
  const [recalc, setRecalc] = useState<{ count: number; affected: Array<{ document_id: number; deadline: string }> } | null>(null);
  const hydratedPolicyId = useRef<number | null>(null);

  useEffect(() => {
    if (!policyQuery.data || hydratedPolicyId.current === policyQuery.data.id) return;
    hydratedPolicyId.current = policyQuery.data.id;
    reset({
      name: policyQuery.data.name,
      min_booking_days: policyQuery.data.min_booking_days,
      max_dates_per_room: policyQuery.data.max_dates_per_room,
      max_rooms_per_date: policyQuery.data.max_rooms_per_date,
      max_total_room_hours: policyQuery.data.max_total_room_hours,
      tiers: policyQuery.data.tiers.map((tier) => ({ min_days_before: tier.min_days_before, deadline_offset: tier.deadline_offset, label: tier.label })),
    });
  }, [policyQuery.data, reset]);

  const errors = useMemo(() => validatePolicyDraft({ min_booking_days: draft.min_booking_days, tiers: draft.tiers ?? [] }), [draft.min_booking_days, draft.tiers]);

  const save = useMutation({
    mutationFn: (payload: PolicyDraft) => bookingPolicyService.update(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['booking-policy'] });
      await queryClient.invalidateQueries({ queryKey: ['booking-policy-audits'] });
      await queryClient.invalidateQueries({ queryKey: ['booking-rules'] });
      toast.success('Kebijakan berlaku untuk reservasi baru.');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Gagal menyimpan kebijakan.')),
  });

  const calculate = useMutation({
    mutationFn: (input: { dryRun: boolean; policyId: number }) =>
      bookingPolicyService.recalculate(input.dryRun, input.policyId),
    onSuccess: (result) => {
      if (result.dry_run) setRecalc({ count: result.count, affected: result.affected });
      else {
        setRecalc(null);
        toast.success(`${result.count} dokumen diperbarui.`);
      }
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Gagal menghitung ulang.')),
  });

  if (policyQuery.isLoading) return <p>Memuat kebijakan…</p>;
  if (policyQuery.isError || !policyQuery.data) {
    return (
      <Card>
        <CardHeader><CardTitle>Kebijakan Peminjaman</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-destructive">
            {getErrorMessage(policyQuery.error, 'Gagal memuat kebijakan. Default tidak ditampilkan agar tidak menimpa kebijakan aktif.')}
          </p>
          <Button type="button" variant="outline" onClick={() => void policyQuery.refetch()}>Coba lagi</Button>
        </CardContent>
      </Card>
    );
  }

  const policyId = policyQuery.data.id;
  const recalcDisabled = calculate.isPending || isDirty;
  const invalid = Object.keys(errors).length > 0;

  return (
    <form className="space-y-6" onSubmit={handleSubmit((values) => save.mutate(values))} onChange={() => setRecalc(null)}>
      <h1 className="text-2xl font-semibold">Kebijakan Peminjaman</h1>
      <Card>
        <CardHeader><CardTitle>Parameter</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div><Label htmlFor="name">Nama kebijakan</Label><Input id="name" {...register('name')} /></div>
          <div><Label htmlFor="min_booking_days">Minimal hari</Label><Input id="min_booking_days" type="number" min={1} {...register('min_booking_days', { valueAsNumber: true })} /></div>
          <div><Label htmlFor="max_dates_per_room">Maks. tanggal per ruang</Label><Input id="max_dates_per_room" type="number" min={1} {...register('max_dates_per_room', { valueAsNumber: true })} /></div>
          <div><Label htmlFor="max_rooms_per_date">Maks. ruang per tanggal</Label><Input id="max_rooms_per_date" type="number" min={1} {...register('max_rooms_per_date', { valueAsNumber: true })} /></div>
          <div><Label htmlFor="max_total_room_hours">Maks. total jam (opsional)</Label><Input id="max_total_room_hours" type="number" min={1} {...register('max_total_room_hours', { setValueAs: (value) => value === '' || value == null ? null : Number(value) })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tier deadline</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <PolicyTierEditor control={control} />
          {Object.values(errors).map((error) => <p key={error} className="text-sm text-destructive">{error}</p>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulasi deadline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pilih tanggal pengajuan dan tanggal peminjaman untuk melihat tier dan deadline yang berlaku.
          </p>
        </CardHeader>
        <CardContent>
          <PolicySimulator draft={draft as PolicyDraft} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={invalid || save.isPending}>Simpan</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => calculate.mutate({ dryRun: true, policyId })}
          disabled={recalcDisabled}
        >
          {isDirty ? 'Simpan dulu untuk hitung ulang' : 'Hitung ulang kebijakan'}
        </Button>
        {recalc && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => calculate.mutate({ dryRun: false, policyId })}
            disabled={recalcDisabled}
          >
            Terapkan ke {recalc.count} dokumen
          </Button>
        )}
      </div>
      {recalc && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm text-muted-foreground">{recalc.count} dokumen DRAFT/REVISION akan diperbarui.</p>
          <ul className="max-h-48 space-y-1 overflow-auto text-sm">
            {recalc.affected.map((item) => (
              <li key={item.document_id}>Dokumen #{item.document_id} → deadline {item.deadline}</li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Audit</CardTitle></CardHeader>
        <CardContent><PolicyAuditTable audits={auditsQuery.data?.data ?? []} /></CardContent>
      </Card>
    </form>
  );
}

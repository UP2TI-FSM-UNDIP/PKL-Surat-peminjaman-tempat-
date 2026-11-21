import { Controller, useFieldArray, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import type { PolicyDraft } from '@/types/booking-policy';

const mobileLabelClass = 'mb-1 block text-xs font-medium text-gray-500 md:hidden';

export function PolicyTierEditor({ control }: { control: Control<PolicyDraft> }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'tiers' });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Tier dipilih dari atas ke bawah. Kolom pertama menentukan minimal hari sebelum H agar tier berlaku. Kolom kedua menentukan batas melengkapi proposal, dihitung mundur dari H. Kolom ketiga hanya nama tier dan tidak memengaruhi perhitungan.
      </p>

      <div className="space-y-2">
        <div className="hidden gap-2 text-xs font-medium text-gray-500 md:grid md:grid-cols-[1fr_1fr_1fr_44px]">
          <span>Minimal hari sebelum H</span>
          <span>Batas proposal (H-)</span>
          <span>Label tier (opsional)</span>
          <span aria-hidden="true" />
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_44px]">
            <div>
              <Label htmlFor={`tier-${index}-min-days`} className={mobileLabelClass}>
                Minimal hari sebelum H
              </Label>
              <Controller
                control={control}
                name={`tiers.${index}.min_days_before`}
                render={({ field: input }) => (
                  <Input id={`tier-${index}-min-days`} aria-label={`Minimal hari tier ${index + 1}`} type="number" min={1} value={input.value} onChange={(event) => input.onChange(Number(event.target.value))} />
                )}
              />
            </div>

            <div>
              <Label htmlFor={`tier-${index}-deadline-offset`} className={mobileLabelClass}>
                Batas proposal (H-)
              </Label>
              <Controller
                control={control}
                name={`tiers.${index}.deadline_offset`}
                render={({ field: input }) => (
                  <Input id={`tier-${index}-deadline-offset`} aria-label={`Offset tier ${index + 1}`} type="number" min={1} value={input.value} onChange={(event) => input.onChange(Number(event.target.value))} />
                )}
              />
            </div>

            <div>
              <Label htmlFor={`tier-${index}-label`} className={mobileLabelClass}>
                Label tier (opsional)
              </Label>
              <Controller
                control={control}
                name={`tiers.${index}.label`}
                render={({ field: input }) => (
                  <Input id={`tier-${index}-label`} aria-label={`Label tier ${index + 1}`} placeholder="Contoh: H-15 atau lebih" value={input.value ?? ''} onChange={input.onChange} />
                )}
              />
            </div>

            <Button type="button" variant="ghost" size="icon" aria-label={`Hapus tier ${index + 1}`} onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={() => append({ min_days_before: 1, deadline_offset: 1, label: null })}>Tambah tier</Button>
      </div>
    </div>
  );
}

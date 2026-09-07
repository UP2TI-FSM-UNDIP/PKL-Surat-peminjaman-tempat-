export const categories = [
  { value: 'HIMA', label: 'HIMA' },
  { value: 'UKM', label: 'UKM' },
  { value: 'KOMUNITAS', label: 'Komunitas' },
  { value: 'FAKULTAS', label: 'Fakultas' },
] as const;

export const scopeTypes = [
  {
    value: 'SELF',
    label: 'Unit Sendiri',
    description: 'Approval dalam unit yang sama',
  },
  {
    value: 'PARENT',
    label: 'Unit Parent',
    description: 'Approval ke unit parent',
  },
  {
    value: 'FACULTY_LEADER',
    label: 'Pimpinan Fakultas',
    description: 'Approval ke pimpinan fakultas',
  },
  {
    value: 'SPECIFIC_CATEGORY',
    label: 'Kategori Spesifik',
    description: 'Approval ke kategori tertentu',
  },
] as const;

export type CategoryValue = (typeof categories)[number]['value'];
export type ScopeTypeValue = (typeof scopeTypes)[number]['value'];

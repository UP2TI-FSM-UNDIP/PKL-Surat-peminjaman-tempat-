import { useState } from 'react';
import { Tag, Plus, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface PlaceholderInfo {
  key: string;
  description: string;
  example: string;
}

interface PlaceholderManagerProps {
  placeholders: string[];
  onSave?: (placeholderMappings: PlaceholderInfo[]) => void;
}

// Default placeholder suggestions
const DEFAULT_PLACEHOLDERS: Record<string, PlaceholderInfo> = {
  '{{nama}}': {
    key: '{{nama}}',
    description: 'Nama lengkap ketua pelaksana',
    example: 'John Doe',
  },
  '{{nim}}': {
    key: '{{nim}}',
    description: 'NIM ketua pelaksana',
    example: '123456789',
  },
  '{{hp}}': {
    key: '{{hp}}',
    description: 'Nomor HP ketua pelaksana',
    example: '081234567890',
  },
  '{{tanggal}}': {
    key: '{{tanggal}}',
    description: 'Tanggal acara',
    example: '31 Januari 2026',
  },
  '{{waktu_mulai}}': {
    key: '{{waktu_mulai}}',
    description: 'Waktu mulai acara',
    example: '09:00',
  },
  '{{waktu_selesai}}': {
    key: '{{waktu_selesai}}',
    description: 'Waktu selesai acara',
    example: '11:00',
  },
  '{{ruangan}}': {
    key: '{{ruangan}}',
    description: 'Nama ruangan',
    example: 'Ruang Sidang FSM',
  },
  '{{kegiatan}}': {
    key: '{{kegiatan}}',
    description: 'Nama kegiatan/acara',
    example: 'Seminar Teknologi',
  },
  '{{organisasi}}': {
    key: '{{organisasi}}',
    description: 'Nama organisasi peminjam',
    example: 'HIMA TIF',
  },
  '{{ttd_ketua}}': {
    key: '{{ttd_ketua}}',
    description: 'Placeholder untuk tanda tangan ketua',
    example: '[Gambar TTD]',
  },
  '{{ttd_pembimbing}}': {
    key: '{{ttd_pembimbing}}',
    description: 'Placeholder untuk tanda tangan pembimbing',
    example: '[Gambar TTD]',
  },
};

export function PlaceholderManager({
  placeholders,
  onSave,
}: PlaceholderManagerProps) {
  const [placeholderInfos, setPlaceholderInfos] = useState<PlaceholderInfo[]>(
    () => {
      return placeholders.map((placeholder) => {
        const defaultInfo = DEFAULT_PLACEHOLDERS[placeholder];
        return (
          defaultInfo || {
            key: placeholder,
            description: '',
            example: '',
          }
        );
      });
    }
  );

  const [newPlaceholder, setNewPlaceholder] = useState({
    key: '',
    description: '',
    example: '',
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const handleUpdatePlaceholder = (
    index: number,
    field: keyof PlaceholderInfo,
    value: string
  ) => {
    const updated = [...placeholderInfos];
    updated[index] = { ...updated[index], [field]: value };
    setPlaceholderInfos(updated);
  };

  const handleRemovePlaceholder = (index: number) => {
    const updated = placeholderInfos.filter((_, i) => i !== index);
    setPlaceholderInfos(updated);
  };

  const handleAddPlaceholder = () => {
    if (!newPlaceholder.key.trim()) return;

    // Ensure placeholder format
    let key = newPlaceholder.key.trim();
    if (!key.startsWith('{{')) key = '{{' + key;
    if (!key.endsWith('}}')) key = key + '}}';

    setPlaceholderInfos([
      ...placeholderInfos,
      {
        key,
        description: newPlaceholder.description,
        example: newPlaceholder.example,
      },
    ]);

    setNewPlaceholder({ key: '', description: '', example: '' });
    setShowAddForm(false);
  };

  const handleSave = () => {
    onSave?.(placeholderInfos);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Tag className='w-5 h-5 text-blue-600' />
          <h3 className='font-semibold text-gray-900'>Manajemen Placeholder</h3>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className='w-4 h-4 mr-2' />
          Tambah Placeholder
        </Button>
      </div>

      <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2'>
        <Info className='w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0' />
        <p className='text-xs text-blue-700'>
          Placeholder adalah variabel yang akan diganti dengan data peminjam saat
          dokumen di-generate. Format: <code className='bg-blue-100 px-1 rounded'>{'{{nama_variabel}}'}</code>
        </p>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className='bg-gray-50 border rounded-lg p-4 space-y-3'>
          <h4 className='font-medium text-sm text-gray-900'>Tambah Placeholder Baru</h4>
          <div className='grid grid-cols-1 gap-3'>
            <div>
              <label className='text-xs font-medium text-gray-700 mb-1 block'>
                Key Placeholder
              </label>
              <Input
                placeholder='Contoh: nama, nim, tanggal'
                value={newPlaceholder.key}
                onChange={(e) =>
                  setNewPlaceholder({ ...newPlaceholder, key: e.target.value })
                }
              />
              <p className='text-xs text-gray-500 mt-1'>
                Akan otomatis dibungkus dengan {'{{ }}'} jika belum ada
              </p>
            </div>
            <div>
              <label className='text-xs font-medium text-gray-700 mb-1 block'>
                Deskripsi
              </label>
              <Input
                placeholder='Apa yang digantikan placeholder ini?'
                value={newPlaceholder.description}
                onChange={(e) =>
                  setNewPlaceholder({
                    ...newPlaceholder,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className='text-xs font-medium text-gray-700 mb-1 block'>
                Contoh
              </label>
              <Input
                placeholder='Contoh nilai yang akan diisi'
                value={newPlaceholder.example}
                onChange={(e) =>
                  setNewPlaceholder({ ...newPlaceholder, example: e.target.value })
                }
              />
            </div>
          </div>
          <div className='flex gap-2'>
            <Button size='sm' onClick={handleAddPlaceholder}>
              Tambah
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                setShowAddForm(false);
                setNewPlaceholder({ key: '', description: '', example: '' });
              }}
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Placeholder List */}
      <div className='space-y-3'>
        {placeholderInfos.length === 0 ? (
          <div className='text-center py-8 bg-gray-50 rounded-lg border border-dashed'>
            <Tag className='w-8 h-8 text-gray-400 mx-auto mb-2' />
            <p className='text-sm text-gray-500'>
              Belum ada placeholder. Tambahkan placeholder untuk mendokumentasikan
              variabel dalam template.
            </p>
          </div>
        ) : (
          placeholderInfos.map((info, index) => (
            <div
              key={index}
              className='bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow'
            >
              <div className='flex items-start justify-between mb-3'>
                <code className='text-sm font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded'>
                  {info.key}
                </code>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleRemovePlaceholder(index)}
                  className='h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                >
                  <X className='w-4 h-4' />
                </Button>
              </div>

              <div className='space-y-2'>
                <div>
                  <label className='text-xs font-medium text-gray-700 mb-1 block'>
                    Deskripsi
                  </label>
                  <Textarea
                    placeholder='Jelaskan kegunaan placeholder ini...'
                    value={info.description}
                    onChange={(e) =>
                      handleUpdatePlaceholder(index, 'description', e.target.value)
                    }
                    rows={2}
                    className='text-sm'
                  />
                </div>

                <div>
                  <label className='text-xs font-medium text-gray-700 mb-1 block'>
                    Contoh Nilai
                  </label>
                  <Input
                    placeholder='Contoh: John Doe, 123456, dst.'
                    value={info.example}
                    onChange={(e) =>
                      handleUpdatePlaceholder(index, 'example', e.target.value)
                    }
                    className='text-sm'
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save Button */}
      {onSave && placeholderInfos.length > 0 && (
        <div className='flex justify-end pt-4 border-t'>
          <Button onClick={handleSave}>Simpan Dokumentasi Placeholder</Button>
        </div>
      )}

      {/* Common Placeholders Reference */}
      <details className='bg-gray-50 border rounded-lg p-4'>
        <summary className='cursor-pointer font-medium text-sm text-gray-900'>
          Referensi Placeholder Umum
        </summary>
        <div className='mt-3 space-y-2'>
          {Object.values(DEFAULT_PLACEHOLDERS).map((placeholder) => (
            <div
              key={placeholder.key}
              className='text-xs bg-white p-2 rounded border'
            >
              <code className='font-mono text-blue-600 font-semibold'>
                {placeholder.key}
              </code>
              <p className='text-gray-600 mt-1'>{placeholder.description}</p>
              <p className='text-gray-400 mt-0.5'>
                Contoh: {placeholder.example}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

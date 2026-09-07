import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '@/lib/axios';
import { unitService, type Unit } from '@/services/unit.service';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/admin/units/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'FAKULTAS' | 'PRODI' | 'HIMA'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form states
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'PRODI' as 'FAKULTAS' | 'PRODI' | 'HIMA',
    parent_id: undefined as number | undefined,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [unitUsers, setUnitUsers] = useState<any[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter units based on search and category
  useEffect(() => {
    let filtered = units;

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (unit) =>
          unit.name.toLowerCase().includes(query) ||
          unit.code.toLowerCase().includes(query) ||
          unit.description?.toLowerCase().includes(query),
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((unit) => unit.category === selectedCategory);
    }

    setFilteredUnits(filtered);
  }, [debouncedSearchQuery, units, selectedCategory]);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setIsFetching(true);
      setError(null);
      const data = await unitService.getUnits();
      setUnits(data);
    } catch (err) {
      console.error('Failed to fetch units:', err);
      const error = err as AxiosError<{ message: string }>;
      setError(
        error.response?.data?.message ||
        'Gagal memuat data unit. Silakan coba lagi.',
      );
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'PRODI',
      parent_id: undefined,
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      code: unit.code,
      description: unit.description || '',
      category: unit.category,
      parent_id: unit.parent_id,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleDelete = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsDeleteDialogOpen(true);
  };

  const handleDetail = async (unit: Unit) => {
    setSelectedUnit(unit);
    setIsDetailModalOpen(true);
    setIsLoadingUsers(true);

    try {
      const response = await api.get(`/users?unit_id=${unit.id}`);
      setUnitUsers(response.data.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUnitUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Nama dan kode harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await unitService.createUnit({
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        category: formData.category,
        parent_id: formData.parent_id,
      });
      setIsCreateModalOpen(false);
      fetchUnits();
    } catch (err) {
      console.error('Failed to create unit:', err);
      const error = err as AxiosError<{ message: string }>;
      setFormError(
        error.response?.data?.message ||
        'Gagal membuat unit. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedUnit) return;

    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Nama dan kode harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await unitService.updateUnit(selectedUnit.id, {
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        category: formData.category,
        parent_id: formData.parent_id,
      });
      setIsEditModalOpen(false);
      fetchUnits();
    } catch (err) {
      console.error('Failed to update unit:', err);
      const error = err as AxiosError<{ message: string }>;
      setFormError(
        error.response?.data?.message ||
        'Gagal mengupdate unit. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUnit) return;

    try {
      await unitService.deleteUnit(selectedUnit.id);
      setIsDeleteDialogOpen(false);
      fetchUnits();
    } catch (err) {
      console.error('Failed to delete unit:', err);
      const error = err as AxiosError<{ message: string }>;
      alert(
        error.response?.data?.message ||
        'Gagal menghapus unit. Silakan coba lagi.',
      );
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      FAKULTAS: 'bg-blue-100 text-blue-700',
      PRODI: 'bg-green-100 text-green-700',
      HIMA: 'bg-purple-100 text-purple-700',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[category as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}
      >
        {category}
      </span>
    );
  };

  if (isInitialLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600 font-medium'>Memuat data unit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={fetchUnits}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 py-2 sm:py-4'>
      {/* Header */}
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2'>
          Manajemen Unit
        </h1>
        <p className='text-sm sm:text-base text-gray-600'>
          Kelola unit organisasi dalam sistem
        </p>
      </div>

      <div className='mb-6 space-y-4'>
        {/* Search & Add Button Row */}
        <div className='flex items-center gap-2 w-full'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              type='text'
              placeholder='Cari unit...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10 text-sm h-11 border-gray-200 focus:ring-blue-500 rounded-xl shadow-sm w-full bg-white'
            />
          </div>
          <Button
            onClick={handleCreate}
            className='whitespace-nowrap h-11 px-6 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm flex items-center gap-2'
          >
            <Plus className='h-5 w-5' />
            <span>Tambah Unit</span>
          </Button>
        </div>

        {/* Filters Row - Chips */}
        <div className='flex flex-col md:flex-row items-start md:items-center gap-4 pt-1'>
          <div className='flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide max-w-full'>
            {[
              { id: 'all', label: 'Semua Kategori' },
              { id: 'FAKULTAS', label: 'Fakultas' },
              { id: 'PRODI', label: 'Program Studi' },
              { id: 'HIMA', label: 'Himpunan Mahasiswa' }
            ].map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                  }`}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative'>
        {/* Subtle Loading Overlay for Updates */}
        {isFetching && !isInitialLoading && (
          <div className='absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center text-center'>
            <div className='bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-gray-100'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              <span className='text-xs font-medium text-gray-600'>Memperbarui data...</span>
            </div>
          </div>
        )}
        <div className='overflow-x-auto max-w-full'>
          <Table className='w-full min-w-[640px]'>
            <TableHeader>
              <TableRow>
                <TableHead className='hidden sm:table-cell w-8 sm:w-12 text-center text-xs sm:text-sm'>ID</TableHead>
                <TableHead className='text-xs sm:text-sm w-[25%]'>Nama Unit</TableHead>
                <TableHead className='hidden md:table-cell text-xs sm:text-sm w-[15%]'>Kode</TableHead>
                <TableHead className='hidden lg:table-cell text-xs sm:text-sm w-[15%]'>Kategori</TableHead>
                <TableHead className='hidden xl:table-cell text-xs sm:text-sm w-[20%]'>Parent Unit</TableHead>
                <TableHead className='hidden lg:table-cell text-xs sm:text-sm w-[12%]'>Dibuat</TableHead>
                <TableHead className='text-center text-xs sm:text-sm w-20 sm:w-auto'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center text-gray-500 h-32'
                  >
                    {debouncedSearchQuery
                      ? 'Tidak ada unit yang sesuai dengan pencarian'
                      : 'Belum ada unit'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className='hidden sm:table-cell text-center text-xs sm:text-sm py-2 sm:py-3'>
                      {unit.id}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm font-medium text-gray-900 py-2 sm:py-3'>
                      <div>{unit.name}</div>
                      <div className='md:hidden text-[10px] text-gray-500 mt-0.5'>
                        <code className='bg-gray-100 px-1 py-0.5 rounded text-[10px]'>
                          {unit.code}
                        </code>
                      </div>
                      <div className='lg:hidden mt-1'>
                        {getCategoryBadge(unit.category)}
                      </div>
                    </TableCell>
                    <TableCell className='hidden md:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      <code className='bg-gray-100 px-2 py-1 rounded text-xs'>
                        {unit.code}
                      </code>
                    </TableCell>
                    <TableCell className='hidden lg:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {getCategoryBadge(unit.category)}
                    </TableCell>
                    <TableCell className='hidden xl:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {unit.parent?.name || '-'}
                    </TableCell>
                    <TableCell className='hidden lg:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {new Date(unit.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className='py-2 sm:py-3'>
                      <div className='flex items-center justify-center gap-1 sm:gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDetail(unit)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                        >
                          <Eye className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(unit)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                        >
                          <Pencil className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(unit)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Unit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <form onSubmit={handleSubmitCreate}>
            <DialogHeader>
              <DialogTitle>Tambah Unit Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi unit yang akan ditambahkan
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <label htmlFor='name' className='text-sm font-medium'>
                  Nama Unit <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='Contoh: Program Studi Teknik Informatika'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='code' className='text-sm font-medium'>
                  Kode Unit <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='code'
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder='Contoh: PRODI-TI'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='category' className='text-sm font-medium'>
                  Kategori <span className='text-red-500'>*</span>
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as 'FAKULTAS' | 'PRODI' | 'HIMA',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='FAKULTAS'>Fakultas</SelectItem>
                    <SelectItem value='PRODI'>Program Studi</SelectItem>
                    <SelectItem value='HIMA'>Himpunan Mahasiswa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <label htmlFor='parent_id' className='text-sm font-medium'>
                  Parent Unit (Opsional)
                </label>
                <Select
                  value={formData.parent_id?.toString() || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      parent_id: value === 'none' ? undefined : Number(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Pilih parent unit' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>Tidak ada parent</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name} ({unit.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <label htmlFor='description' className='text-sm font-medium'>
                  Deskripsi (Opsional)
                </label>
                <Input
                  id='description'
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='Deskripsi singkat unit'
                />
              </div>
              {formError && <p className='text-sm text-red-600'>{formError}</p>}
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <form onSubmit={handleSubmitEdit}>
            <DialogHeader>
              <DialogTitle>Edit Unit</DialogTitle>
              <DialogDescription>
                Ubah informasi unit yang dipilih
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <label htmlFor='edit-name' className='text-sm font-medium'>
                  Nama Unit <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='edit-name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='Contoh: Program Studi Teknik Informatika'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='edit-code' className='text-sm font-medium'>
                  Kode Unit <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='edit-code'
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder='Contoh: PRODI-TI'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='edit-category' className='text-sm font-medium'>
                  Kategori <span className='text-red-500'>*</span>
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as 'FAKULTAS' | 'PRODI' | 'HIMA',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='FAKULTAS'>Fakultas</SelectItem>
                    <SelectItem value='PRODI'>Program Studi</SelectItem>
                    <SelectItem value='HIMA'>Himpunan Mahasiswa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <label htmlFor='edit-parent_id' className='text-sm font-medium'>
                  Parent Unit (Opsional)
                </label>
                <Select
                  value={formData.parent_id?.toString() || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      parent_id: value === 'none' ? undefined : Number(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Pilih parent unit' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>Tidak ada parent</SelectItem>
                    {units
                      .filter((u) => u.id !== selectedUnit?.id)
                      .map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name} ({unit.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <label
                  htmlFor='edit-description'
                  className='text-sm font-medium'
                >
                  Deskripsi (Opsional)
                </label>
                <Input
                  id='edit-description'
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='Deskripsi singkat unit'
                />
              </div>
              {formError && <p className='text-sm text-red-600'>{formError}</p>}
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Unit Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Detail Unit</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang unit
            </DialogDescription>
          </DialogHeader>
          {selectedUnit && (
            <div className='space-y-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>ID</p>
                  <p className='text-sm text-gray-900'>{selectedUnit.id}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Kategori</p>
                  <div className='mt-1'>
                    {getCategoryBadge(selectedUnit.category)}
                  </div>
                </div>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-500'>Nama Unit</p>
                <p className='text-sm text-gray-900'>{selectedUnit.name}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-500'>Kode Unit</p>
                <p className='text-sm text-gray-900'>
                  <code className='bg-gray-100 px-2 py-1 rounded'>
                    {selectedUnit.code}
                  </code>
                </p>
              </div>
              {selectedUnit.description && (
                <div>
                  <p className='text-sm font-medium text-gray-500'>Deskripsi</p>
                  <p className='text-sm text-gray-900'>
                    {selectedUnit.description}
                  </p>
                </div>
              )}
              {selectedUnit.parent && (
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Parent Unit
                  </p>
                  <p className='text-sm text-gray-900'>
                    {selectedUnit.parent.name} ({selectedUnit.parent.code})
                  </p>
                </div>
              )}
              {selectedUnit.children && selectedUnit.children.length > 0 && (
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Sub-Unit ({selectedUnit.children.length})
                  </p>
                  <ul className='mt-2 space-y-1'>
                    {selectedUnit.children.map((child) => (
                      <li key={child.id} className='text-sm text-gray-900'>
                        • {child.name} ({child.code})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Dibuat</p>
                  <p className='text-sm text-gray-900'>
                    {new Date(selectedUnit.created_at).toLocaleDateString(
                      'id-ID',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      },
                    )}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Diperbarui
                  </p>
                  <p className='text-sm text-gray-900'>
                    {new Date(selectedUnit.updated_at).toLocaleDateString(
                      'id-ID',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      },
                    )}
                  </p>
                </div>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-500 mb-2'>
                  User di Unit Ini
                </p>
                {isLoadingUsers ? (
                  <p className='text-sm text-gray-500'>Memuat...</p>
                ) : unitUsers.length > 0 ? (
                  <ul className='space-y-2'>
                    {unitUsers.map((user) => (
                      <li
                        key={user.id}
                        className='text-sm text-gray-900 flex justify-between items-center p-2 bg-gray-50 rounded'
                      >
                        <span>{user.name}</span>
                        <span className='text-xs text-gray-500'>
                          {user.email}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-sm text-gray-500'>
                    Belum ada user di unit ini
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus unit{' '}
              <strong>{selectedUnit?.name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-red-600 hover:bg-red-700'
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

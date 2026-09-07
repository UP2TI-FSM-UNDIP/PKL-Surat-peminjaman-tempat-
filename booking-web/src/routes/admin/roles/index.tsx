import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '@/lib/axios';
import { roleService, type Role } from '@/services/role.service';
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

export const Route = createFileRoute('/admin/roles/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Detail modal states
  const [roleUsers, setRoleUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch roles
  useEffect(() => {
    fetchRoles();
  }, []);

  // Debounce search query - tunggu 3 detik setelah user berhenti mengetik
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter roles based on debounced search
  useEffect(() => {
    if (debouncedSearchQuery.trim() === '') {
      setFilteredRoles(roles);
    } else {
      const query = debouncedSearchQuery.toLowerCase();
      setFilteredRoles(
        roles.filter(
          (role) =>
            role.name.toLowerCase().includes(query) ||
            role.slug.toLowerCase().includes(query),
        ),
      );
    }
  }, [debouncedSearchQuery, roles]);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await roleService.getRoles();
      setRoles(data);
      setFilteredRoles(data);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      const error = err as AxiosError<{ message: string }>;
      setError(
        error.response?.data?.message ||
        'Gagal memuat data role. Silakan coba lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ name: '', slug: '' });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({ name: role.name, slug: role.slug });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleDelete = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const handleDetail = async (role: Role) => {
    setSelectedRole(role);
    setIsDetailModalOpen(true);
    setIsLoadingUsers(true);

    try {
      const response = await api.get(`/users?role_id=${role.id}`);
      setRoleUsers(response.data.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setRoleUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.slug.trim()) {
      setFormError('Nama dan slug harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await roleService.createRole(formData);
      setIsCreateModalOpen(false);
      fetchRoles();
    } catch (err) {
      console.error('Failed to create role:', err);
      const error = err as AxiosError<{ message: string }>;
      setFormError(
        error.response?.data?.message ||
        'Gagal membuat role. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedRole) return;

    if (!formData.name.trim() || !formData.slug.trim()) {
      setFormError('Nama dan slug harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await roleService.updateRole(selectedRole.id, formData);
      setIsEditModalOpen(false);
      fetchRoles();
    } catch (err) {
      console.error('Failed to update role:', err);
      const error = err as AxiosError<{ message: string }>;
      setFormError(
        error.response?.data?.message ||
        'Gagal mengupdate role. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedRole) return;

    try {
      setIsSubmitting(true);
      await roleService.deleteRole(selectedRole.id);
      setIsDeleteDialogOpen(false);
      fetchRoles();
    } catch (err) {
      console.error('Failed to delete role:', err);
      const error = err as AxiosError<{ message: string }>;
      alert(
        error.response?.data?.message ||
        'Gagal menghapus role. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug:
        prev.slug === ''
          ? value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
          : prev.slug,
    }));
  };

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900'>Manajemen Role</h1>
        <p className='text-gray-600 mt-2'>
          Kelola role pengguna dalam sistem peminjaman tempat
        </p>
      </div>

      {error && (
        <div className='mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md'>
          {error}
        </div>
      )}

      {/* Search and Actions */}
      <div className='mb-6 flex gap-2 sm:gap-4'>
        <div className='relative flex-1 max-w-xs sm:max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            type='text'
            placeholder='Cari role...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <Button onClick={handleCreate} className='whitespace-nowrap'>
          <Plus className='h-4 w-4 mr-2' />
          Tambah Role
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className='flex items-center justify-center h-64'>
          <div className='text-gray-500'>Memuat data...</div>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='hidden sm:table-cell'>ID</TableHead>
                <TableHead>Nama Role</TableHead>
                <TableHead className='hidden md:table-cell'>Slug</TableHead>
                <TableHead className='hidden lg:table-cell'>Dibuat</TableHead>
                <TableHead className='hidden lg:table-cell'>
                  Diperbarui
                </TableHead>
                <TableHead className='text-right'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-center text-gray-500 h-32'
                  >
                    {debouncedSearchQuery
                      ? 'Tidak ada role yang sesuai dengan pencarian'
                      : 'Belum ada role'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className='hidden sm:table-cell text-sm text-gray-900'>
                      {role.id}
                    </TableCell>
                    <TableCell className='text-sm font-medium text-gray-900'>
                      <div>{role.name}</div>
                      <div className='md:hidden text-xs text-gray-500 mt-1'>
                        <code className='bg-gray-100 px-1 py-0.5 rounded'>
                          {role.slug}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell className='hidden md:table-cell text-sm text-gray-500'>
                      <code className='bg-gray-100 px-2 py-1 rounded text-xs'>
                        {role.slug}
                      </code>
                    </TableCell>
                    <TableCell className='hidden lg:table-cell text-sm text-gray-500'>
                      {new Date(role.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className='hidden lg:table-cell text-sm text-gray-500'>
                      {new Date(role.updated_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDetail(role)}
                          title='Lihat Detail'
                        >
                          <Eye className='h-4 w-4 text-blue-600' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(role)}
                          title='Edit'
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(role)}
                          title='Hapus'
                        >
                          <Trash2 className='h-4 w-4 text-red-600' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Role Baru</DialogTitle>
            <DialogDescription>
              Buat role baru untuk sistem peminjaman tempat
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            {formError && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm'>
                {formError}
              </div>
            )}
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nama Role
                </label>
                <Input
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder='Contoh: Admin'
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Slug
                </label>
                <Input
                  type='text'
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder='Contoh: admin'
                  required
                  disabled={isSubmitting}
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Slug digunakan untuk identifier unik (huruf kecil, tanpa
                  spasi)
                </p>
              </div>
            </div>
            <DialogFooter className='mt-6'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsCreateModalOpen(false)}
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Ubah informasi role yang sudah ada
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            {formError && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm'>
                {formError}
              </div>
            )}
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nama Role
                </label>
                <Input
                  type='text'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder='Contoh: Admin'
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Slug
                </label>
                <Input
                  type='text'
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder='Contoh: admin'
                  required
                  disabled={isSubmitting}
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Slug digunakan untuk identifier unik (huruf kecil, tanpa
                  spasi)
                </p>
              </div>
            </div>
            <DialogFooter className='mt-6'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Role</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus role{' '}
              <strong>{selectedRole?.name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Detail Role: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Daftar pengguna yang memiliki role ini
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4'>
            {isLoadingUsers ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-gray-500'>Memuat data pengguna...</div>
              </div>
            ) : roleUsers.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                Tidak ada pengguna dengan role ini
              </div>
            ) : (
              <div className='space-y-3'>
                {roleUsers.map((user) => (
                  <div
                    key={user.id}
                    className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex justify-between items-start'>
                      <div className='flex-1'>
                        <h4 className='font-medium text-gray-900'>
                          {user.name}
                        </h4>
                        <p className='text-sm text-gray-600 mt-1'>
                          {user.email}
                        </p>
                        {user.unit && (
                          <div className='mt-2'>
                            <span className='text-xs text-gray-500'>
                              Unit:{' '}
                            </span>
                            <span className='text-xs font-medium text-gray-700'>
                              {user.unit.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className='ml-4'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {user.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <p className='text-sm text-gray-600'>
                    Total: <strong>{roleUsers.length}</strong> pengguna
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDetailModalOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

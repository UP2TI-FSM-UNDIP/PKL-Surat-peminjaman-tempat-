import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { userService, type User } from '@/services/user.service';
import { roleService, type Role } from '@/services/role.service';
import { unitService, type Unit } from '@/services/unit.service';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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

export const Route = createFileRoute('/admin/users/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('all');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: 0,
    unit_id: 0,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedRoleId, selectedUnitId]);

  const fetchData = async () => {
    try {
      setIsFetching(true);
      setError(null);

      // Fetch users with filters and pagination
      const response = await userService.getUsers({
        page: currentPage,
        search: debouncedSearchQuery,
        role_id: selectedRoleId,
        unit_id: selectedUnitId,
        per_page: 10,
      });

      setUsers(response.users);
      setCurrentPage(response.meta.current_page);
      setTotalPages(response.meta.last_page);
      setTotalItems(response.meta.total);

      // Fetch roles and units (only if empty)
      if (roles.length === 0 || units.length === 0) {
        const [rolesData, unitsData] = await Promise.all([
          roleService.getRoles(),
          unitService.getUnits(),
        ]);
        setRoles(rolesData);
        setUnits(unitsData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      const error = err as AxiosError<{ message: string }>;
      setError(
        error.response?.data?.message ||
        'Gagal memuat data. Silakan coba lagi.',
      );
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, debouncedSearchQuery, selectedRoleId, selectedUnitId]);

  const handleCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role_id: roles[0]?.id || 0,
      unit_id: units[0]?.id || 0,
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role_id: user.role_id,
      unit_id: user.unit_id,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDetail = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      setFormError('Semua field harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await userService.createUser(formData);
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create user:', err);
      const error = err as AxiosError<{ message: string }>;
      setFormError(
        error.response?.data?.message ||
        'Gagal membuat user. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedUser) return;

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Nama dan email harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role_id: formData.role_id,
        unit_id: formData.unit_id,
      };

      // Only include password if it's not empty
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await userService.updateUser(selectedUser.id, updateData);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to update user:', err);
      const error = err as AxiosError<{ message: string }>;
      setFormError(
        error.response?.data?.message ||
        'Gagal mengupdate user. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await userService.deleteUser(selectedUser.id);
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      const error = err as AxiosError<{ message: string }>;
      alert(
        error.response?.data?.message ||
        'Gagal menghapus user. Silakan coba lagi.',
      );
    }
  };

  if (isInitialLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600 font-medium'>Memuat data user...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={fetchData}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-7xl'>
      {/* Header */}
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2'>
          Manajemen User
        </h1>
        <p className='text-sm sm:text-base text-gray-600'>
          Kelola pengguna sistem peminjaman ruang
        </p>
      </div>

      {/* Actions Bar */}
      <div className='space-y-3 mb-4 sm:mb-6'>
        <div className='flex items-center gap-2 w-full'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              type='text'
              placeholder='Cari user...'
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
            <span>Tambah User</span>
          </Button>
        </div>
        <div className='flex flex-row gap-2'>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger className='h-9 sm:h-10 text-xs sm:text-sm'>
              <SelectValue placeholder='Filter Role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Role</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
            <SelectTrigger className='h-9 sm:h-10 text-xs sm:text-sm'>
              <SelectValue placeholder='Filter Unit' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Unit</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id.toString()}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Section */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative'>
        {/* Subtle Loading Overlay for Updates */}
        {isFetching && !isInitialLoading && (
          <div className='absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center'>
            <div className='bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-gray-100'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              <span className='text-xs font-medium text-gray-600'>Memperbarui data...</span>
            </div>
          </div>
        )}

        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-8 sm:w-12.5 text-center text-xs sm:text-sm'>
                  No
                </TableHead>
                <TableHead className='text-xs sm:text-sm'>Nama</TableHead>
                <TableHead className='hidden sm:table-cell text-xs sm:text-sm'>
                  Email
                </TableHead>
                <TableHead className='text-xs sm:text-sm'>Role</TableHead>
                <TableHead className='hidden md:table-cell text-xs sm:text-sm'>
                  Unit
                </TableHead>
                <TableHead className='hidden lg:table-cell text-xs sm:text-sm'>
                  Terdaftar
                </TableHead>
                <TableHead className='text-center text-xs sm:text-sm w-20 sm:w-auto'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center text-gray-500 h-32'
                  >
                    {debouncedSearchQuery ||
                      selectedRoleId !== 'all' ||
                      selectedUnitId !== 'all'
                      ? 'Tidak ada user yang sesuai dengan filter'
                      : 'Belum ada user'}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium text-center text-xs sm:text-sm py-2 sm:py-3'>
                      {(currentPage - 1) * 10 + index + 1}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm font-medium text-gray-900 py-2 sm:py-3'>
                      <div>{user.name}</div>
                      <div className='sm:hidden text-[10px] text-gray-500 mt-0.5'>
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className='hidden sm:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {user.email}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      <span className='inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700'>
                        {user.role?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell className='hidden md:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {user.unit?.name || '-'}
                    </TableCell>
                    <TableCell className='hidden lg:table-cell text-xs sm:text-sm text-gray-500 py-2 sm:py-3'>
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
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
                          onClick={() => handleDetail(user)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                        >
                          <Eye className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(user)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                        >
                          <Pencil className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(user)}
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

      {/* Pagination Controls */}
      <div className='mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm'>
        <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-6'>
          <div className='text-xs sm:text-sm text-gray-600 font-medium'>
            Menampilkan{' '}
            <span className='font-bold text-blue-600'>
              {users.length > 0 ? (currentPage - 1) * 10 + 1 : 0}
            </span>{' '}
            -{' '}
            <span className='font-bold text-blue-600'>
              {Math.min(currentPage * 10, totalItems)}
            </span>{' '}
            dari <span className='font-bold text-blue-600'>{totalItems}</span> entri
          </div>
        </div>
        <div className='flex items-center gap-1 sm:gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isFetching}
            className='h-8 px-2 sm:px-3 text-xs sm:text-sm border-gray-200 hover:bg-gray-50'
          >
            <ChevronLeft className='h-4 w-4 mr-1 sm:mr-2' />
            Prev
          </Button>

          {/* Page numbers */}
          <div className='hidden md:flex items-center gap-1'>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, array) => (
                <div key={page} className='flex items-center gap-1'>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className='text-gray-400 px-1'>...</span>
                  )}
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 text-xs font-medium ${currentPage === page
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </Button>
                </div>
              ))}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages || isFetching}
            className='h-8 px-2 sm:px-3 text-xs sm:text-sm border-gray-200 hover:bg-gray-50'
          >
            Next
            <ChevronRight className='h-4 w-4 ml-1 sm:ml-2' />
          </Button>
        </div>
      </div>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className='sm:max-w-125'>
          <form onSubmit={handleSubmitCreate}>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi user yang akan ditambahkan
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <label htmlFor='name' className='text-sm font-medium'>
                  Nama <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='Nama lengkap user'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='email' className='text-sm font-medium'>
                  Email <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder='email@example.com'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='password' className='text-sm font-medium'>
                  Password <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='password'
                  type='password'
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder='Minimal 8 karakter'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='role_id' className='text-sm font-medium'>
                  Role <span className='text-red-500'>*</span>
                </label>
                <Select
                  value={formData.role_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role_id: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <label htmlFor='unit_id' className='text-sm font-medium'>
                  Unit <span className='text-red-500'>*</span>
                </label>
                <Select
                  value={formData.unit_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit_id: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name} ({unit.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className='sm:max-w-125'>
          <form onSubmit={handleSubmitEdit}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Ubah informasi user yang dipilih
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <label htmlFor='edit-name' className='text-sm font-medium'>
                  Nama <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='edit-name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='Nama lengkap user'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='edit-email' className='text-sm font-medium'>
                  Email <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='edit-email'
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder='email@example.com'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='edit-password' className='text-sm font-medium'>
                  Password (Kosongkan jika tidak ingin mengubah)
                </label>
                <Input
                  id='edit-password'
                  type='password'
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder='Minimal 8 karakter'
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='edit-role_id' className='text-sm font-medium'>
                  Role <span className='text-red-500'>*</span>
                </label>
                <Select
                  value={formData.role_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role_id: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <label htmlFor='edit-unit_id' className='text-sm font-medium'>
                  Unit <span className='text-red-500'>*</span>
                </label>
                <Select
                  value={formData.unit_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit_id: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name} ({unit.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Detail User Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className='sm:max-w-125'>
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className='space-y-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>ID</p>
                  <p className='text-sm text-gray-900'>{selectedUser.id}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Status</p>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                    {selectedUser.status || 'Active'}
                  </span>
                </div>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-500'>Nama</p>
                <p className='text-sm text-gray-900'>{selectedUser.name}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-500'>Email</p>
                <p className='text-sm text-gray-900'>{selectedUser.email}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-500'>Role</p>
                <p className='text-sm text-gray-900'>
                  {selectedUser.role?.name || '-'}
                </p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-500'>Unit</p>
                <p className='text-sm text-gray-900'>
                  {selectedUser.unit?.name || '-'} (
                  {selectedUser.unit?.code || '-'})
                </p>
                {selectedUser.unit?.category && (
                  <p className='text-xs text-gray-500 mt-1'>
                    Kategori: {selectedUser.unit.category}
                  </p>
                )}
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Terdaftar</p>
                  <p className='text-sm text-gray-900'>
                    {new Date(selectedUser.created_at).toLocaleDateString(
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
                    {new Date(selectedUser.updated_at).toLocaleDateString(
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
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus user{' '}
              <strong>{selectedUser?.name}</strong>? Tindakan ini tidak dapat
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

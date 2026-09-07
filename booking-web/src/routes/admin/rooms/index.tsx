import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Pencil,
  Search,
  Trash2,
  Eye,
  Users,
} from 'lucide-react';
import { RoomForm } from '@/features/rooms/components/RoomForm';
import { DetailRoomModal } from '@/features/rooms/components/DetailRoomModal';
import { DeleteRoomDialog } from '@/features/rooms/components/DeleteRoomDialog';
import { useRooms } from '@/features/rooms/hooks/useRooms';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/admin/rooms/')({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    filteredRooms,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isInitialLoading,
    isFetching,
    error,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedRoom,
    formData,
    setFormData,
    formError,
    isSubmitting,
    selectedStatus,
    setSelectedStatus,
    capacityRange,
    setCapacityRange,
    fetchRooms,
    handleCreate,
    handleEdit,
    handleDetail,
    handleDelete,
    handleFileChange,
    handleSubmitCreate,
    handleSubmitEdit,
    handleConfirmDelete,
  } = useRooms();

  if (isInitialLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600 font-medium'>Memuat data ruangan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={fetchRooms}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 py-2 sm:py-4'>
      {/* Header */}
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2'>
          Manajemen Ruang
        </h1>
        <p className='text-sm sm:text-base text-gray-600'>
          Kelola data ruang yang tersedia untuk peminjaman
        </p>
      </div>

      <div className='mb-6 space-y-4'>
        {/* Search & Add Button Row */}
        <div className='flex items-center gap-2 w-full'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              type='text'
              placeholder='Cari ruangan...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 text-sm h-11 border-gray-200 focus:ring-blue-500 rounded-xl shadow-sm w-full bg-white'
            />
          </div>
          <Button
            onClick={handleCreate}
            className='whitespace-nowrap h-11 px-5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm flex items-center gap-2'
          >
            <Plus className='h-5 w-5' />
            <span>Tambah Ruang</span>
          </Button>
        </div>

        {/* Filters Row */}
        <div className='flex flex-col md:flex-row items-start md:items-center gap-4 pt-1'>
          <div className='flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide max-w-full'>
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'ACTIVE', label: 'Aktif' },
              { id: 'MAINTENANCE', label: 'Maintenance' },
              { id: 'INACTIVE', label: 'Nonaktif' }
            ].map((status) => (
              <Button
                key={status.id}
                variant={selectedStatus === status.id ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedStatus(status.id as any)}
                className={`h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedStatus === status.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                  }`}
              >
                {status.label}
              </Button>
            ))}
          </div>

          <div className='w-full md:w-[200px]'>
            <Select
              value={capacityRange}
              onValueChange={setCapacityRange}
            >
              <SelectTrigger className='h-9 text-xs sm:text-sm rounded-lg border-gray-200 shadow-sm bg-white'>
                <div className='flex items-center gap-2'>
                  <Users className='h-3.5 w-3.5 text-gray-400' />
                  <SelectValue placeholder='Kapasitas' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Kapasitas</SelectItem>
                <SelectItem value='<20'>Kecil (&lt; 20)</SelectItem>
                <SelectItem value='20-50'>Sedang (20 - 50)</SelectItem>
                <SelectItem value='50-100'>Besar (50 - 100)</SelectItem>
                <SelectItem value='>100'>Sangat Besar (&gt; 100)</SelectItem>
              </SelectContent>
            </Select>
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
                <TableHead className='w-12 text-center text-xs sm:text-sm px-2'>
                  No
                </TableHead>
                <TableHead className='text-xs sm:text-sm px-2 min-w-20'>
                  Kode
                </TableHead>
                <TableHead className='text-xs sm:text-sm px-2 min-w-30'>
                  Nama Ruangan
                </TableHead>
                <TableHead className='text-xs sm:text-sm px-2 w-20'>
                  Kapasitas
                </TableHead>
                <TableHead className='hidden lg:table-cell text-xs sm:text-sm px-2 min-w-25'>
                  Fasilitas
                </TableHead>
                <TableHead className='text-xs sm:text-sm px-2 w-24'>
                  Status
                </TableHead>
                <TableHead className='text-center text-xs sm:text-sm px-2 w-24'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center text-gray-500 h-32'
                  >
                    {debouncedSearchTerm
                      ? 'Tidak ada ruangan yang cocok dengan pencarian'
                      : 'Belum ada data ruangan'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRooms.map((room, index) => (
                  <TableRow key={room.id}>
                    <TableCell className='font-medium text-center text-xs sm:text-sm py-2 sm:py-3'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm py-2 sm:py-3'>
                      {room.code}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm font-medium text-gray-900 py-2 sm:py-3'>
                      {room.name}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm py-2 sm:py-3'>
                      {room.capacity || '-'}
                    </TableCell>
                    <TableCell className='hidden md:table-cell text-xs sm:text-sm py-2 sm:py-3'>
                      {Array.isArray(room.facilities) &&
                        room.facilities.length > 0
                        ? room.facilities.join(', ')
                        : '-'}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm py-2 sm:py-3'>
                      <span
                        className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${room.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : room.status === 'MAINTENANCE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {room.status === 'ACTIVE'
                          ? 'Aktif'
                          : room.status === 'MAINTENANCE'
                            ? 'Maintenance'
                            : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell className='py-2 sm:py-3'>
                      <div className='flex items-center justify-center gap-1 sm:gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDetail(room)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                        >
                          <Eye className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(room)}
                          className='h-6 w-6 sm:h-8 sm:w-8 p-0'
                        >
                          <Pencil className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(room)}
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

      {/* Create Room Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Tambah Ruangan Baru</DialogTitle>
            <DialogDescription>
              Masukkan informasi ruangan yang akan ditambahkan
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            <RoomForm
              formData={formData}
              setFormData={setFormData}
              onFileChange={handleFileChange}
              formError={formError}
              isSubmitting={isSubmitting}
              onCancel={() => setIsCreateModalOpen(false)}
              submitLabel="Tambah"
            />
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Room Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Ruangan</DialogTitle>
            <DialogDescription>Perbarui informasi ruangan</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <RoomForm
              formData={formData}
              setFormData={setFormData}
              onFileChange={handleFileChange}
              formError={formError}
              isSubmitting={isSubmitting}
              onCancel={() => setIsEditModalOpen(false)}
              submitLabel="Simpan"
              showStatus
            />
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Room Modal */}
      <DetailRoomModal
        room={selectedRoom}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteRoomDialog
        room={selectedRoom}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}


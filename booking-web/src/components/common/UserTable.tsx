import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button/button';
import { Eye, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  onDelete: (id: number) => void;
  onViewDetail: (user: User) => void;
  onToggleStatus: (id: number, newStatus: 'active' | 'inactive') => void;
}

const RoleBadge = ({ role }: { role: string }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role === 'Admin'
        ? 'bg-purple-100 text-purple-800'
        : role === 'Kemahasiswaan'
          ? 'bg-blue-100 text-blue-800'
          : role === 'Sumber Daya'
            ? 'bg-orange-100 text-orange-800'
            : role === 'Peminjam'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
      }`}
  >
    {role}
  </span>
);

export function UserTable({ users, onDelete, onViewDetail }: UserTableProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className='space-y-4'>
        {users.map((user) => (
          <div
            key={user.id}
            className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'
          >
            <div className='flex justify-between items-start'>
              <div className='grow'>
                <p className='font-semibold'>{user.name}</p>
                <p className='text-sm text-gray-500'>{user.email}</p>
              </div>
              <RoleBadge role={user.role} />
            </div>
            <div className='mt-4 pt-4 border-t border-gray-100 flex justify-between items-center'>
              <p className='text-sm text-gray-500'>
                Terdaftar: {user.createdAt}
              </p>
              <div className='flex gap-2 items-center'>
                <Button
                  onClick={() => onViewDetail(user)}
                  variant='outline'
                  size='sm'
                  className='flex items-center gap-1'
                >
                  <Eye className='w-4 h-4' />
                  <span>Detail</span>
                </Button>
                <Button
                  onClick={() => onDelete(user.id)}
                  variant='destructive'
                  size='icon-sm'
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className='text-center py-12 text-gray-500'>
            Tidak ada user yang tersedia
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
      <div className='overflow-x-auto'>
        <Table className='min-w-full'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40px] md:w-[50px] text-center px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>No</TableHead>
              <TableHead className='px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>Nama</TableHead>
              <TableHead className='px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>Email</TableHead>
              <TableHead className='px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>Role</TableHead>
              <TableHead className='px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>Terdaftar</TableHead>
              <TableHead className='text-center px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className='font-medium text-center px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>
                  {index + 1}
                </TableCell>
                <TableCell className='px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>{user.name}</TableCell>
                <TableCell className='px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>{user.email}</TableCell>
                <TableCell className='px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell className='px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm whitespace-nowrap'>{user.createdAt}</TableCell>
                <TableCell className='px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-sm'>
                  <div className='flex gap-1 md:gap-2 items-center justify-center'>
                    <Button
                      onClick={() => onViewDetail(user)}
                      variant='outline'
                      size='sm'
                      className='flex items-center gap-1 h-7 md:h-9 px-2 md:px-3 text-[10px] md:text-sm'
                    >
                      <Eye className='w-3.5 h-3.5 md:w-4 md:h-4' />
                      <span className='hidden sm:inline'>Detail</span>
                    </Button>
                    <Button
                      onClick={() => onDelete(user.id)}
                      variant='destructive'
                      size='icon-sm'
                      className='h-7 w-7 md:h-9 md:w-9 px-0'
                    >
                      <Trash2 className='w-3.5 h-3.5 md:w-4 md:h-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {users.length === 0 && (
        <div className='text-center py-12 text-gray-500'>
          Tidak ada user yang tersedia
        </div>
      )}
    </div>
  );
}

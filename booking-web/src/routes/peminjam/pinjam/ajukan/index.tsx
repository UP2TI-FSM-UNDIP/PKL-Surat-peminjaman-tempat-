import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { documentService } from '@/services/document.service';
import type { CreateDocumentData } from '@/types/document';
import { Button } from '@/components/ui/button/button';

export const Route = createFileRoute('/peminjam/pinjam/ajukan/')({
  component: RouteComponent,
});

interface Workflow {
  id: number;
  name: string;
  description?: string;
}

interface Room {
  id: number;
  name: string;
  code?: string;
}

export default function RouteComponent() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [workflowId, setWorkflowId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [roomId, setRoomId] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWorkflows();
    fetchRooms();
  }, []);

  const fetchWorkflows = async () => {
    setWorkflowsLoading(true);
    setError(null);
    try {
      const res = await api.get('/workflows');
      const data = res.data.data || res.data;
      setWorkflows(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setWorkflowId(data[0].id);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat opsi workflow');
    } finally {
      setWorkflowsLoading(false);
    }
  };

  const fetchRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await api.get('/rooms');
      // API returns paginated: { data: { data: [...] } }
      const data = res.data.data?.data || res.data.data || res.data;
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal memuat daftar ruang', err);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Awal
    if (!workflowId) return setError('Pilih workflow terlebih dahulu');
    if (rooms.length > 0 && !roomId)
      return setError('Pilih ruang terlebih dahulu');

    setSubmitting(true);
    setError(null);
    setSuccess('');

    try {
      const documentTitle = title || 'Pengajuan Peminjaman';

      if (attachmentFile) {
        // 2a. Kirim dengan File (Multipart)
        const form = new FormData();
        form.append('workflow_id', String(workflowId));
        form.append('title', documentTitle);
        form.append('attachment', attachmentFile);

        if (bookingDate) form.append('content[booking_date]', bookingDate);
        form.append('content[room_id]', roomId ? String(roomId) : '');

        await api.post('/documents', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // 2b. Kirim JSON Biasa
        const payload: CreateDocumentData = {
          workflow_id: workflowId,
          title: documentTitle,
          content: {
            booking_date: bookingDate || null,
            room_id: roomId ? Number(roomId) : null,
          },
        };
        await documentService.createDocument(payload);
      }

      // 3. Sukses & Navigasi
      setSuccess('Dokumen berhasil dibuat');
      navigate({ to: '/peminjam/pinjam', search: { status: 'ALL' } });
    } catch (err: any) {
      console.error('createDocument error:', err);

      // Ekstraksi pesan error dari backend
      const backendMessage = err?.response?.data?.message;
      const validationErrors = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(', ')
        : null;

      setError(backendMessage || validationErrors || 'Gagal membuat dokumen.');
    } finally {
      setSubmitting(false);
    }
  };

  if (workflowsLoading || roomsLoading)
    return <div className='p-6'>Memuat...</div>;

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-4'>
        Ajukan Peminjaman - Buat Dokumen
      </h1>
      {error && <div className='text-red-600 mb-3'>{error}</div>}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Pilih Workflow
          </label>
          <select
            value={workflowId ?? ''}
            onChange={(e) => setWorkflowId(Number(e.target.value))}
            className='w-full border rounded px-3 py-2'
            required
          >
            <option value=''>-- Pilih Workflow --</option>
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Judul Kegiatan
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='w-full border rounded px-3 py-2'
            placeholder='Judul kegiatan...'
            required
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Tanggal</label>
            <input
              type='date'
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className='w-full border rounded px-3 py-2'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>
              Lampiran (PDF, opsional)
            </label>
            <input
              type='file'
              accept='.pdf'
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f && f.type !== 'application/pdf') {
                  setError('Lampiran harus berformat PDF');
                  setAttachmentFile(null);
                  return;
                }
                setError(null);
                setAttachmentFile(f);
              }}
              className='w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>
              Pilih Ruang
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className='w-full border rounded px-3 py-2'
              required={rooms.length > 0}
            >
              <option value=''>-- Pilih Ruang --</option>
              {rooms.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name} {r.code ? `(${r.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button
            type='submit'
            disabled={
              submitting || workflowsLoading || roomsLoading || !workflowId
            }
          >
            {submitting ? 'Menyimpan...' : 'Buat Dokumen'}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate({ to: '/peminjam/pinjam', search: { status: 'ALL' } })}
          >
            Batal
          </Button>
        </div>

        {success && <div className='text-green-600'>{success}</div>}
      </form>
    </div>
  );
}

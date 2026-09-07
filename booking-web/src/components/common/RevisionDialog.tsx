import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface RevisionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (note: string) => void;
    title?: string;
    description?: string;
    placeholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    loading?: boolean;
}

export function RevisionDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Masukkan catatan revisi:',
    description = 'Berikan catatan untuk revisi dokumen ini.',
    placeholder = 'Tulis catatan di sini...',
    confirmLabel = 'Kirim Revisi',
    cancelLabel = 'Batal',
    variant = 'default',
    loading = false,
}: RevisionDialogProps) {
    const [note, setNote] = useState('');

    // Reset note when dialog closes
    useEffect(() => {
        if (!isOpen) setNote('');
    }, [isOpen]);

    const handleConfirm = () => {
        onConfirm(note);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className='py-4'>
                    <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={placeholder}
                        className='min-h-[100px]'
                        disabled={loading}
                    />
                </div>
                <DialogFooter className='sm:justify-end gap-2'>
                    <Button variant='outline' onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={variant} onClick={handleConfirm} disabled={loading || (!note.trim() && confirmLabel !== 'Setujui')}>
                        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        {loading ? 'Memproses...' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

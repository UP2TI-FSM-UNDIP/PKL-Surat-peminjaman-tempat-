import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { authService, AUTH_CHANGED_EVENT } from '@/services/auth.service';
import { unitService } from '@/services/unit.service';
import type { Unit } from '@/services/unit.service';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

const SELF_SERVICE_UNIT_CATEGORIES: string[] = ['HMD', 'BEM', 'SENAT', 'UKM'];

export function ProfileCompletionModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [units, setUnits] = useState<Unit[]>([]);
    // Role ditetapkan admin (atau otomatis Admin dari SSO), tidak dipilih sendiri
    const currentRoleName = localStorage.getItem('role') || '-';
    const currentUnitId = Number(localStorage.getItem('unitId')) || 0;

    const [formData, setFormData] = useState({
        name: localStorage.getItem('userName') || '',
        nim_nip: '',
        unit_id: currentUnitId,
    });

    const fetchData = useCallback(async () => {
        try {
            const fetchedUnits = await unitService.getUnits();
            // Hanya organisasi mahasiswa yang bisa dipilih sendiri, atau tetap di unit sekarang
            setUnits(
                fetchedUnits.filter(
                    (unit) =>
                        SELF_SERVICE_UNIT_CATEGORIES.includes(unit.category) ||
                        unit.id === currentUnitId,
                ),
            );
        } catch (error) {
            console.error('Failed to fetch units', error);
        }
    }, [currentUnitId]);

    useEffect(() => {
        const checkStatus = () => {
            const isCompleted = localStorage.getItem('isProfileCompleted');
            const token = localStorage.getItem('token');
            
            // Show modal if logged in but profile not completed
            if (token && isCompleted === 'false') {
                // Isi ulang dari data login terbaru (nama dari SSO, unit saat ini)
                setFormData((prev) => ({
                    ...prev,
                    name: prev.name || localStorage.getItem('userName') || '',
                    unit_id: prev.unit_id || Number(localStorage.getItem('unitId')) || 0,
                }));
                setIsOpen(true);
                fetchData();
            } else {
                setIsOpen(false);
            }
        };

        checkStatus();
        
        // Listen for storage changes (sync between tabs)
        // 'storage' = perubahan dari tab lain; AUTH_CHANGED_EVENT = tab ini
        // (mis. tepat setelah kembali dari SSO, tanpa perlu login ulang)
        window.addEventListener('storage', checkStatus);
        window.addEventListener(AUTH_CHANGED_EVENT, checkStatus);
        return () => {
            window.removeEventListener('storage', checkStatus);
            window.removeEventListener(AUTH_CHANGED_EVENT, checkStatus);
        };
    }, [fetchData]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.endsWith('_id') ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await authService.updateProfile(formData);
            
            // Update localStorage with new data
            authService.saveAuthData({
                message: 'Profile updated',
                token: localStorage.getItem('token') || '',
                user: response.data
            });

            toast.success('Profil berhasil dilengkapi!');
            setIsOpen(false);

            // Langsung ke dashboard sesuai role (muat ulang penuh agar konteks role/unit baru terpakai)
            authService.redirectByRole(response.data?.role?.name ?? '');
        } catch (error) {
            console.error('Profile update failed', error);
            toast.error(getErrorMessage(error, 'Gagal menyimpan profil. Silakan coba lagi.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Lengkapi Profil Anda</DialogTitle>
                    <DialogDescription>
                        Selamat datang! Karena Anda login via SSO untuk pertama kalinya, silakan lengkapi data berikut.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Nama Lengkap</label>
                        <Input 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nama Lengkap"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">NIM / NIP</label>
                        <Input 
                            name="nim_nip"
                            value={formData.nim_nip}
                            onChange={handleChange}
                            placeholder="Nomor Induk Mahasiswa atau Pegawai"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Unit Kerja / Organisasi</label>
                        <select 
                            name="unit_id"
                            value={formData.unit_id}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            required
                        >
                            <option value="">Pilih Unit...</option>
                            {units.map(unit => (
                                <option key={unit.id} value={unit.id}>{unit.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Role / Jabatan</label>
                        <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 text-sm">
                            {currentRoleName}
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            * Role ditetapkan oleh admin. Hubungi admin jika role Anda belum sesuai.
                        </p>
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Menyimpan...' : 'Simpan Profil'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

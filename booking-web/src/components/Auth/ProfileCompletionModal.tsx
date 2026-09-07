import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';
import { unitService } from '@/services/unit.service';
import type { Unit } from '@/services/unit.service';
import { roleService } from '@/services/role.service';
import type { Role } from '@/services/role.service';
import { toast } from 'sonner';

export function ProfileCompletionModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [units, setUnits] = useState<Unit[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    
    const [formData, setFormData] = useState({
        name: localStorage.getItem('userName') || '',
        nim_nip: '',
        role_id: Number(localStorage.getItem('roleId')) || 5, // Default Sekretaris
        unit_id: Number(localStorage.getItem('unitId')) || 1, // Default FSM
    });

    useEffect(() => {
        const checkStatus = () => {
            const isCompleted = localStorage.getItem('isProfileCompleted');
            const token = localStorage.getItem('token');
            
            // Show modal if logged in but profile not completed
            if (token && isCompleted === 'false') {
                setIsOpen(true);
                fetchData();
            } else {
                setIsOpen(false);
            }
        };

        checkStatus();
        
        // Listen for storage changes (sync between tabs)
        window.addEventListener('storage', checkStatus);
        return () => window.removeEventListener('storage', checkStatus);
    }, []);

    const fetchData = async () => {
        try {
            const [fetchedUnits, fetchedRoles] = await Promise.all([
                unitService.getUnits(),
                roleService.getRoles()
            ]);
            setUnits(fetchedUnits);
            setRoles(fetchedRoles);
        } catch (error) {
            console.error('Failed to fetch units/roles', error);
        }
    };

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
            
            // Refresh page to apply new role/unit context if necessary
            window.location.reload();
        } catch (error: any) {
            console.error('Profile update failed', error);
            toast.error(error.response?.data?.message || 'Gagal menyimpan profil. Silakan coba lagi.');
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
                        <select 
                            name="role_id"
                            value={formData.role_id}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            required
                        >
                            <option value="">Pilih Role...</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-muted-foreground italic">
                            * Pilih role yang paling sesuai dengan status Anda saat ini.
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

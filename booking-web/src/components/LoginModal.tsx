import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import axios from 'axios';
import { Button } from '@/components/ui/button/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await authService.login(formData);
            authService.saveAuthData(response);
            authService.redirectByRole(response.user.role?.name || '', navigate);
        } catch (err: unknown) {
            console.error('Login failed:', err);
            let errorMessage = 'Login gagal. Silakan coba lagi.';
            if (axios.isAxiosError(err)) {
                const responseData = err.response?.data as { message?: string };
                if (responseData?.message) {
                    errorMessage = responseData.message;
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSSOLogin = () => {
        const clientId = import.meta.env.VITE_SSO_CLIENT_ID as string;
        const redirectUri = import.meta.env.VITE_SSO_REDIRECT_URI as string;
        const ssoLoginUrl = import.meta.env.VITE_SSO_LOGIN_URL as string || 'https://apps-fsm.undip.ac.id/sso/';

        if (!clientId || !redirectUri) {
            setError('Konfigurasi SSO belum lengkap. Hubungi administrator.');
            return;
        }

        // Redirect browser to SSO login portal
        // SSO will then call our backend /auth/sso and redirect back to this app
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
        });
        window.location.href = `${ssoLoginUrl}?${params.toString()}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-[90vw] p-0 overflow-hidden border-none shadow-2xl rounded-xl sm:rounded-2xl">
                <div className="flex flex-col md:flex-row h-full min-h-[500px]">
                    {/* Left Pane: Branding & Illustration */}
                    <div className="flex-1 bg-secondary p-8 md:p-10 hidden md:flex flex-col items-center justify-center text-center space-y-8 animate-in slide-in-from-left duration-700">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                Peminjaman <br /> Ruang & Fasilitas
                            </h2>
                            <p className="text-white/70 text-sm font-medium">
                                Fakultas Sains dan Matematika <br /> Universitas Diponegoro
                            </p>
                        </div>
                        <img
                            src={`${import.meta.env.BASE_URL}illustration.png`}
                            alt="FSM Illustration"
                            className="w-full max-w-[260px] h-auto drop-shadow-2xl brightness-110 contrast-105"
                        />
                        <div className="pt-2">
                            <div className="flex gap-2 justify-center opacity-40">
                                <div className="w-8 h-1 bg-white rounded-full" />
                                <div className="w-2 h-1 bg-white rounded-full" />
                                <div className="w-2 h-1 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Right Pane: Login Form */}
                    <div className="flex-[1.2] bg-white p-8 md:p-12 flex flex-col justify-center animate-in slide-in-from-right duration-700">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <DialogTitle className="text-3xl font-black text-foreground tracking-tight">
                                    Log In
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground font-medium text-sm">
                                    Selamat datang kembali! Silakan masuk ke akun Anda.
                                </DialogDescription>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-bold text-foreground tracking-wide uppercase">
                                            Email
                                        </label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="nama@undip.ac.id"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                            className="border-gray-200 focus-visible:ring-primary h-12 rounded-lg"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="password" className="text-sm font-bold text-foreground tracking-wide uppercase">
                                            Password
                                        </label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                            className="border-gray-200 focus-visible:ring-primary h-12 rounded-lg"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-xs font-bold animate-pulse">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-13 font-black text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white shadow-lg shadow-primary/30 transition-all duration-300 active:scale-[0.98] rounded-xl tracking-widest uppercase relative overflow-hidden group"
                                    disabled={isLoading}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                Masuk
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </>
                                        )}
                                    </span>
                                    <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </Button>
                            </form>

                            <div className="pt-4 flex flex-col gap-3">
                                <div className="relative flex items-center py-1">
                                    <div className="flex-grow border-t border-gray-100" />
                                    <span className="px-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">atau</span>
                                    <div className="flex-grow border-t border-gray-100" />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSSOLogin}
                                    className="w-full h-11 flex items-center justify-center gap-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-[0.98]"
                                >
                                    {/* UNDIP Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                                    </svg>
                                    Login dengan SSO UNDIP
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-4">
                                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                                    © 2026 PINJAM RUANG FSM • UNDIP
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

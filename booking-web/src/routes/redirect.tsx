import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';

export const Route = createFileRoute('/redirect')({
  component: SsoRedirectPage,
});

/**
 * SSO Redirect Page — handles Flow B (Portal-Initiated login).
 *
 * Flow B:
 *   User logs in from SSO portal (https://apps-fsm.undip.ac.id/sso)
 *   → SSO Engine calls backend GET /auth/sso
 *   → backend returns { callback_url: "/redirect?token=..." }
 *   → SSO Engine uses FRONTEND URL as base → redirects to THIS page:
 *     https://apps-fsm.undip.ac.id/peminjaman-ruang/redirect?token=...
 *
 * Logic is identical to /sso/callback — only the path differs.
 */
function SsoRedirectPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setError('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    const processRedirect = async () => {
      try {
        // Save token first so the axios interceptor can use it
        localStorage.setItem('token', token);

        // Fetch full user profile with the new token
        const userResponse = await authService.getUser();

        // Reuse saveAuthData to persist all auth state
        authService.saveAuthData({
          message: 'SSO Login successful',
          token,
          user: userResponse,
          unit_category: userResponse?.unit?.category ?? null,
        });

        // Redirect to the appropriate dashboard based on role
        const role = userResponse?.role?.name ?? '';
        const isCompleted = userResponse?.is_profile_completed ?? true;

        if (!isCompleted) {
          // If profile is not completed, stay on home page (or redirect to home)
          // The global ProfileCompletionModal will handle the rest
          navigate({ to: '/' });
        } else {
          authService.redirectByRole(role, navigate);
        }
      } catch (err: unknown) {
        console.error('[SSO Redirect] Failed to process SSO session', err);
        localStorage.removeItem('token');
        setError('Gagal memproses sesi SSO. Silakan coba lagi.');
      }
    };

    processRedirect();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-4 border border-red-100">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3C6.477 3 2 7.477 2 12s4.477 9 10 9 10-4.477 10-9S17.523 3 12 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Autentikasi Gagal</h2>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="mt-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center space-y-4">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="animate-spin h-7 w-7 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600">Memproses sesi SSO UNDIP...</p>
        <p className="text-xs text-gray-400">Harap tunggu, Anda akan segera diarahkan.</p>
      </div>
    </div>
  );
}

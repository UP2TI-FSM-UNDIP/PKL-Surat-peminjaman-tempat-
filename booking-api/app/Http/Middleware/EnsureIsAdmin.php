<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin
{
    /**
     * Izinkan admin, plus role lain yang disebut eksplisit di route,
     * mis. ->middleware('admin:sumber-daya,kemahasiswaan').
     *
     * Sebelumnya semua user di unit kategori FAKULTAS diloloskan, sehingga
     * mahasiswa/staf non-admin yang terdaftar di unit Fakultas ikut punya
     * akses admin.
     */
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $roleSlug = $user->role?->slug;
        $isAllowed = $user->isAdmin() || ($roleSlug && in_array($roleSlug, $allowedRoles, true));

        if (!$isAllowed) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melakukan aksi ini'
            ], 403);
        }

        return $next($request);
    }
}

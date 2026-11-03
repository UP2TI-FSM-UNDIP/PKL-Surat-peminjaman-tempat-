<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Akun dengan role "Menunggu Penetapan" belum boleh memakai fitur apa pun.
 * Pengecualian (route yang tidak memakai middleware ini): data diri (GET /user),
 * melengkapi profil (PATCH /user/profile), daftar unit untuk form profil, dan logout.
 */
class EnsureRoleAssigned
{
    public function handle(Request $request, Closure $next): Response
    {
        // Daftar unit dibutuhkan form Lengkapi Profil
        $isUnitList = $request->isMethod('GET') && $request->is('api/units');

        if (!$isUnitList && $request->user()?->isPendingRole()) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda menunggu penetapan role oleh admin.',
            ], 403);
        }

        return $next($request);
    }
}

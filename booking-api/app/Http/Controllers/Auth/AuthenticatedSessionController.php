<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $mode = config('auth.local_login', 'off');

        if ($mode === 'off') {
            return response()->json([
                'message' => 'Login hanya melalui SSO FSM.',
            ], 403);
        }

        if ($mode === 'admin') {
            // Hanya akun Admin. Pesan disamakan dengan password salah agar
            // tidak membocorkan akun mana yang ada / non-admin.
            $candidate = User::where('email', $request->string('email'))->with('role')->first();
            if (!$candidate || !$candidate->isAdmin()) {
                throw ValidationException::withMessages(['email' => trans('auth.failed')]);
            }
        }

        $request->authenticate();

        $user = Auth::user();

        // Load role dan unit untuk user
        $user->load(['role', 'unit']);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user,
            'unit_category' => $user->unit ? $user->unit->category : null, // For workflow selection
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): JsonResponse
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful'
        ]);
    }
}

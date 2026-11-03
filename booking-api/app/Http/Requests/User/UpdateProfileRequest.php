<?php

namespace App\Http\Requests\User;

use App\Models\Unit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Melengkapi profil sendiri (setelah login SSO pertama).
 *
 * - role_id TIDAK diterima: role hanya ditetapkan admin (atau otomatis Admin
 *   jika di SSO berstatus admin). Sebelumnya field ini memungkinkan siapa pun
 *   mengubah role dirinya menjadi Admin.
 * - unit_id hanya boleh dipilih sendiri saat profil belum lengkap, dan hanya
 *   unit ormawa (HMD/BEM/SENAT/UKM). Setelah itu perubahan unit lewat admin.
 */
class UpdateProfileRequest extends FormRequest
{
    public const SELF_SERVICE_UNIT_CATEGORIES = ['HMD', 'BEM', 'SENAT', 'UKM'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();

        $unitRule = $user->is_profile_completed
            // Profil sudah lengkap: unit tidak bisa diganti sendiri
            ? ['sometimes', Rule::in([$user->unit_id])]
            // Profil belum lengkap: pilih unit ormawa, atau tetap di unit sekarang
            // (mis. dosen/staf yang unitnya akan ditetapkan admin)
            : [
                'required',
                Rule::exists('units', 'id')->where(fn ($q) => $q->where(
                    fn ($w) => $w->whereIn(\DB::raw('UPPER(category)'), self::SELF_SERVICE_UNIT_CATEGORIES)
                        ->orWhere('id', $user->unit_id)
                )),
            ];

        return [
            'name'    => 'required|string|max:255',
            'nim_nip' => ['required', 'string', 'max:50', Rule::unique('users', 'nim_nip')->ignore($user->id)],
            'unit_id' => $unitRule,
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'    => 'Nama wajib diisi',
            'nim_nip.required' => 'NIM/NIP wajib diisi',
            'nim_nip.max'      => 'NIM/NIP maksimal 50 karakter',
            'nim_nip.unique'   => 'NIM/NIP sudah dipakai akun lain',
            'unit_id.required' => 'Unit wajib dipilih',
            'unit_id.exists'   => 'Unit harus berupa organisasi mahasiswa (HMD, BEM, Senat, atau UKM)',
            'unit_id.in'       => 'Unit tidak dapat diubah sendiri. Hubungi admin untuk memindahkan unit.',
        ];
    }
}

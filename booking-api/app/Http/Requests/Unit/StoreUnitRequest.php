<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;

class StoreUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Hanya admin; dicek sebelum validasi agar non-admin langsung ditolak (403)
        return (bool) $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'code'        => 'required|string|max:255|unique:units,code',
            'description' => 'nullable|string',
            'category'    => 'required|in:FAKULTAS,DEPARTEMEN,HMD,BEM,SENAT,UKM',
            'parent_id'   => 'nullable|exists:units,id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'Nama unit wajib diisi',
            'code.required'     => 'Kode unit wajib diisi',
            'code.unique'       => 'Kode unit sudah digunakan',
            'category.required' => 'Kategori unit wajib dipilih',
            'category.in'       => 'Kategori harus salah satu dari: FAKULTAS, DEPARTEMEN, HMD, BEM, SENAT, UKM',
            'parent_id.exists'  => 'Unit induk tidak ditemukan',
        ];
    }
}

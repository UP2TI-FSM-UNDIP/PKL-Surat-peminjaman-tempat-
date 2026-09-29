<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Hanya admin; dicek sebelum validasi agar non-admin langsung ditolak (403)
        return (bool) $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'        => 'sometimes|string|max:255',
            'slug'        => 'sometimes|string|max:255|unique:roles,slug,' . $id,
            'description' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'slug.unique' => 'Slug role sudah digunakan',
        ];
    }
}

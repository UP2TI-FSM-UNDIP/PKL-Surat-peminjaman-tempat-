<?php

namespace App\Http\Requests\Workflow;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Hanya admin; dicek sebelum validasi agar non-admin langsung ditolak (403)
        return (bool) $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name'                => 'sometimes|string|max:255',
            'description'         => 'nullable|string',
            'applies_to_category' => 'sometimes|string|in:HMD,BEM,SENAT,UKM',
        ];
    }
}

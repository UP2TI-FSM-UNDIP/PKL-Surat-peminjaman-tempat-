<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class RegistrationTest extends TestCase
{
    /**
     * Registrasi publik ditutup (akun dibuat lewat SSO, role ditetapkan admin).
     */
    public function test_public_registration_is_closed(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role_id' => 1,
            'unit_id' => 1,
        ])->assertNotFound();
    }
}

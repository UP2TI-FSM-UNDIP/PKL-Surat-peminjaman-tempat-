<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingPolicyAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_save_policy_and_audit_is_written(): void
    {
        $role = \App\Models\Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $unit = \App\Models\Unit::create(['name' => 'FSM', 'code' => 'FSM', 'category' => 'FAKULTAS']);
        $admin = \App\Models\User::factory()->create(['role_id' => $role->id, 'unit_id' => $unit->id, 'is_profile_completed' => true]);
        \Laravel\Sanctum\Sanctum::actingAs($admin);

        $this->putJson('/api/admin/booking-policy', [
            'name' => 'Kebijakan Uji',
            'min_booking_days' => 1,
            'max_dates_per_room' => 10,
            'max_rooms_per_date' => 5,
            'tiers' => [
                ['min_days_before' => 15, 'deadline_offset' => 14],
                ['min_days_before' => 1, 'deadline_offset' => 1],
            ],
        ])->assertOk();

        $this->assertDatabaseCount('booking_policies', 1);
        $this->assertDatabaseHas('booking_policy_audits', ['action' => 'CREATED']);

        $this->getJson('/api/admin/booking-policy/audits')
            ->assertOk()
            ->assertJsonPath('data.data.0.user.name', $admin->name);
    }
}

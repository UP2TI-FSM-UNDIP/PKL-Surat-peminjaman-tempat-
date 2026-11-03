<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Keamanan autentikasi: register ditutup, login lokal dibatasi, role tidak bisa
 * diubah sendiri, dan role dari SSO (hanya admin SSO yang menjadi Admin).
 *
 * WAJIB dijalankan terhadap database uji terpisah (DB_DATABASE=booking_e2e,
 * DB_PORT=55432) yang sudah di-migrate + seed. Test menolak jalan di database lain.
 */
class AuthSecurityTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        if (getenv('DB_DATABASE') !== 'booking_e2e' || getenv('DB_PORT') !== '55432') {
            $this->markTestSkipped('Test ini hanya boleh jalan di database uji booking_e2e:55432');
        }

        parent::setUp();

        $conn = config('database.connections.' . config('database.default'));
        if (($conn['database'] ?? null) !== 'booking_e2e' || (string) ($conn['port'] ?? '') !== '55432') {
            $this->fail('Koneksi database bukan database uji. Dihentikan.');
        }
    }

    private function role(string $slug): int
    {
        return Role::where('slug', $slug)->value('id');
    }

    /** Data user yang dikembalikan SSO palsu (diganti per skenario). */
    private array $ssoPayload = [];
    private bool $ssoFaked = false;

    private function fakeSso(string $username, string $ssoRole, string $name = 'Pengguna SSO'): void
    {
        $this->ssoPayload = ['username' => $username, 'name' => $name, 'role' => $ssoRole];

        // Http::fake() bersifat menumpuk, jadi cukup dipasang sekali dan
        // membaca payload terkini.
        if (!$this->ssoFaked) {
            Http::fake(['*/users/me' => fn () => Http::response(['data' => $this->ssoPayload])]);
            $this->ssoFaked = true;
        }
    }

    // ------------------------------------------------------------- register

    public function test_register_publik_ditutup(): void
    {
        $before = User::count();

        $this->postJson('/api/register', [
            'name' => 'Penyusup', 'email' => 'penyusup@example.test',
            'password' => 'Password123!', 'password_confirmation' => 'Password123!',
            'role_id' => $this->role('admin'), 'unit_id' => 1,
        ])->assertNotFound();

        $this->assertSame($before, User::count());
    }

    // ---------------------------------------------------------- login lokal

    public function test_login_lokal_mati_secara_default(): void
    {
        config(['auth.local_login' => 'off']);

        $this->postJson('/api/login', ['email' => 'superadmin@fsm.undip.ac.id', 'password' => 'password'])
            ->assertForbidden()
            ->assertJsonPath('message', 'Login hanya melalui SSO FSM.');
    }

    public function test_mode_admin_hanya_menerima_akun_admin(): void
    {
        config(['auth.local_login' => 'admin']);
        User::where('email', 'superadmin@fsm.undip.ac.id')->first()->forceFill(['password' => bcrypt('Rahasia123!')])->save();
        User::where('email', 'sekretaris.hmif@student.undip.ac.id')->first()->forceFill(['password' => bcrypt('Rahasia123!')])->save();

        // Non-admin dengan password benar tetap ditolak, pesan sama seperti password salah
        $this->postJson('/api/login', ['email' => 'sekretaris.hmif@student.undip.ac.id', 'password' => 'Rahasia123!'])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', trans('auth.failed'));

        $this->postJson('/api/login', ['email' => 'superadmin@fsm.undip.ac.id', 'password' => 'Rahasia123!'])
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    // ------------------------------------------------------- update profil

    public function test_update_profil_tidak_bisa_mengubah_role(): void
    {
        $user = User::where('email', 'sekretaris.hmif@student.undip.ac.id')->first();
        $user->forceFill(['is_profile_completed' => false])->save();
        Sanctum::actingAs($user);

        $this->patchJson('/api/user/profile', [
            'name' => 'Nama Baru', 'nim_nip' => '24060199990001',
            'role_id' => $this->role('admin'), 'unit_id' => $user->unit_id,
        ])->assertOk();

        $user->refresh();
        $this->assertSame('sekretaris', $user->role->slug, 'role_id dari client harus diabaikan');
        $this->assertSame('Nama Baru', $user->name);
        $this->assertTrue((bool) $user->is_profile_completed);
    }

    public function test_unit_hanya_ormawa_saat_melengkapi_profil_dan_terkunci_setelahnya(): void
    {
        $user = User::create([
            'name' => 'Mahasiswa Baru', 'email' => 'baru-e2e@students.undip.ac.id', 'password' => bcrypt('x'),
            'role_id' => $this->role('sekretaris'), 'unit_id' => Unit::where('category', 'FAKULTAS')->value('id'),
            'is_profile_completed' => false,
        ]);
        Sanctum::actingAs($user);

        // Unit pimpinan (Departemen) tidak boleh dipilih sendiri
        $this->patchJson('/api/user/profile', [
            'name' => 'Mahasiswa Baru', 'nim_nip' => '24060199990002',
            'unit_id' => Unit::where('code', 'STAT')->value('id'),
        ])->assertStatus(422)->assertJsonValidationErrors('unit_id');

        // Unit ormawa boleh
        $hmif = Unit::where('code', 'HMIF')->value('id');
        $this->patchJson('/api/user/profile', [
            'name' => 'Mahasiswa Baru', 'nim_nip' => '24060199990002', 'unit_id' => $hmif,
        ])->assertOk();
        $this->assertSame($hmif, $user->fresh()->unit_id);

        // Setelah profil lengkap, unit tidak bisa diganti sendiri
        Sanctum::actingAs($user->fresh());
        $this->patchJson('/api/user/profile', [
            'name' => 'Mahasiswa Baru', 'nim_nip' => '24060199990002',
            'unit_id' => Unit::where('code', 'BEM-FSM')->value('id'),
        ])->assertStatus(422)->assertJsonValidationErrors('unit_id');
        $this->assertSame($hmif, $user->fresh()->unit_id);
    }

    // ------------------------------------------------------------------ SSO

    public function test_sso_hanya_admin_sso_yang_menjadi_admin(): void
    {
        $pending = 'menunggu-penetapan';
        foreach (['mahasiswa' => $pending, 'dosen' => $pending, 'staff' => $pending, 'superadmin' => 'admin', 'admin' => 'admin'] as $ssoRole => $expected) {
            $email = "sso-{$ssoRole}-e2e@undip.ac.id";
            $this->fakeSso($email, $ssoRole);

            $res = $this->withHeaders(['Authorization' => 'jwt-palsu'])->getJson('/auth/sso')->assertOk();
            $this->assertStringStartsWith('/redirect?token=', $res->json('callback_url'), 'Kontrak respons SSO tidak berubah');

            $user = User::where('email', $email)->firstOrFail();
            $this->assertSame($expected, $user->role->slug, "SSO role {$ssoRole}");
            $this->assertSame('FAKULTAS', $user->unit->category);
            $this->assertFalse((bool) $user->is_profile_completed);
        }

        // Email yang dulu dipaksa Admin tidak lagi otomatis Admin
        $this->fakeSso('tim8@undip.ac.id', 'mahasiswa');
        $this->withHeaders(['Authorization' => 'jwt-palsu'])->getJson('/auth/sso')->assertOk();
        $this->assertSame('menunggu-penetapan', User::where('email', 'tim8@undip.ac.id')->first()->role->slug);
    }

    public function test_akun_menunggu_penetapan_tidak_punya_akses_fitur(): void
    {
        $user = User::create([
            'name' => 'Akun Baru SSO', 'email' => 'pending-e2e@students.undip.ac.id', 'password' => bcrypt('x'),
            'role_id' => $this->role('menunggu-penetapan'), 'unit_id' => Unit::where('category', 'FAKULTAS')->value('id'),
            'is_profile_completed' => false,
        ]);
        Sanctum::actingAs($user);

        // Yang diizinkan: data diri, daftar unit (form profil), melengkapi profil
        $this->getJson('/api/user')->assertOk()->assertJsonPath('role.slug', 'menunggu-penetapan');
        $this->getJson('/api/units')->assertOk();
        $this->patchJson('/api/user/profile', [
            'name' => 'Akun Baru SSO', 'nim_nip' => '24060199990003', 'unit_id' => Unit::where('code', 'HMIF')->value('id'),
        ])->assertOk();
        $this->assertSame('menunggu-penetapan', $user->fresh()->role->slug, 'Melengkapi profil tidak mengubah role');

        // Fitur lain ditolak
        foreach (['/api/documents', '/api/rooms', '/api/room-bookings', '/api/workflows', '/api/users', '/api/signs'] as $url) {
            $this->getJson($url)->assertForbidden()->assertJsonPath('message', 'Akun Anda menunggu penetapan role oleh admin.');
        }
        $this->postJson('/api/documents', ['workflow_id' => 1, 'title' => 'x'])->assertForbidden();

        // Setelah admin menetapkan role, akses terbuka
        $user->forceFill(['role_id' => $this->role('sekretaris')])->save();
        Sanctum::actingAs($user->fresh());
        $this->getJson('/api/rooms')->assertOk();
    }

    public function test_sso_admin_menaikkan_akun_lama_tapi_tidak_menurunkan(): void
    {
        $user = User::where('email', 'sekretaris.hmif@student.undip.ac.id')->first();

        $this->fakeSso($user->email, 'superadmin');
        $this->withHeaders(['Authorization' => 'jwt-palsu'])->getJson('/auth/sso')->assertOk();
        $this->assertSame('admin', $user->fresh()->role->slug);

        // Role yang ditetapkan admin tidak diturunkan otomatis oleh SSO
        $this->fakeSso($user->email, 'mahasiswa');
        $this->withHeaders(['Authorization' => 'jwt-palsu'])->getJson('/auth/sso')->assertOk();
        $this->assertSame('admin', $user->fresh()->role->slug);
    }

    public function test_redirect_sso_tetap_ke_callback_frontend(): void
    {
        $this->get('/auth/sso/redirect?token=abc')
            ->assertRedirect()
            ->assertRedirectContains('/peminjaman-ruang/sso/callback?token=abc');
    }
}

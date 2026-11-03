<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Role awal untuk akun yang baru dibuat lewat SSO (bukan admin SSO).
     * Tanpa akses fitur sampai admin menetapkan role & unit sebenarnya.
     */
    public function up(): void
    {
        if (!DB::table('roles')->where('slug', 'menunggu-penetapan')->exists()) {
            DB::table('roles')->insert([
                'name' => 'Menunggu Penetapan',
                'slug' => 'menunggu-penetapan',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Hanya hapus jika tidak dipakai user mana pun
        $id = DB::table('roles')->where('slug', 'menunggu-penetapan')->value('id');
        if ($id && !DB::table('users')->where('role_id', $id)->exists()) {
            DB::table('roles')->where('id', $id)->delete();
        }
    }
};

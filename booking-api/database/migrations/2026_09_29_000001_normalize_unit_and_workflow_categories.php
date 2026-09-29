<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Seragamkan penulisan kategori menjadi huruf besar (mis. 'Senat' -> 'SENAT')
     * agar workflow bisa dicocokkan dengan kategori unit pengaju.
     */
    public function up(): void
    {
        DB::table('workflows')->update(['applies_to_category' => DB::raw('UPPER(applies_to_category)')]);
        DB::table('units')->update(['category' => DB::raw('UPPER(category)')]);
    }

    public function down(): void
    {
        // Tidak dapat dikembalikan ke penulisan semula; biarkan huruf besar.
    }
};

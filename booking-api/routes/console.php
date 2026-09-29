<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Lepas booking PENDING yang kadaluarsa (draft yang tidak pernah diajukan).
// Butuh cron: * * * * * php artisan schedule:run
Schedule::command('room:release-expired')->dailyAt('01:00');

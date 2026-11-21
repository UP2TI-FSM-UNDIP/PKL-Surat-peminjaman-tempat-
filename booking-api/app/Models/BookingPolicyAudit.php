<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingPolicyAudit extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'before_json' => 'array',
        'after_json' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

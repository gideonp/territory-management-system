<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class territoryModel extends Model
{
    protected $table = 'assignment';
    protected $primaryKey = 'id';
    public $timestamps = false;
    protected $fillable = [
        'brgy_name',
        'service_year',
        'territory_no',
        'last_completed',
        'assign_to',
        'date_assigned',
        'date_completed',
    ];
}

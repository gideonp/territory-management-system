<?php

use Illuminate\Http\Request;
use App\Http\Controllers\Home;
use Illuminate\Support\Facades\Route;


Route::post('/territory_records', [Home::class, 'store']);
Route::get('/territory_records/last_completed/desc', [Home::class, 'desOrder']);
Route::get('/territory_records/last_completed/asc', [Home::class, 'ascOrder']);
Route::get('/territory_records/last_completed/sort', [Home::class, 'sortByLastCompleted']);
Route::post('/territory_records/filter', [Home::class, 'filter']);
Route::put(
    '/territory_records/{id}',
    [Home::class, 'update']
);

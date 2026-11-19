
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Home;

Route::get('/', function () {
    return view('auth.login');
});

Route::get('/home', [Home::class, 'home']);
Route::get('/users', function () {
    return view('users.index');
});

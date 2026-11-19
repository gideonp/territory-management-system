<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\territoryModel;

class Home extends Controller
{
    public function home()
    {
        return view('home');
    }
    public function store(Request $request)
    {
        $records = $request->all();

        foreach ($records as $territoryNo => $record) {

            $data = validator($record, [
                'brgy_name' => ['required', 'string', 'max:255'],
                'assign_to' => ['required', 'string', 'max:255'],
                'last_completed' => ['nullable', 'string'],
                'date_assigned' => ['nullable', 'string'],
                'date_completed' => ['nullable', 'string'],
            ])->validate();

            $data['territory_no'] = $territoryNo;
            $data['service_year'] = '2027';

            // Convert dates
            // Convert MM-DD-YY → YYYY-MM-DD
            if (!empty($data['last_completed'])) {
                $data['last_completed'] = Carbon::createFromFormat(
                    'm-d-y',
                    $data['last_completed']
                )->format('Y-m-d');
            }

            if (!empty($data['date_assigned'])) {
                $data['date_assigned'] = Carbon::createFromFormat(
                    'm-d-y',
                    $data['date_assigned']
                )->format('Y-m-d');
            }

            if (!empty($data['date_completed'])) {
                $data['date_completed'] = Carbon::createFromFormat(
                    'm-d-y',
                    $data['date_completed']
                )->format('Y-m-d');
            }
            \App\Models\territoryModel::create($data);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Territory records assigned successfully'
        ]);
    }
    public function desOrder()
    {
        $records = territoryModel::orderBy('date_assigned', 'desc')->get();
        return response()->json($records);
    }
    public function ascOrder()
    {
        $records = territoryModel::orderBy('date_assigned', 'asc')->get();
        return response()->json($records);
    }
    public function sortByLastCompleted()
    {
        $records = territoryModel::orderBy('last_completed', 'asc')->whereNotNull('last_completed')->get();
        return response()->json($records);
    }
    public function sortByLastCompletedbyGroup()
    {
        $records = territoryModel::orderBy('last_completed', 'asc')->whereNotNull('last_completed')->get();
        return response()->json($records);
    }


    public function filter(Request $request)
    {
        $query = territoryModel::query();

        // ==============================
        // ASSIGNED TO
        // ==============================

        if ($request->filled('assigned_to')) {
            $query->where(
                'assign_to',
                $request->assigned_to
            );
        }


        // ==============================
        // DATE COMPLETED FILTER
        // ==============================

        if ($request->date_completed === 'completed') {

            $query->whereNotNull('date_completed');
        } elseif ($request->date_completed === 'not completed') {

            $query->whereNull('date_completed');
        }


        // ==============================
        // SORTING
        // ==============================

        $allowedColumns = [
            'brgy_name',
            'service_year',
            'territory_no',
            'last_completed',
            'assign_to',
            'date_assigned',
            'date_completed'
        ];

        $sortColumn = $request->sort_column ?? 'territory_no';
        $sortDirection = $request->sort_direction ?? 'asc';

        if (!in_array($sortColumn, $allowedColumns)) {
            $sortColumn = 'territory_no';
        }

        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }

        $query->orderBy($sortColumn, $sortDirection);


        // ==============================
        // GET DATA
        // ==============================

        $records = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $records
        ]);
    }
    public function update(Request $request, $id)
    {
        $record = territoryModel::findOrFail($id);

        $data = $request->validate([
            'last_completed' => ['nullable', 'date'],
            'assign_to' => ['required', 'string', 'max:255'],
            'date_assigned' => ['nullable', 'date'],
            'date_completed' => ['nullable', 'date'],
        ]);

        $record->update($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Territory record updated successfully',
            'data' => $record
        ]);
    }
}

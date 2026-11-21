<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PreviewBookingPolicyRequest;
use App\Http\Requests\Admin\RecalculateBookingPolicyRequest;
use App\Http\Requests\Admin\UpdateBookingPolicyRequest;
use App\Models\BookingPolicyAudit;
use App\Services\BookingPolicyService;

class BookingPolicyController extends Controller
{
    public function show(BookingPolicyService $service)
    {
        return response()->json(['success' => true, 'data' => $service->active()->load('tiers')]);
    }

    public function update(UpdateBookingPolicyRequest $request, BookingPolicyService $service)
    {
        $policy = $service->save($request->validated(), $request->user());

        return response()->json(['success' => true, 'message' => 'Kebijakan disimpan', 'data' => $policy]);
    }

    public function preview(PreviewBookingPolicyRequest $request, BookingPolicyService $service)
    {
        return response()->json(['success' => true, 'data' => $service->preview($request->validated(), $request->input('date'))]);
    }

    public function audits()
    {
        return response()->json(['success' => true, 'data' => BookingPolicyAudit::with('user:id,name')->latest('id')->paginate(20)]);
    }

    public function recalculate(RecalculateBookingPolicyRequest $request, BookingPolicyService $service)
    {
        return response()->json(['success' => true, 'data' => $service->recalculate(
            (bool) $request->boolean('dry_run', true),
            $request->input('policy_id'),
            $request->user()
        )]);
    }
}

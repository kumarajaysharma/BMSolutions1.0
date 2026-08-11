// src/app/[subdomain]/_components/IntakeForm.tsx
'use client';

import { useActionState } from 'react';
import { createClientRequest } from '@/app/actions';

const initialState = { success: false, error: undefined as string | undefined };

export function IntakeForm({ subsidiaryName, defaultPlan }: { subsidiaryName: string; defaultPlan: string }) {
  const [state, action, isPending] = useActionState(createClientRequest, initialState);

  if (state.success) {
    return (
      <div className="text-center py-8 space-y-2">
        <div className="text-emerald-400 font-semibold text-lg">Request Received</div>
        <p className="text-sm text-slate-400">Our team will initiate workspace provisioning within one business day.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="subsidiary" value={subsidiaryName} />
      <input type="hidden" name="requestedPlan" value={defaultPlan} />
      
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Company Name</label>
        <input required type="text" name="companyName" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500" placeholder="BNLV Group of Companies" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Contact Name</label>
          <input required type="text" name="contactName" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500" placeholder="Ajay Kumar" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
          <input required type="email" name="contactEmail" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500" placeholder="kumar.ajaysharma@gmail.com" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Project Scope / Requirements</label>
        <textarea rows={3} name="message" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500" placeholder="Specify infrastructure or module requirements..." />
      </div>

      {state.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors text-sm shadow-lg shadow-blue-600/20"
      >
        {isPending ? 'Submitting…' : 'Initialize Request & Provision Tenant'}
      </button>
    </form>
  );
}
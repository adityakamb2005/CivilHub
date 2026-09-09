'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createOpportunity, updateOpportunity, type AdminActionState } from '@/lib/admin/actions'
import type { Opportunity } from '@/types'
import { AdminSubmitButton } from './AdminSubmitButton'

const initialState: AdminActionState = {}

export function AdminOpportunityForm({ opportunity }: { opportunity?: Opportunity | null }) {
  const action = opportunity ? updateOpportunity.bind(null, opportunity.id) : createOpportunity
  const [state, formAction] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <div role="alert" className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-sm text-[var(--color-ch-red)]">{state.error}</div>}
      <div className="ch-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="title" className="ch-text-label">Title <span className="text-[var(--color-ch-red)]">*</span></label>
            <input id="title" name="title" required defaultValue={opportunity?.title || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="opportunity_type" className="ch-text-label">Opportunity type <span className="text-[var(--color-ch-red)]">*</span></label>
            <input id="opportunity_type" name="opportunity_type" required defaultValue={opportunity?.opportunity_type || ''} className="ch-input mt-1.5" placeholder="Job, tender, fellowship…" />
          </div>
          <div>
            <label htmlFor="organization_name" className="ch-text-label">Organization / client</label>
            <input id="organization_name" name="organization_name" defaultValue={opportunity?.organization_name || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="location" className="ch-text-label">Location</label>
            <input id="location" name="location" defaultValue={opportunity?.location || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="deadline" className="ch-text-label">Deadline</label>
            <input id="deadline" name="deadline" type="date" defaultValue={opportunity?.deadline || ''} className="ch-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="status" className="ch-text-label">Status</label>
            <select id="status" name="status" defaultValue={opportunity?.status || 'open'} className="ch-input mt-1.5 bg-white">
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="ch-text-label">Description <span className="text-[var(--color-ch-red)]">*</span></label>
            <textarea id="description" name="description" required rows={10} defaultValue={opportunity?.description || ''} className="ch-input mt-1.5 resize-y" />
          </div>
        </div>
        <label className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] cursor-pointer">
          <input type="checkbox" name="is_published" defaultChecked={opportunity?.is_published ?? false} className="mt-1 accent-[var(--color-ch-orange)]" />
          <span><span className="block text-sm font-semibold text-[var(--color-ch-navy)]">Publish opportunity</span><span className="block text-xs text-[var(--color-ch-text-secondary)] mt-1">Only published open opportunities appear publicly.</span></span>
        </label>
      </div>
      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/opportunities" className="ch-btn ch-btn-outline">Cancel</Link>
        <AdminSubmitButton label={opportunity ? 'Save changes' : 'Create opportunity'} />
      </div>
    </form>
  )
}

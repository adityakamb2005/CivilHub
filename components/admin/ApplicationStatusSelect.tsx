'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { updateApplicationStatus } from '@/lib/applications/actions'
import type { OpportunityApplication } from '@/types'

export function ApplicationStatusSelect({ applicationId, status }: { applicationId: string; status: OpportunityApplication['status'] }) {
  const [pending, startTransition] = useTransition()
  return (
    <label className="inline-flex items-center gap-2 text-xs text-[var(--color-ch-text-muted)]">
      <span className="sr-only">Application status</span>
      <select
        value={status}
        disabled={pending}
        onChange={(event) => startTransition(() => updateApplicationStatus(applicationId, event.target.value))}
        className="ch-input py-1.5 text-xs bg-white min-w-28"
      >
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
        <option value="withdrawn">Withdrawn</option>
      </select>
      {pending && <Loader2 size={14} className="animate-spin" />}
    </label>
  )
}

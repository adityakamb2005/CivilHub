'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { withdrawApplication } from '@/lib/applications/actions'

export function WithdrawApplicationButton({ applicationId, opportunityId }: { applicationId: string; opportunityId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm('Withdraw this pending application?')) {
          startTransition(() => withdrawApplication(applicationId, opportunityId))
        }
      }}
      className="ch-btn ch-btn-outline text-xs px-3 py-2"
    >
      {pending && <Loader2 size={13} className="animate-spin" />}
      {pending ? 'Withdrawing…' : 'Withdraw'}
    </button>
  )
}

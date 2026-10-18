'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { withdrawProjectApplication } from '@/lib/applications/projectActions'

export function WithdrawProjectApplicationButton({
  applicationId,
  projectId,
}: {
  applicationId: string
  projectId: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-2">
    {error && <p role="alert" className="text-xs text-[var(--color-ch-red)]">{error}</p>}
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm('Withdraw your pending project application?')) {
          setError(null)
          startTransition(async () => {
            const result = await withdrawProjectApplication(projectId, applicationId)
            setError(result.error || null)
          })
        }
      }}
      className="ch-btn ch-btn-outline text-xs px-3 py-2 text-[var(--color-ch-red)] border-[var(--color-ch-red)]/20 hover:bg-[var(--color-ch-red-light)] flex items-center gap-1.5"
    >
      {pending && <Loader2 size={13} className="animate-spin" />}
      {pending ? 'Withdrawing…' : 'Withdraw Application'}
    </button>
    </div>
  )
}

'use client'

import { useTransition } from 'react'
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

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm('Withdraw your pending project application?')) {
          startTransition(() => withdrawProjectApplication(projectId, applicationId))
        }
      }}
      className="ch-btn ch-btn-outline text-xs px-3 py-2 text-[var(--color-ch-red)] border-[var(--color-ch-red)]/20 hover:bg-[var(--color-ch-red-light)] flex items-center gap-1.5"
    >
      {pending && <Loader2 size={13} className="animate-spin" />}
      {pending ? 'Withdrawing…' : 'Withdraw Application'}
    </button>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { acceptProjectApplication, rejectProjectApplication } from '@/lib/applications/projectActions'

export function ClientApplicationActions({
  projectId,
  applicationId,
  status,
  isAssigned,
}: {
  projectId: string
  applicationId: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  isAssigned: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const accept = () => {
    setError(null)
    startTransition(async () => {
      const result = await acceptProjectApplication(projectId, applicationId)
      setError(result.error || null)
    })
  }

  if (status === 'accepted') {
    return (
      <div className="space-y-2">
        <span className="ch-badge ch-badge-green font-semibold inline-flex items-center gap-1">
        <Check size={13} /> Selected Engineer
        </span>
        {error && <><p role="alert" className="text-xs text-rose-700 max-w-sm">{error}</p><button type="button" disabled={isPending} onClick={accept} className="ch-btn ch-btn-outline text-xs">Retry acceptance</button></>}
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <span className="ch-badge bg-rose-50 text-rose-700 border-rose-200">
        Rejected
      </span>
    )
  }

  if (status === 'withdrawn') {
    return (
      <span className="ch-badge ch-badge-gray">
        Withdrawn by Engineer
      </span>
    )
  }

  return (
    <div className="space-y-2">
      {error && <p role="alert" className="text-xs text-rose-700 max-w-sm">{error}</p>}
      <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending || isAssigned}
        onClick={() => {
          if (
            window.confirm(
              'Accept this engineer for your project? Accepting will assign this engineer to the project and reject other pending applications.'
            )
          ) {
            accept()
          }
        }}
        className="ch-btn text-xs px-3 py-1.5 inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        Accept Engineer
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (window.confirm('Reject this engineer application?')) {
            setError(null)
            startTransition(async () => {
              const result = await rejectProjectApplication(projectId, applicationId)
              setError(result.error || null)
            })
          }
        }}
        className="ch-btn ch-btn-outline text-xs px-3 py-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 inline-flex items-center gap-1"
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
        Reject
      </button>
      </div>
    </div>
  )
}

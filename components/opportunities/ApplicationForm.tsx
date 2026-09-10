'use client'

import { useActionState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { submitApplication, type ApplicationActionState } from '@/lib/applications/actions'

const initialState: ApplicationActionState = {}

export function ApplicationForm({ opportunityId }: { opportunityId: string }) {
  const [state, formAction, pending] = useActionState(submitApplication, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="opportunity_id" value={opportunityId} />
      {state.error && (
        <div role="alert" className="p-3 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-sm text-[var(--color-ch-red)]">
          {state.error}
        </div>
      )}
      {state.success && (
        <div role="status" className="p-3 rounded-lg bg-[var(--color-ch-green-light)] border border-[var(--color-ch-green)]/20 text-sm text-[var(--color-ch-green)]">
          {state.success}
        </div>
      )}
      <div>
        <label htmlFor="cover_message" className="ch-text-label">Cover message</label>
        <textarea
          id="cover_message"
          name="cover_message"
          required
          minLength={20}
          maxLength={3000}
          rows={6}
          disabled={pending || Boolean(state.success)}
          className="ch-input mt-1.5 resize-y"
          placeholder="Briefly explain your interest and relevant experience."
          aria-describedby="cover-message-help"
        />
        <p id="cover-message-help" className="text-xs text-[var(--color-ch-text-muted)] mt-1.5">20–3,000 characters.</p>
      </div>
      <button type="submit" disabled={pending || Boolean(state.success)} className="ch-btn ch-btn-primary w-full sm:w-auto">
        {pending ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><Send size={16} /> Submit application</>}
      </button>
    </form>
  )
}

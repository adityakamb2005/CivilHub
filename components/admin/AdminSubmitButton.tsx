'use client'

import { Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

export function AdminSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className="ch-btn ch-btn-primary min-w-32">
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? 'Saving…' : label}
    </button>
  )
}

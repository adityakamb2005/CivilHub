'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccountUnavailablePage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    setError('')
    try {
      const { error } = await createClient().auth.signOut()
      if (error) throw error
      router.replace('/login')
      router.refresh()
    } catch {
      setError('Could not sign out. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="ch-card bg-white p-8 space-y-5">
      <h1 className="text-2xl font-bold">Your account is temporarily unavailable</h1>
      <p>We could not load your account permissions. Try again, or contact support if this continues.</p>
      {error && <p role="alert">{error}</p>}
      <div className="flex gap-3">
        <a href="/login" className="ch-btn ch-btn-outline">Try again</a>
        <button onClick={signOut} disabled={pending} className="ch-btn ch-btn-navy">{pending ? 'Signing out...' : 'Sign out'}</button>
      </div>
    </div>
  )
}

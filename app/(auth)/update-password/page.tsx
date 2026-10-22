'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    if (password !== confirmation) return setError('The passwords do not match.')
    setPending(true)
    try {
      const supabase = createClient()
      const { data: { user }, error: sessionError } = await supabase.auth.getUser()
      if (sessionError || !user) {
        setError('Your reset link has expired. Please request a new link.')
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError('Could not update your password. Try another password or request a new link.')
        return
      }
      setPassword('')
      setConfirmation('')
      setSuccess(true)
      router.refresh()
    } catch {
      setError('Could not reach the authentication server. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="ch-card bg-white p-8 space-y-5">
      <h1 className="text-2xl font-bold">Set a new password</h1>
      {success ? (
        <div role="status" className="space-y-4">
          <p>Your password has been updated.</p>
          <Link href="/login" className="ch-btn ch-btn-navy">Continue to your account</Link>
        </div>
      ) : (
        <form onSubmit={updatePassword} className="space-y-4">
          {error && <p role="alert">{error}</p>}
          <div>
            <label htmlFor="password" className="block mb-2">New password</label>
            <input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} className="ch-input" />
          </div>
          <div>
            <label htmlFor="confirmation" className="block mb-2">Confirm new password</label>
            <input id="confirmation" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={e => setConfirmation(e.target.value)} className="ch-input" />
          </div>
          <button type="submit" disabled={pending} className="ch-btn ch-btn-navy w-full">{pending ? 'Updating...' : 'Update password'}</button>
          <Link href="/forgot-password" className="block text-sm underline">Request a new reset link</Link>
        </form>
      )}
    </div>
  )
}

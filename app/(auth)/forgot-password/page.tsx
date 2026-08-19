'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (resetError) throw resetError

      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="ch-card p-8 sm:p-10 bg-white shadow-xl text-center">
        <div className="w-16 h-16 bg-[var(--color-ch-navy)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailCheck size={32} className="text-[var(--color-ch-navy)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-3">Check your email</h2>
        <p className="text-[var(--color-ch-text-secondary)] mb-8">
          We've sent password reset instructions to <span className="font-medium text-[var(--color-ch-navy)]">{email}</span>.
        </p>
        <Link href="/login" className="ch-btn ch-btn-outline w-full">
          Return to Login
        </Link>
      </div>
    )
  }

  return (
    <div className="ch-card p-8 sm:p-10 bg-white shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-2">Reset Password</h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)]">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-[var(--color-ch-red)] bg-[var(--color-ch-red-light)] rounded-md border border-red-100 flex items-start">
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block ch-text-label text-[var(--color-ch-navy)] mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ch-input"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="ch-btn ch-btn-navy w-full mt-2 py-2.5 text-base"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <Link href="/login" className="font-semibold text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors">
          &larr; Back to login
        </Link>
      </div>
    </div>
  )
}

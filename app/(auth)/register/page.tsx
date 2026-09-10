'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { HardHat, User, Loader2, Check } from 'lucide-react'

function RegisterForm() {
  const [role, setRole] = useState<'engineer' | 'client'>('client')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlRole = searchParams.get('role')
    if (urlRole === 'engineer') setRole('engineer')
    else if (urlRole === 'client') setRole('client')
  }, [searchParams])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (signUpError) throw signUpError

      // Supabase returns a session immediately when email confirmation is
      // disabled. In that case, take engineers directly to onboarding. When
      // confirmation is enabled, the callback route performs this redirect
      // after the email link is exchanged for a session.
      if (data.session) {
        router.push(role === 'engineer' ? '/engineer/profile' : '/client/dashboard')
        router.refresh()
        return
      }

      setIsSuccess(true)
    } catch (err: any) {
      // Distinguish a network/DNS failure from a real API error.
      // "Failed to fetch" / TypeError means the Supabase host is unreachable —
      // the project may be paused, deleted, or the URL in .env.local is wrong.
      const isNetworkFailure =
        err instanceof TypeError ||
        (typeof err.message === 'string' &&
          (err.message.toLowerCase().includes('failed to fetch') ||
            err.message.toLowerCase().includes('networkerror') ||
            err.message.toLowerCase().includes('network request failed')))

      if (isNetworkFailure) {
        setError(
          'Cannot reach the authentication server. ' +
          'The Supabase project may be paused or deleted. ' +
          'Please check NEXT_PUBLIC_SUPABASE_URL in .env.local and ensure the project is active at supabase.com.'
        )
      } else {
        setError(err.message || 'Failed to create account')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="ch-card p-8 sm:p-10 bg-white shadow-xl text-center">
        <div className="w-16 h-16 bg-[var(--color-ch-green-light)] rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-[var(--color-ch-green)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-3">Check your email</h2>
        <p className="text-[var(--color-ch-text-secondary)] mb-8">
          We've sent a confirmation link to <span className="font-medium text-[var(--color-ch-navy)]">{email}</span>.
          Please click the link to activate your account.
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
        <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-2">Join CivilHub</h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)]">
          Create an account to connect with the construction ecosystem.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-[var(--color-ch-red)] bg-[var(--color-ch-red-light)] rounded-md border border-red-100 flex items-start">
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector */}
        <div>
          <label className="block ch-text-label text-[var(--color-ch-navy)] mb-3">
            I am joining as:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={role === 'client'}
              onClick={() => setRole('client')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                role === 'client'
                  ? 'border-[var(--color-ch-navy)] bg-slate-50 shadow-sm'
                  : 'border-[var(--color-ch-border)] bg-white hover:border-slate-300'
              }`}
            >
              <User size={24} className={`mb-2 ${role === 'client' ? 'text-[var(--color-ch-navy)]' : 'text-slate-400'}`} />
              <span className={`font-semibold text-sm ${role === 'client' ? 'text-[var(--color-ch-navy)]' : 'text-slate-500'}`}>A Client</span>
              <span className="text-[10px] text-slate-400 mt-1">Hire engineers & track projects</span>
            </button>
            <button
              type="button"
              aria-pressed={role === 'engineer'}
              onClick={() => setRole('engineer')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                role === 'engineer'
                  ? 'border-[var(--color-ch-orange)] bg-[var(--color-ch-orange-light)] shadow-sm'
                  : 'border-[var(--color-ch-border)] bg-white hover:border-slate-300'
              }`}
            >
              <HardHat size={24} className={`mb-2 ${role === 'engineer' ? 'text-[var(--color-ch-orange)]' : 'text-slate-400'}`} />
              <span className={`font-semibold text-sm ${role === 'engineer' ? 'text-[var(--color-ch-orange)]' : 'text-slate-500'}`}>An Engineer</span>
              <span className="text-[10px] text-slate-400 mt-1">Find work & manage builds</span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className="block ch-text-label text-[var(--color-ch-navy)] mb-1.5">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="ch-input"
            placeholder="John Doe"
          />
        </div>

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

        <div>
          <label htmlFor="password" className="block ch-text-label text-[var(--color-ch-navy)] mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ch-input"
            placeholder="Min. 6 characters"
          />
        </div>
        
        <div className="flex items-start gap-2 pt-2">
          <input 
            type="checkbox" 
            id="terms" 
            required
            className="mt-1 w-4 h-4 rounded border-[var(--color-ch-border)] text-[var(--color-ch-navy)] focus:ring-[var(--color-ch-navy)]"
          />
          <label htmlFor="terms" className="text-xs text-[var(--color-ch-text-secondary)] leading-tight">
            I agree to the <Link href="/terms" className="text-[var(--color-ch-navy)] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[var(--color-ch-navy)] hover:underline">Privacy Policy</Link>.
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="ch-btn ch-btn-navy w-full py-2.5 text-base mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-[var(--color-ch-text-secondary)]">Already have an account? </span>
        <Link href="/login" className="font-semibold text-[var(--color-ch-navy)] hover:underline">
          Log In
        </Link>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin text-[var(--color-ch-navy)]" size={32} /></div>}>
      <RegisterForm />
    </Suspense>
  )
}

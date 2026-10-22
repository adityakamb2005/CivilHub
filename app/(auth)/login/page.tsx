'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { safeRedirectPath } from '@/lib/auth/redirectPath'
import { Loader2 } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = safeRedirectPath(searchParams.get('redirect'))

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // Read the canonical role from profiles. Auth metadata can be missing or
      // stale for users created before role-aware onboarding was introduced.
      if (redirectUrl === '/') {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()
        const role = (profile as { role?: string } | null)?.role
        if (role === 'engineer') router.push('/engineer/dashboard')
        else if (role === 'admin') router.push('/admin/dashboard')
        else if (role === 'client') router.push('/client/dashboard')
        else router.push('/account-unavailable')
      } else {
        router.push(redirectUrl)
      }
      
      router.refresh() // Refresh layout to pick up new session
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="ch-card p-8 sm:p-10 bg-white shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-2">Welcome back</h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)]">
          Log in to your CivilHub account to continue.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block ch-text-label text-[var(--color-ch-navy)]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ch-input"
            placeholder="••••••••"
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
              Logging in...
            </>
          ) : (
            'Log In'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-[var(--color-ch-text-secondary)]">Don't have an account? </span>
        <Link href="/register" className="font-semibold text-[var(--color-ch-navy)] hover:underline">
          Join CivilHub
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin text-[var(--color-ch-navy)]" size={32} /></div>}>
      <LoginForm />
    </Suspense>
  )
}

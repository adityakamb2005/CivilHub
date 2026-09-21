'use client'

import { Database } from '@/types/database'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Profile = Database['public']['Tables']['profiles']['Row']
type ClientProfile = Database['public']['Tables']['client_profiles']['Row']

export function ClientProfileCompletionCard({
  profile,
  clientProfile,
}: {
  profile: Profile | null
  clientProfile: ClientProfile | null
}) {
  const calculateCompletion = () => {
    if (!profile) return 0

    let completed = 0
    const total = 6

    if (profile.full_name) completed++
    if (profile.avatar_url) completed++
    if (profile.location) completed++
    if (profile.phone) completed++
    if (clientProfile?.company) completed++
    if (clientProfile?.about) completed++

    return Math.round((completed / total) * 100)
  }

  const completion = calculateCompletion()
  const isComplete = completion === 100

  return (
    <div className="ch-card p-6 flex flex-col h-full animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-1">
            Profile Completion
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)]">
            {isComplete
              ? 'Your profile is fully complete!'
              : 'Complete your profile to get the most out of CivilHub.'}
          </p>
        </div>
        <div className="text-2xl font-bold text-[var(--color-ch-orange)]">
          {completion}%
        </div>
      </div>

      <div className="w-full bg-[var(--color-ch-surface)] rounded-full h-3 mb-6 overflow-hidden">
        <div
          className="bg-[var(--color-ch-orange)] h-3 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${completion}%` }}
        />
      </div>

      <div className="mt-auto">
        <Link
          href="/client/profile"
          className="ch-btn ch-btn-outline w-full justify-between group"
        >
          <span>{isComplete ? 'Update Profile' : 'Continue Profile Setup'}</span>
          <ChevronRight size={16} className="text-[var(--color-ch-text-muted)] group-hover:text-[var(--color-ch-navy)] transition-colors" />
        </Link>
      </div>
    </div>
  )
}

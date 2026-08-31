'use client'

import { Database } from '@/types/database'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Profile = Database['public']['Tables']['profiles']['Row']
type EngineerProfile = Database['public']['Tables']['engineer_profiles']['Row']

export function ProfileCompletionCard({ 
  profile, 
  engineerProfile 
}: { 
  profile: Profile | null, 
  engineerProfile: EngineerProfile | null 
}) {
  const calculateCompletion = () => {
    if (!profile || !engineerProfile) return 0
    
    let completed = 0
    let total = 8
    
    if (profile.full_name) completed++
    if (engineerProfile.title) completed++
    if (engineerProfile.specialization) completed++
    if (engineerProfile.about) completed++
    if (profile.location) completed++
    if (engineerProfile.years_experience !== null) completed++
    if (profile.avatar_url) completed++
    if (engineerProfile.visibility) completed++
      
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
              ? "Your profile is fully complete!"
              : "Complete your profile to help clients discover you."}
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
          href="/engineer/dashboard" // Route to editor when it exists
          className="ch-btn ch-btn-outline w-full justify-between group disabled:opacity-50 disabled:pointer-events-none"
          aria-disabled="true"
          onClick={(e) => e.preventDefault()} // Disabled for this phase
        >
          <span>{isComplete ? "Update Profile" : "Continue Profile Setup"}</span>
          <ChevronRight size={16} className="text-[var(--color-ch-text-muted)] group-hover:text-[var(--color-ch-navy)] transition-colors" />
        </Link>
        <p className="text-xs text-center text-[var(--color-ch-text-muted)] mt-2">
          Profile editor coming soon
        </p>
      </div>
    </div>
  )
}

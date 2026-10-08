'use client'

import { Database } from '@/types/database'
import { HardHat, MapPin, Briefcase } from 'lucide-react'
import Link from 'next/link'

type Profile = Database['public']['Tables']['profiles']['Row']
type EngineerProfile = Database['public']['Tables']['engineer_profiles']['Row']

export function ProfilePreview({ 
  profile, 
  engineerProfile 
}: { 
  profile: Profile | null, 
  engineerProfile: EngineerProfile | null 
}) {
  if (!engineerProfile) {
    return (
      <div className="ch-card p-8 flex flex-col items-center justify-center text-center animate-fade-in bg-gradient-to-b from-white to-[var(--color-ch-surface)]">
        <div className="w-16 h-16 bg-[var(--color-ch-orange-light)] rounded-full flex items-center justify-center mb-4">
          <HardHat size={28} className="text-[var(--color-ch-orange)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
          Complete your professional profile
        </h2>
        <p className="text-[var(--color-ch-text-secondary)] mb-6 max-w-sm mx-auto">
          Add your professional details so clients can discover your expertise on CivilHub.
        </p>
        <Link 
          href="/engineer/profile"
          className="ch-btn ch-btn-primary"
        >
          Complete Profile
        </Link>
      </div>
    )
  }

  const displayName = profile?.full_name || 'Engineer'
  
  return (
    <div className="ch-card overflow-hidden animate-fade-in flex flex-col">
      <div className="h-24 bg-gradient-to-r from-[var(--color-ch-navy)] to-[var(--color-ch-charcoal)] relative">
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 bg-white rounded-full p-1 shadow-md">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={displayName} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--color-ch-surface)] flex items-center justify-center text-[var(--color-ch-navy)] font-bold text-2xl border border-[var(--color-ch-border)]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="pt-14 pb-6 px-6 flex-1 flex flex-col">
        <div className="mb-4 flex justify-between items-start">
          <div>
            <h2 className="min-w-0 break-words text-xl font-bold text-[var(--color-ch-navy)]">
              {displayName}
            </h2>
            <p className="min-w-0 break-words text-sm font-medium text-[var(--color-ch-orange)]">
              {engineerProfile.title || 'Civil Engineer'}
            </p>
          </div>
          {engineerProfile.visibility === 'public' && (
            <span className="ch-badge ch-badge-green text-xs">Public</span>
          )}
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)]">
            <MapPin size={16} className="text-[var(--color-ch-text-muted)]" />
            <span className="min-w-0 break-words">{profile?.location || 'Location not specified'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)]">
            <HardHat size={16} className="text-[var(--color-ch-text-muted)]" />
            <span className="min-w-0 break-words">{engineerProfile.specialization || 'Specialization not specified'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)]">
            <Briefcase size={16} className="text-[var(--color-ch-text-muted)]" />
            <span>
              {engineerProfile.years_experience !== null 
                ? `${engineerProfile.years_experience} Years Experience` 
                : 'Experience not specified'}
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <h3 className="text-sm font-semibold text-[var(--color-ch-navy)] mb-2">About</h3>
          <p className="break-words text-sm text-[var(--color-ch-text-secondary)] line-clamp-3">
            {engineerProfile.about || 'No description provided.'}
          </p>
        </div>
      </div>
    </div>
  )
}

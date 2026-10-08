import { Database } from '@/types/database'
import { BadgeCheck, Eye, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react'

type EngineerProfile = Database['public']['Tables']['engineer_profiles']['Row']

export function ProfileStatusCard({ 
  engineerProfile 
}: { 
  engineerProfile: EngineerProfile | null 
}) {
  if (!engineerProfile) {
    return (
      <div className="ch-card p-6 flex flex-col items-center justify-center text-center animate-fade-in text-[var(--color-ch-text-muted)]">
        <ShieldAlert size={32} className="mb-2 opacity-50" />
        <p>No profile data available.</p>
        <p className="text-sm">Complete your setup to see status.</p>
      </div>
    )
  }

  return (
    <div className="ch-card p-6 flex flex-col animate-fade-in">
      <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-4">
        Status Overview
      </h2>
      
      <div className="space-y-4 flex-1">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-3 border-b border-[var(--color-ch-border-subtle)]">
          <span className="text-sm text-[var(--color-ch-text-secondary)]">Visibility</span>
          <div className="flex min-w-0 items-center gap-1.5">
            {engineerProfile.visibility === 'public' ? (
              <>
                <Eye size={14} className="text-[var(--color-ch-green)]" />
                <span className="text-sm font-medium text-[var(--color-ch-text-primary)] capitalize">Public</span>
              </>
            ) : (
              <>
                <EyeOff size={14} className="text-[var(--color-ch-text-muted)]" />
                <span className="text-sm font-medium text-[var(--color-ch-text-primary)] capitalize">Private</span>
              </>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-3 border-b border-[var(--color-ch-border-subtle)]">
          <span className="text-sm text-[var(--color-ch-text-secondary)]">Verification</span>
          <div className="flex min-w-0 items-center gap-1.5">
            {engineerProfile.is_verified ? (
              <>
                <BadgeCheck size={14} className="text-[var(--color-ch-green)]" />
                <span className="text-sm font-medium text-[var(--color-ch-green)]">Verified</span>
              </>
            ) : (
              <>
                <ShieldAlert size={14} className="text-[var(--color-ch-orange)]" />
                <span className="text-sm font-medium text-[var(--color-ch-text-primary)]">Unverified</span>
              </>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-3 border-b border-[var(--color-ch-border-subtle)]">
          <span className="text-sm text-[var(--color-ch-text-secondary)]">Specialization</span>
          <span className="min-w-0 max-w-full break-words text-sm font-medium text-[var(--color-ch-text-primary)] text-right">
            {engineerProfile.specialization || <span className="text-[var(--color-ch-text-muted)]">Not set</span>}
          </span>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-sm text-[var(--color-ch-text-secondary)]">Experience</span>
          <span className="text-sm font-medium text-[var(--color-ch-text-primary)]">
            {engineerProfile.years_experience !== null ? `${engineerProfile.years_experience} Years` : <span className="text-[var(--color-ch-text-muted)]">Not set</span>}
          </span>
        </div>
      </div>
    </div>
  )
}

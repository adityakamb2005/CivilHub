'use client'

import { Database } from '@/types/database'
import { CheckCircle2, AlertCircle, ChevronRight, ArrowRight, FolderKanban } from 'lucide-react'
import Link from 'next/link'

type Profile = Database['public']['Tables']['profiles']['Row']
type EngineerProfile = Database['public']['Tables']['engineer_profiles']['Row']

interface SectionStatus {
  name: string
  completed: boolean
  link: string
  recommendation: string
}

export function ProfileCompletionCard({
  profile,
  engineerProfile,
  portfolioCount = 0,
}: {
  profile: Profile | null
  engineerProfile: EngineerProfile | null
  portfolioCount?: number
}) {
  const getSections = (): SectionStatus[] => {
    if (!profile || !engineerProfile) return []

    const engSkills = (engineerProfile as any).skills || []
    const engEdu = (engineerProfile as any).education || []
    const engCert = (engineerProfile as any).certifications || []
    const engWork = (engineerProfile as any).work_experience || []

    return [
      {
        name: 'Basic Info & Location',
        completed: Boolean(profile.full_name && profile.location),
        link: '/engineer/profile#basic-info',
        recommendation: 'Add your location & full display name',
      },
      {
        name: 'Professional Summary',
        completed: Boolean(engineerProfile.about && engineerProfile.about.trim().length >= 30),
        link: '/engineer/profile#summary',
        recommendation: 'Write an overview of your engineering background',
      },
      {
        name: 'Discipline & Skills',
        completed: Boolean(engineerProfile.specialization && engSkills.length > 0),
        link: '/engineer/profile#skills',
        recommendation: 'Select primary engineering discipline and list core technical skills',
      },
      {
        name: 'Work Experience',
        completed: Boolean(engineerProfile.years_experience !== null && (engWork.length > 0 || (engineerProfile.years_experience || 0) > 0)),
        link: '/engineer/profile#experience',
        recommendation: 'Add years of experience or work history details',
      },
      {
        name: 'Education & Certifications',
        completed: Boolean(engEdu.length > 0 || engCert.length > 0),
        link: '/engineer/profile#education',
        recommendation: 'Add degree, university, or engineering licenses/certifications',
      },
      {
        name: 'Portfolio Projects',
        completed: portfolioCount > 0,
        link: '/engineer/profile#portfolio',
        recommendation: 'Add at least 1 project to showcase in your portfolio',
      },
    ]
  }

  const sections = getSections()
  const completedCount = sections.filter((s) => s.completed).length
  const totalCount = sections.length || 6
  const completion = Math.round((completedCount / totalCount) * 100)
  const isComplete = completion === 100

  const missingSections = sections.filter((s) => !s.completed)

  return (
    <div className="ch-card p-6 flex flex-col h-full animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-1">
            Profile Completion
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)]">
            {isComplete
              ? 'Your professional profile is fully complete!'
              : `${completedCount} of ${totalCount} sections completed. Add missing sections to stand out to clients.`}
          </p>
        </div>
        <div className="text-2xl font-bold text-[var(--color-ch-orange)]">
          {completion}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[var(--color-ch-surface)] rounded-full h-3 mb-5 overflow-hidden border border-[var(--color-ch-border-subtle)]">
        <div
          className="bg-[var(--color-ch-orange)] h-3 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${completion}%` }}
        />
      </div>

      {/* Recommended Missing Sections */}
      {!isComplete && missingSections.length > 0 && (
        <div className="mb-6 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ch-text-muted)] block">
            Recommended Action Steps:
          </span>
          <div className="space-y-2">
            {missingSections.slice(0, 3).map((sec) => (
              <Link
                key={sec.name}
                href={sec.link}
                className="p-3 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] hover:border-[var(--color-ch-orange)] flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-[var(--color-ch-orange)] shrink-0" />
                  <div>
                    <span className="font-semibold text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)]">
                      {sec.name}
                    </span>
                    <span className="block text-[11px] text-[var(--color-ch-text-secondary)]">
                      {sec.recommendation}
                    </span>
                  </div>
                </div>
                <ArrowRight size={13} className="text-[var(--color-ch-text-muted)] group-hover:text-[var(--color-ch-orange)] shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {isComplete && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 mb-6">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Your profile meets all recommendations for public discoverability.</span>
        </div>
      )}

      <div className="mt-auto pt-2">
        <Link
          href="/engineer/profile"
          className="ch-btn ch-btn-outline w-full justify-between group text-xs"
        >
          <span>{isComplete ? 'Manage Profile & Portfolio' : 'Complete Recommended Sections'}</span>
          <ChevronRight size={16} className="text-[var(--color-ch-text-muted)] group-hover:text-[var(--color-ch-navy)] transition-colors" />
        </Link>
      </div>
    </div>
  )
}

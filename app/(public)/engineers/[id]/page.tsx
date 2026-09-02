import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Database } from '@/types/database'
import type { Metadata } from 'next'
import Link from 'next/link'
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  HardHat, 
  Globe, 
  Linkedin, 
  BadgeCheck, 
  Building2, 
  Calendar,
  CheckCircle2
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']
type EngineerProfile = Database['public']['Tables']['engineer_profiles']['Row']

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  const p = profile as Profile | null

  if (!p || p.role !== 'engineer') {
    return { title: 'Engineer Profile | CivilHub' }
  }

  const { data: engData } = await supabase
    .from('engineer_profiles')
    .select('*')
    .eq('profile_id', id)
    .maybeSingle()

  const eng = engData as EngineerProfile | null

  if (!eng || eng.visibility !== 'public') {
    return { title: 'Engineer Profile | CivilHub' }
  }

  const displayName = p.full_name || 'Civil Engineer'
  const title = eng.title || 'Civil Engineering Professional'

  return {
    title: `${displayName} — ${title} | CivilHub`,
    description: eng.about 
      ? eng.about.slice(0, 160) 
      : `View ${displayName}'s professional civil engineering profile and expertise on CivilHub.`,
  }
}

export default async function PublicEngineerProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  const profile = profileData as Profile | null

  if (!profile || profile.role !== 'engineer') {
    notFound()
  }

  // 2. Fetch engineer profile (Must be PUBLIC)
  const { data: engData } = await supabase
    .from('engineer_profiles')
    .select('*')
    .eq('profile_id', id)
    .maybeSingle()

  const engineerProfile = engData as EngineerProfile | null

  // STRICT SECURITY: If engineer_profiles is missing or visibility is not public, return 404
  if (!engineerProfile || engineerProfile.visibility !== 'public') {
    notFound()
  }

  const displayName = profile.full_name || 'Civil Engineer'

  return (
    <div className="ch-section py-8 sm:py-12">
      <div className="ch-container max-w-5xl">
        {/* Back Link */}
        <Link 
          href="/engineers"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Engineer Directory
        </Link>

        {/* Profile Banner Card */}
        <div className="ch-card overflow-hidden mb-8 shadow-sm">
          {/* Header Banner Background */}
          <div className="h-32 bg-gradient-to-r from-[var(--color-ch-navy)] via-[var(--color-ch-charcoal)] to-[#1E293B] relative" />

          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-6">
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-1 shadow-md border-2 border-white shrink-0">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[var(--color-ch-orange-light)] flex items-center justify-center text-[var(--color-ch-orange)] font-bold text-3xl border border-[var(--color-ch-orange)]/20">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Badges / Header meta */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {engineerProfile.is_verified && (
                  <span className="ch-badge ch-badge-green text-xs gap-1 py-1 px-3">
                    <BadgeCheck size={14} />
                    Verified Engineer
                  </span>
                )}
                {engineerProfile.specialization && (
                  <span className="ch-badge ch-badge-orange text-xs py-1 px-3">
                    {engineerProfile.specialization}
                  </span>
                )}
              </div>
            </div>

            {/* Name & Title */}
            <div className="space-y-1 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-ch-navy)] tracking-tight">
                {displayName}
              </h1>
              <p className="text-lg font-medium text-[var(--color-ch-orange)]">
                {engineerProfile.title || 'Civil Engineer'}
              </p>
            </div>

            {/* Quick Meta Info */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-[var(--color-ch-text-secondary)] border-t border-[var(--color-ch-border-subtle)] pt-4">
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-[var(--color-ch-text-muted)] shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}
              {engineerProfile.years_experience !== null && engineerProfile.years_experience !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Briefcase size={16} className="text-[var(--color-ch-text-muted)] shrink-0" />
                  <span>{engineerProfile.years_experience} Years Experience</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <HardHat size={16} className="text-[var(--color-ch-text-muted)] shrink-0" />
                <span>CivilHub Professional</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="ch-card p-6 sm:p-8">
              <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-4 flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
                <HardHat size={18} className="text-[var(--color-ch-orange)]" />
                About & Overview
              </h2>
              {engineerProfile.about ? (
                <p className="text-[var(--color-ch-text-secondary)] leading-relaxed whitespace-pre-line">
                  {engineerProfile.about}
                </p>
              ) : (
                <p className="text-[var(--color-ch-text-muted)] italic">
                  No professional summary has been provided yet.
                </p>
              )}
            </div>

            {/* Specialization Details */}
            <div className="ch-card p-6 sm:p-8">
              <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-4 flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
                <Building2 size={18} className="text-[var(--color-ch-orange)]" />
                Core Qualifications
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)]">
                  <div className="text-xs text-[var(--color-ch-text-muted)] mb-1">Primary Discipline</div>
                  <div className="font-semibold text-[var(--color-ch-navy)]">
                    {engineerProfile.specialization || 'General Civil Engineering'}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)]">
                  <div className="text-xs text-[var(--color-ch-text-muted)] mb-1">Experience Level</div>
                  <div className="font-semibold text-[var(--color-ch-navy)]">
                    {engineerProfile.years_experience !== null ? `${engineerProfile.years_experience} Years in Industry` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Online Links Card */}
            {(engineerProfile.website_url || engineerProfile.linkedin_url) && (
              <div className="ch-card p-6">
                <h3 className="text-md font-bold text-[var(--color-ch-navy)] mb-4 border-b border-[var(--color-ch-border-subtle)] pb-3">
                  Online Links
                </h3>
                <div className="space-y-3">
                  {engineerProfile.website_url && (
                    <a
                      href={engineerProfile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-ch-border)] hover:border-[var(--color-ch-orange)] hover:bg-[var(--color-ch-orange-light)]/20 transition-all text-sm group"
                    >
                      <Globe size={18} className="text-[var(--color-ch-orange)] shrink-0" />
                      <span className="truncate text-[var(--color-ch-text-primary)] group-hover:text-[var(--color-ch-navy)] font-medium">
                        Official Website
                      </span>
                    </a>
                  )}
                  {engineerProfile.linkedin_url && (
                    <a
                      href={engineerProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-ch-border)] hover:border-[#0A66C2] hover:bg-blue-50/50 transition-all text-sm group"
                    >
                      <Linkedin size={18} className="text-[#0A66C2] shrink-0" />
                      <span className="truncate text-[var(--color-ch-text-primary)] group-hover:text-[#0A66C2] font-medium">
                        LinkedIn Profile
                      </span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Client CTA Card */}
            <div className="ch-card p-6 bg-gradient-to-br from-white to-[var(--color-ch-surface)] border-2 border-[var(--color-ch-orange)]/20">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-ch-orange-light)] flex items-center justify-center mb-3">
                <CheckCircle2 size={20} className="text-[var(--color-ch-orange)]" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-ch-navy)] mb-2">
                Need Civil Engineering Expertise?
              </h3>
              <p className="text-xs text-[var(--color-ch-text-secondary)] mb-4 leading-relaxed">
                Connect with verified engineers and manage your construction projects seamlessly on CivilHub.
              </p>
              <Link href="/register?role=client" className="ch-btn ch-btn-primary w-full text-xs py-2.5">
                Join as a Client
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

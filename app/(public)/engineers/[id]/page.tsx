import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Database } from '@/types/database'
import type { EngineerPortfolio } from '@/types'
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
  CheckCircle2,
  GraduationCap,
  Award,
  FolderKanban,
  ExternalLink,
  CalendarCheck
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
      : `View ${displayName}'s professional civil engineering profile and portfolio on CivilHub.`,
  }
}

export default async function PublicEngineerProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const db = supabase as any

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

  // 3. Fetch portfolio items for this engineer
  const { data: rawPortfolio } = await db
    .from('engineer_portfolios')
    .select('*')
    .eq('engineer_profile_id', engineerProfile.id)
    .order('created_at', { ascending: false })

  const portfolioItems: EngineerPortfolio[] = (rawPortfolio || []) as EngineerPortfolio[]

  const displayName = profile.full_name || 'Civil Engineer'
  const skillsList: string[] = (engineerProfile as any).skills || []
  const educationList: any[] = (engineerProfile as any).education || []
  const certList: any[] = (engineerProfile as any).certifications || []
  const workList: any[] = (engineerProfile as any).work_experience || []

  return (
    <div className="ch-section py-8 sm:py-12">
      <div className="ch-container max-w-5xl space-y-8">
        {/* Back Link */}
        <Link 
          href="/engineers"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors font-medium"
        >
          <ArrowLeft size={16} />
          Back to Engineer Directory
        </Link>

        {/* Profile Banner Card */}
        <div className="ch-card overflow-hidden shadow-sm">
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
                {engineerProfile.is_available && (
                  <span className="ch-badge bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1 py-1 px-3">
                    <CalendarCheck size={14} /> Available for Projects
                  </span>
                )}
                {engineerProfile.is_verified && (
                  <span className="ch-badge ch-badge-green text-xs gap-1 py-1 px-3">
                    <BadgeCheck size={14} /> Verified Engineer
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
            <div className="ch-card p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
                <HardHat size={18} className="text-[var(--color-ch-orange)]" />
                About & Professional Summary
              </h2>
              {engineerProfile.about ? (
                <p className="text-[var(--color-ch-text-secondary)] text-sm leading-relaxed whitespace-pre-line">
                  {engineerProfile.about}
                </p>
              ) : (
                <p className="text-xs text-[var(--color-ch-text-muted)] italic">
                  No professional summary has been provided yet.
                </p>
              )}
            </div>

            {/* Technical Skills */}
            {skillsList.length > 0 && (
              <div className="ch-card p-6 sm:p-8 space-y-4">
                <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
                  <Award size={18} className="text-[var(--color-ch-orange)]" />
                  Technical Skills & Software Tools
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {skillsList.map((sk) => (
                    <span key={sk} className="ch-badge bg-slate-100 text-slate-800 text-xs px-3 py-1 font-medium border border-slate-200">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Engineering Portfolio Projects */}
            <div className="ch-card p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
                <FolderKanban size={18} className="text-[var(--color-ch-orange)]" />
                Engineering Portfolio ({portfolioItems.length})
              </h2>

              {portfolioItems.length === 0 ? (
                <p className="text-xs text-[var(--color-ch-text-muted)] italic">
                  No portfolio project entries listed yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {portfolioItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-xl border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-base text-[var(--color-ch-navy)]">
                            {item.title}
                          </h3>
                          <p className="text-xs font-medium text-[var(--color-ch-text-secondary)] mt-0.5">
                            {item.short_description}
                          </p>
                        </div>
                        {item.project_date && (
                          <span className="text-xs text-[var(--color-ch-text-muted)] shrink-0 inline-flex items-center gap-1">
                            <Calendar size={13} /> {new Date(item.project_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>

                      {item.detailed_description && (
                        <p className="text-xs text-[var(--color-ch-text-secondary)] leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-[var(--color-ch-border-subtle)]">
                          {item.detailed_description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.skills && item.skills.map((sk) => (
                            <span key={sk} className="ch-badge bg-white text-slate-700 text-[11px] border border-slate-200">
                              {sk}
                            </span>
                          ))}
                        </div>

                        {item.project_url && (
                          <a
                            href={item.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-ch-orange)] hover:underline inline-flex items-center gap-1 font-medium ml-auto"
                          >
                            Project URL <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Work History */}
            {workList.length > 0 && (
              <div className="ch-card p-6 sm:p-8 space-y-4">
                <h2 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
                  <Briefcase size={18} className="text-[var(--color-ch-orange)]" />
                  Work Experience & Positions
                </h2>
                <div className="space-y-4">
                  {workList.map((w, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-[var(--color-ch-border-subtle)] bg-[var(--color-ch-surface)] space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-[var(--color-ch-navy)]">
                          {w.position_title}
                        </h3>
                        <span className="text-xs text-[var(--color-ch-text-muted)]">
                          {w.start_date || 'N/A'} – {w.end_date || 'Present'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[var(--color-ch-orange)]">
                        {w.company_name} {w.location ? `· ${w.location}` : ''}
                      </div>
                      {w.description && (
                        <p className="text-xs text-[var(--color-ch-text-secondary)] mt-2 leading-relaxed whitespace-pre-line">
                          {w.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Core Qualifications & Disciplines Card */}
            <div className="ch-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-[var(--color-ch-navy)] border-b border-[var(--color-ch-border-subtle)] pb-3 uppercase tracking-wider">
                Core Qualifications
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[var(--color-ch-text-muted)] block">Discipline</span>
                  <span className="font-semibold text-[var(--color-ch-navy)] text-sm">
                    {engineerProfile.specialization || 'Civil Engineering'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-ch-text-muted)] block">Experience Level</span>
                  <span className="font-semibold text-[var(--color-ch-navy)] text-sm">
                    {engineerProfile.years_experience !== null ? `${engineerProfile.years_experience} Years in Industry` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Education & Certifications Sidebar Cards */}
            {educationList.length > 0 && (
              <div className="ch-card p-6 space-y-3">
                <h3 className="text-sm font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
                  <GraduationCap size={16} className="text-[var(--color-ch-orange)]" />
                  Education
                </h3>
                <div className="space-y-3 text-xs">
                  {educationList.map((edu, i) => (
                    <div key={i} className="border-b border-[var(--color-ch-border-subtle)] pb-2 last:border-b-0 last:pb-0">
                      <div className="font-bold text-[var(--color-ch-navy)]">{edu.degree}</div>
                      <div className="text-[var(--color-ch-text-secondary)]">{edu.institution}</div>
                      {edu.end_year && <div className="text-[var(--color-ch-text-muted)] text-[11px]">Class of {edu.end_year}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {certList.length > 0 && (
              <div className="ch-card p-6 space-y-3">
                <h3 className="text-sm font-bold text-[var(--color-ch-navy)] flex items-center gap-2 border-b border-[var(--color-ch-border-subtle)] pb-3">
                  <Award size={16} className="text-[var(--color-ch-orange)]" />
                  Licenses & Certifications
                </h3>
                <div className="space-y-3 text-xs">
                  {certList.map((c, i) => (
                    <div key={i} className="border-b border-[var(--color-ch-border-subtle)] pb-2 last:border-b-0 last:pb-0">
                      <div className="font-bold text-[var(--color-ch-navy)]">{c.title}</div>
                      <div className="text-[var(--color-ch-text-secondary)]">{c.issuing_organization}</div>
                      {c.issue_date && <div className="text-[var(--color-ch-text-muted)] text-[11px]">Issued {c.issue_date}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Online Links Card */}
            {(engineerProfile.website_url || engineerProfile.linkedin_url) && (
              <div className="ch-card p-6">
                <h3 className="text-sm font-bold text-[var(--color-ch-navy)] mb-4 border-b border-[var(--color-ch-border-subtle)] pb-3 uppercase tracking-wider">
                  Online Links
                </h3>
                <div className="space-y-3">
                  {engineerProfile.website_url && (
                    <a
                      href={engineerProfile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-ch-border)] hover:border-[var(--color-ch-orange)] hover:bg-[var(--color-ch-orange-light)]/20 transition-all text-xs group"
                    >
                      <Globe size={16} className="text-[var(--color-ch-orange)] shrink-0" />
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
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-ch-border)] hover:border-[#0A66C2] hover:bg-blue-50/50 transition-all text-xs group"
                    >
                      <Linkedin size={16} className="text-[#0A66C2] shrink-0" />
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

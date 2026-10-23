import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  FolderKanban,
  MapPin,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Project, ProjectApplication, UserRole } from '@/types'
import { ProjectApplicationForm } from '@/components/applications/ProjectApplicationForm'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const STATUS_LABELS: Record<Project['status'], string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  on_hold: 'On hold',
}

function isProjectId(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(date)
}

async function getProject(id: string) {
  const supabase = await createClient()
  return supabase.from('projects').select('*').eq('id', id).maybeSingle()
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params
  if (!isProjectId(id)) return { title: 'Project | CivilHub' }

  const { data } = await getProject(id)
  const project = data as Project | null

  return project
    ? {
        title: `${project.title} | CivilHub Projects`,
        description: project.description,
      }
    : { title: 'Project | CivilHub' }
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params
  if (!isProjectId(id)) notFound()

  const supabase = await createClient()
  const db = supabase as any
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
  const project = data as Project | null

  if (error) {
    return (
      <div className="ch-section">
        <div className="ch-container max-w-4xl">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
          <div className="ch-card p-10 sm:p-14 text-center" role="alert">
            <AlertCircle size={32} className="mx-auto mb-4 text-[var(--color-ch-red)]" />
            <h1 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
              Project unavailable
            </h1>
            <p className="text-sm text-[var(--color-ch-text-secondary)]">
              We could not load this project right now. Please return to the project directory and try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!project) notFound()

  // Fetch User & Role Context
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: UserRole | null = null
  let existingApplication: ProjectApplication | null = null

  if (user) {
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userRole = (profile?.role as UserRole) || null

    if (userRole === 'engineer') {
      const { data: engineerProfile } = await db
        .from('engineer_profiles')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (engineerProfile) {
        const { data: appData } = await db
          .from('project_applications')
          .select('*')
          .eq('project_id', project.id)
          .eq('engineer_profile_id', engineerProfile.id)
          .maybeSingle()
        existingApplication = (appData as ProjectApplication) || null
      }
    }
  }

  let engineerName: string | null = null
  let engineerProfileId: string | null = null

  if (project.engineer_profile_id) {
    const { data: engineerProfileData } = await supabase
      .from('engineer_profiles')
      .select('*')
      .eq('id', project.engineer_profile_id)
      .eq('visibility', 'public')
      .maybeSingle()
    const engineerProfile = engineerProfileData as unknown as {
      profile_id: string
      visibility: 'public' | 'private' | null
    } | null

    if (engineerProfile?.profile_id) {
      const { data: profileData } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', engineerProfile.profile_id)
        .eq('role', 'engineer')
        .maybeSingle()
      const profile = profileData as unknown as {
        id: string
        full_name: string | null
      } | null

      if (profile) {
        engineerName = profile.full_name || 'Civil Engineer'
        engineerProfileId = profile.id
      }
    }
  }

  const isEligible =
    project.is_published &&
    project.engineer_profile_id === null &&
    (project.status === 'planned' || project.status === 'in_progress')

  const startDate = formatDate(project.start_date)
  const endDate = formatDate(project.end_date)
  const timeline = startDate && endDate
    ? `${startDate} – ${endDate}`
    : startDate
      ? `Started ${startDate}`
      : endDate
        ? `Completed ${endDate}`
        : null

  return (
    <div className="ch-section py-8 sm:py-12">
      <div className="ch-container max-w-4xl space-y-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </Link>

        <article className="ch-card overflow-hidden">
          <header className="bg-gradient-to-br from-[var(--color-ch-navy)] to-[var(--color-ch-charcoal)] px-6 py-10 sm:px-10 sm:py-14 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="ch-badge bg-white/10 text-white border border-white/20 gap-1">
                <FolderKanban size={12} />
                {project.project_type}
              </span>
              <span className="ch-badge bg-[var(--color-ch-orange)] text-white">
                {STATUS_LABELS[project.status]}
              </span>

              {isEligible ? (
                <span className="ch-badge bg-emerald-500 text-white gap-1 font-semibold">
                  <UserPlus size={12} /> Accepting Engineer Applications
                </span>
              ) : project.engineer_profile_id ? (
                <span className="ch-badge bg-blue-500 text-white gap-1 font-semibold">
                  <UserCheck size={12} /> Engineer Assigned
                </span>
              ) : (
                <span className="ch-badge bg-slate-500 text-white font-semibold">
                  Applications Closed
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
              {project.title}
            </h1>
            {project.client_name && (
              <p className="text-white/80 text-base sm:text-lg">
                Client: {project.client_name}
              </p>
            )}
          </header>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {project.location && (
                <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-ch-text-muted)] mb-1">
                    <MapPin size={14} />
                    Location
                  </div>
                  <div className="font-semibold text-sm text-[var(--color-ch-navy)]">
                    {project.location}
                  </div>
                </div>
              )}
              {project.client_name && (
                <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-ch-text-muted)] mb-1">
                    <Building2 size={14} />
                    Client / Organization
                  </div>
                  <div className="font-semibold text-sm text-[var(--color-ch-navy)]">
                    {project.client_name}
                  </div>
                </div>
              )}
              {timeline && (
                <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-ch-text-muted)] mb-1">
                    <CalendarDays size={14} />
                    Timeline
                  </div>
                  <div className="font-semibold text-sm text-[var(--color-ch-navy)]">
                    {timeline}
                  </div>
                </div>
              )}
              <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-ch-text-muted)] mb-1">
                  <FolderKanban size={14} />
                  Project Status
                </div>
                <div className="font-semibold text-sm text-[var(--color-ch-navy)]">
                  {STATUS_LABELS[project.status]}
                </div>
              </div>
            </div>

            {engineerName && engineerProfileId && (
              <div className="mb-8 p-4 rounded-lg border border-[var(--color-ch-border)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BadgeCheck size={20} className="text-[var(--color-ch-green)] shrink-0" />
                  <div>
                    <div className="text-xs text-[var(--color-ch-text-muted)]">Assigned Engineer</div>
                    <div className="font-semibold text-sm text-[var(--color-ch-navy)]">{engineerName}</div>
                  </div>
                </div>
                <Link href={`/engineers/${engineerProfileId}`} className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline">
                  View engineer profile
                </Link>
              </div>
            )}

            <div className="border-t border-[var(--color-ch-border-subtle)] pt-8">
              <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-4">
                Project description
              </h2>
              <p className="text-[var(--color-ch-text-secondary)] leading-relaxed whitespace-pre-line">
                {project.description}
              </p>
            </div>
          </div>
        </article>

        {/* Engineer Application Section */}
        <ProjectApplicationForm
          projectId={project.id}
          isEligible={isEligible}
          userRole={userRole}
          existingApplication={existingApplication}
        />
      </div>
    </div>
  )
}

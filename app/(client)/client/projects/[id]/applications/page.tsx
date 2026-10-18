import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FolderKanban,
  UserCheck,
  UserX,
  User,
  Calendar,
  ExternalLink,
  AlertCircle,
  Building2,
  MapPin,
  Clock,
} from 'lucide-react'
import type { Database } from '@/types/database'
import { ClientApplicationActions } from '@/components/applications/ClientApplicationActions'
import { StartConversationButton } from '@/components/messaging/StartConversationButton'

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function ClientProjectApplicationsPage({ params }: PageProps) {
  const { id: projectId } = await params
  if (!UUID_PATTERN.test(projectId)) notFound()

  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/client/projects/${projectId}/applications`)

  // Role verification
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'client') {
    redirect('/')
  }

  // Get Client Profile ID
  const { data: clientProfile } = await db
    .from('client_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!clientProfile) redirect('/client/dashboard')

  // Ownership verification: Project must belong to this client
  const { data: project, error: projectError } = await db
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle()

  if (projectError || !project) notFound()

  if (project.client_profile_id !== clientProfile.id) {
    redirect('/client/projects')
  }

  // Fetch applications for this project with engineer details
  const { data: rawApps, error: appsError } = await db
    .from('project_applications')
    .select(`
      *,
      engineer_profile:engineer_profiles (
        id,
        profile_id,
        headline,
        specialization,
        years_experience,
        skills,
        is_available,
        visibility,
        profiles (
          id,
          full_name,
          avatar_url,
          location
        )
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const applications = rawApps || []

  // Check if an engineer is already assigned
  const isAssigned = Boolean(project.engineer_profile_id)

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Bar */}
      <div>
        <Link
          href="/client/projects"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ch-orange)] hover:underline mb-4 font-medium"
        >
          <ArrowLeft size={14} /> Back to My Projects
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-ch-border)] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="ch-badge bg-slate-100 text-slate-700 text-xs">
                {project.project_type}
              </span>
              <span className="ch-badge bg-purple-50 text-purple-700 border-purple-200 text-xs">
                Status: {project.status}
              </span>
              {isAssigned && (
                <span className="ch-badge bg-emerald-50 text-emerald-700 border-emerald-200 text-xs inline-flex items-center gap-1">
                  <UserCheck size={12} /> Engineer Assigned
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-ch-navy)]">
              {project.title} — Engineer Applicants
            </h1>
            <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
              Review engineer proposals, inspect verified credentials, and select an engineer for your project.
            </p>
          </div>

          <Link
            href={`/client/projects/${projectId}`}
            className="ch-btn ch-btn-outline text-xs px-3.5 py-2 inline-flex items-center gap-1.5 self-start md:self-auto shrink-0"
          >
            Edit Project Details
          </Link>
        </div>
      </div>

      {/* Error state */}
      {appsError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-[var(--color-ch-red)] flex items-start gap-3 text-sm"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Failed to load applications</h3>
            <p className="text-xs opacity-90 mt-1">{appsError.message}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!appsError && applications.length === 0 && (
        <div className="ch-card p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-[var(--color-ch-text-muted)] flex items-center justify-center mx-auto">
            <UserX size={28} />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            No applications received yet
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)]">
            Civil engineers have not applied to this project yet. Ensure your project is published in the public directory so engineers can discover it.
          </p>
          {project.is_published && !isAssigned && ['planned', 'in_progress'].includes(project.status) ? (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs inline-flex items-center gap-2">
              <UserCheck size={14} /> Project is currently Public & Accepting Applications
            </div>
          ) : !project.is_published ? (
            <Link
              href={`/client/projects/${projectId}`}
              className="ch-btn ch-btn-primary text-xs inline-flex items-center gap-1.5"
            >
              Publish Project to Public Directory
            </Link>
          ) : <p className="text-xs text-[var(--color-ch-text-secondary)]">This project is not currently accepting applications.</p>}
        </div>
      )}

      {/* Applications List */}
      {!appsError && applications.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--color-ch-text-secondary)] px-1">
            <span className="font-medium text-[var(--color-ch-navy)]">
              {applications.length} Applicant{applications.length === 1 ? '' : 's'} Total
            </span>
            <span className="text-[var(--color-ch-text-muted)]">
              Accepting an engineer assigns them to the project and closes competing pending applications.
            </span>
          </div>

          <div className="space-y-4">
            {applications.map((app: any) => {
              const engProfile = app.engineer_profile
              const userProfile = engProfile?.profiles
              const engineerName = userProfile?.full_name || 'Civil Engineer'
              const headline = engProfile?.headline || engProfile?.specialization || 'Civil Engineering Professional'
              const experience = engProfile?.years_experience ? `${engProfile.years_experience} yrs exp` : null
              const location = userProfile?.location
              const profileId = userProfile?.id

              return (
                <div
                  key={app.id}
                  className={`ch-card p-6 space-y-4 transition-all ${
                    app.status === 'accepted'
                      ? 'border-2 border-emerald-500 bg-emerald-50/20'
                      : 'border-[var(--color-ch-border)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[var(--color-ch-border-subtle)] pb-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-[var(--color-ch-navy)] text-white font-bold flex items-center justify-center shrink-0">
                        {engineerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-[var(--color-ch-navy)]">
                            {engineerName}
                          </h3>
                          {profileId && (
                            <Link
                              href={`/engineers/${profileId}`}
                              target="_blank"
                              className="text-xs text-[var(--color-ch-orange)] hover:underline inline-flex items-center gap-0.5"
                            >
                              Public Profile <ExternalLink size={12} />
                            </Link>
                          )}
                        </div>

                        <p className="text-xs text-[var(--color-ch-text-secondary)] font-medium mt-0.5">
                          {headline}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-ch-text-muted)] mt-1.5">
                          {experience && <span>{experience}</span>}
                          {location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} /> {location}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} /> Submitted {new Date(app.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {engProfile?.skills && engProfile.skills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {engProfile.skills.slice(0, 5).map((sk: string) => (
                              <span key={sk} className="ch-badge bg-slate-100 text-slate-700 text-[10px]">
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 self-start sm:self-auto flex flex-wrap items-center gap-2">
                      <StartConversationButton
                        projectId={projectId}
                        engineerProfileId={app.engineer_profile_id}
                        userRole="client"
                      />
                      <ClientApplicationActions
                        projectId={projectId}
                        applicationId={app.id}
                        status={app.status}
                        isAssigned={isAssigned && project.engineer_profile_id !== app.engineer_profile_id}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-[var(--color-ch-navy)] block">
                      Application Cover Message:
                    </span>
                    <p className="text-xs text-[var(--color-ch-text-secondary)] whitespace-pre-line bg-[var(--color-ch-surface)] p-4 rounded-lg border border-[var(--color-ch-border-subtle)] leading-relaxed">
                      {app.cover_message}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

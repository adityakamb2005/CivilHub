import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderKanban,
  MapPin,
  BookOpen,
  ClipboardList,
} from 'lucide-react'
import type { Database } from '@/types/database'
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge'
import { WithdrawApplicationButton } from '@/components/applications/WithdrawApplicationButton'
import { WithdrawProjectApplicationButton } from '@/components/applications/WithdrawProjectApplicationButton'

type EngineerProfile = Database['public']['Tables']['engineer_profiles']['Row']
type Project = Database['public']['Tables']['projects']['Row']
type OpportunityApplicationItem = Database['public']['Tables']['opportunity_applications']['Row'] & {
  opportunity: Pick<Database['public']['Tables']['opportunities']['Row'], 'id' | 'title'> | null
}
type ProjectApplicationItem = Database['public']['Tables']['project_applications']['Row'] & {
  project: Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'title' | 'client_name'> | null
}

const STATUS_LABELS: Record<Project['status'], string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  on_hold: 'On hold',
}

const STATUS_BADGES: Record<Project['status'], string> = {
  planned: 'ch-badge-navy',
  in_progress: 'ch-badge-orange',
  completed: 'ch-badge-green',
  on_hold: 'ch-badge-gray',
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

function formatTimeline(project: Project): string | null {
  const start = formatDate(project.start_date)
  const end = formatDate(project.end_date)
  if (start && end) return `${start} – ${end}`
  if (start) return `Started ${start}`
  if (end) return `Completed ${end}`
  return null
}

function formatSubmittedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

export function EngineerWorkspace({
  engineerProfile,
  projects,
  opportunitiesCount,
  resourcesCount,
  projectsError,
  applications,
  applicationsError,
  projectApplications = [],
  projectApplicationsError,
  summaryError,
}: {
  engineerProfile: EngineerProfile | null
  projects: Project[]
  opportunitiesCount: number | null
  resourcesCount: number | null
  projectsError?: boolean
  applications: OpportunityApplicationItem[]
  applicationsError?: boolean
  projectApplications?: ProjectApplicationItem[]
  projectApplicationsError?: boolean
  summaryError?: boolean
}) {
  const profileIsPublic = engineerProfile?.visibility === 'public'
  const profileStatus = engineerProfile
    ? profileIsPublic
      ? 'Public'
      : 'Private'
    : 'Not started'

  return (
    <section className="space-y-6" aria-labelledby="workspace-heading">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ch-orange)]">
            Engineer Workspace
          </span>
          <h2 id="workspace-heading" className="text-2xl font-bold text-[var(--color-ch-navy)] mt-1">
            My Workspace
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
            Review your public presence, project applications, and discover opportunities on CivilHub.
          </p>
        </div>
      </div>

      {(projectsError || applicationsError || projectApplicationsError || summaryError) && (
        <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-[var(--color-ch-red)] flex items-start gap-3" role="alert">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">
            Some workspace information could not be loaded. Values shown as unavailable are not estimates.
          </p>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="ch-card min-w-0 p-5 flex flex-col min-h-[178px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ch-text-muted)]">
              Public profile
            </span>
            {profileIsPublic ? (
              <Eye size={18} className="text-[var(--color-ch-green)]" />
            ) : (
              <EyeOff size={18} className="text-[var(--color-ch-text-muted)]" />
            )}
          </div>
          <div className="text-2xl font-bold text-[var(--color-ch-navy)] mb-1">{profileStatus}</div>
          <p className="text-xs text-[var(--color-ch-text-secondary)] flex-1">
            {profileIsPublic
              ? 'Clients and public visitors can view your profile.'
              : 'Complete or publish your profile to be discoverable.'}
          </p>
          <Link href="/engineer/profile" className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline mt-4 inline-flex items-center gap-1">
            {engineerProfile ? 'Manage profile' : 'Complete profile'}
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="ch-card min-w-0 p-5 flex flex-col min-h-[178px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ch-text-muted)]">
              Project Applications
            </span>
            <ClipboardList size={18} className="text-[var(--color-ch-orange)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--color-ch-navy)] mb-1">
            {projectApplicationsError ? '—' : projectApplications.length}
          </div>
          <p className="text-xs text-[var(--color-ch-text-secondary)] flex-1">
            Applications submitted to client projects.
          </p>
          <Link href="/projects" className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline mt-4 inline-flex items-center gap-1">
            Browse available projects
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="ch-card min-w-0 p-5 flex flex-col min-h-[178px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ch-text-muted)]">
              Opportunity Applications
            </span>
            <Briefcase size={18} className="text-[var(--color-ch-orange)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--color-ch-navy)] mb-1">
            {applicationsError ? '—' : applications.length}
          </div>
          <p className="text-xs text-[var(--color-ch-text-secondary)] flex-1">
            Applications submitted to job & tender opportunities.
          </p>
          <Link href="/opportunities" className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline mt-4 inline-flex items-center gap-1">
            View opportunities
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="ch-card min-w-0 p-5 flex flex-col min-h-[178px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ch-text-muted)]">
              Assigned Projects
            </span>
            <FolderKanban size={18} className="text-[var(--color-ch-orange)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--color-ch-navy)] mb-1">
            {projectsError ? '—' : projects.length}
          </div>
          <p className="text-xs text-[var(--color-ch-text-secondary)] flex-1">
            Projects where you are assigned as the engineer.
          </p>
          <Link href="/projects" className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline mt-4 inline-flex items-center gap-1">
            View public directory
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Project Applications Section */}
      <div className="ch-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2">
              <ClipboardList size={19} className="text-[var(--color-ch-orange)]" />
              My Project Applications
            </h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
              Track applications you have submitted to client engineering projects.
            </p>
          </div>
          <Link href="/projects" className="ch-btn ch-btn-outline text-xs self-start sm:self-auto">
            Browse projects <ArrowRight size={14} />
          </Link>
        </div>

        {projectApplicationsError ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            Your project applications are unavailable right now. Please try again later.
          </div>
        ) : !engineerProfile ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            Complete your engineer profile before applying to client projects.
          </div>
        ) : projectApplications.length === 0 ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            You have not submitted any project applications yet. Browse the public project directory to apply.
          </div>
        ) : (
          <div className="space-y-3">
            {projectApplications.map((app) => (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-[var(--color-ch-border)]"
              >
                <div className="min-w-0">
                  {app.project ? (
                    <Link
                      href={`/projects/${app.project.id}`}
                      className="font-semibold text-sm text-[var(--color-ch-navy)] hover:text-[var(--color-ch-orange)] hover:underline"
                    >
                      {app.project.title}
                    </Link>
                  ) : (
                    <p className="font-semibold text-sm text-[var(--color-ch-navy)]">
                      Project unavailable
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-ch-text-muted)] mt-1">
                    {app.project?.client_name ? `Client: ${app.project.client_name} · ` : ''}
                    Submitted {formatSubmittedAt(app.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ApplicationStatusBadge status={app.status} />
                  {app.status === 'pending' && app.project && (
                    <WithdrawProjectApplicationButton
                      applicationId={app.id}
                      projectId={app.project.id}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opportunity Applications Section */}
      <div className="ch-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2">
              <Briefcase size={19} className="text-[var(--color-ch-orange)]" />
              My Opportunity Applications
            </h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
              Track applications you have submitted to job listings and tender opportunities.
            </p>
          </div>
          <Link href="/opportunities" className="ch-btn ch-btn-outline text-xs self-start sm:self-auto">
            Find opportunities <ArrowRight size={14} />
          </Link>
        </div>

        {applicationsError ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            Your opportunity applications are unavailable right now. Please try again later.
          </div>
        ) : !engineerProfile ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            Complete your engineer profile before applying to opportunities.
          </div>
        ) : applications.length === 0 ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            You have not submitted any opportunity applications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((application) => (
              <div key={application.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-[var(--color-ch-border)]">
                <div className="min-w-0">
                  {application.opportunity ? (
                    <Link href={`/opportunities/${application.opportunity.id}`} className="font-semibold text-sm text-[var(--color-ch-navy)] hover:text-[var(--color-ch-orange)] hover:underline">
                      {application.opportunity.title}
                    </Link>
                  ) : (
                    <p className="font-semibold text-sm text-[var(--color-ch-navy)]">Opportunity unavailable</p>
                  )}
                  <p className="text-xs text-[var(--color-ch-text-muted)] mt-1">Submitted {formatSubmittedAt(application.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ApplicationStatusBadge status={application.status} />
                  {application.status === 'pending' && (
                    <WithdrawApplicationButton applicationId={application.id} opportunityId={application.opportunity_id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Projects Section */}
      <div className="ch-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2">
              <FolderKanban size={19} className="text-[var(--color-ch-orange)]" />
              Assigned Projects
            </h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
              Public project records currently associated with your engineer profile.
            </p>
          </div>
          <Link href="/projects" className="ch-btn ch-btn-outline text-xs self-start sm:self-auto">
            View public directory
            <ArrowRight size={14} />
          </Link>
        </div>

        {projectsError ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            Your project records are unavailable right now. Please try again later.
          </div>
        ) : !engineerProfile ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            Complete your engineer profile before projects can be associated with it.
          </div>
        ) : projects.length === 0 ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            No published projects are associated with your engineer profile yet.
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => {
              const timeline = formatTimeline(project)

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg border border-[var(--color-ch-border)] hover:border-[var(--color-ch-orange)]/50 hover:bg-[var(--color-ch-surface)] transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)] transition-colors truncate">
                        {project.title}
                      </h4>
                      <span className={`ch-badge ${STATUS_BADGES[project.status]}`}>
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ch-text-muted)]">
                      <span>{project.project_type}</span>
                      {project.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} />
                          {project.location}
                        </span>
                      )}
                      {timeline && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} />
                          {timeline}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[var(--color-ch-text-muted)] group-hover:text-[var(--color-ch-orange)] shrink-0" />
                </Link>
              )
            })}
            {projects.length > 5 && (
              <p className="text-xs text-[var(--color-ch-text-muted)] pt-1">
                Showing 5 of {projects.length} published projects.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border-subtle)] flex items-start gap-3">
        <CheckCircle2 size={17} className="text-[var(--color-ch-green)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--color-ch-text-secondary)] leading-relaxed">
          Project applications are limited to a cover message and a status update. Payments, contracts, and advanced messaging are not part of this MVP workspace.
        </p>
      </div>
    </section>
  )
}

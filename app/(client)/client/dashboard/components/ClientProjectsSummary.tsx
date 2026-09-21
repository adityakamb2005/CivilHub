import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  FolderKanban,
  MapPin,
  Plus,
  Briefcase,
  BookOpen,
} from 'lucide-react'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

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

export function ClientProjectsSummary({
  projects,
  projectsError,
  opportunitiesCount,
  resourcesCount,
  summaryError,
  hasClientProfile,
}: {
  projects: Project[]
  projectsError: boolean
  opportunitiesCount: number | null
  resourcesCount: number | null
  summaryError: boolean
  hasClientProfile: boolean
}) {
  const publishedCount = projects.filter((p) => p.is_published).length
  const draftCount = projects.filter((p) => !p.is_published).length

  return (
    <section className="space-y-6" aria-labelledby="workspace-heading">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ch-orange)]">
            Client Workspace
          </span>
          <h2 id="workspace-heading" className="text-2xl font-bold text-[var(--color-ch-navy)] mt-1">
            My Workspace
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
            Manage your projects and explore what CivilHub has to offer.
          </p>
        </div>
      </div>

      {(projectsError || summaryError) && (
        <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-[var(--color-ch-red)] flex items-start gap-3" role="alert">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">
            Some workspace information could not be loaded. Please try refreshing the page.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="ch-card p-5 flex flex-col min-h-[178px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ch-text-muted)]">
              My projects
            </span>
            <FolderKanban size={18} className="text-[var(--color-ch-orange)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--color-ch-navy)] mb-1">
            {projectsError ? '—' : projects.length}
          </div>
          <p className="text-xs text-[var(--color-ch-text-secondary)] flex-1">
            {publishedCount} published · {draftCount} draft
          </p>
          <Link href="/client/projects" className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline mt-4 inline-flex items-center gap-1">
            Manage projects
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="ch-card p-5 flex flex-col min-h-[178px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ch-text-muted)]">
              Published
            </span>
            <Eye size={18} className="text-[var(--color-ch-green)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--color-ch-navy)] mb-1">
            {projectsError ? '—' : publishedCount}
          </div>
          <p className="text-xs text-[var(--color-ch-text-secondary)] flex-1">
            Visible in the public project directory.
          </p>
          <Link href="/projects" className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline mt-4 inline-flex items-center gap-1">
            View public directory
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="ch-card p-5 flex flex-col min-h-[178px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ch-text-muted)]">
              Open opportunities
            </span>
            <Briefcase size={18} className="text-[var(--color-ch-orange)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--color-ch-navy)] mb-1">
            {summaryError || opportunitiesCount === null ? '—' : opportunitiesCount}
          </div>
          <p className="text-xs text-[var(--color-ch-text-secondary)] flex-1">
            Published opportunities on CivilHub.
          </p>
          <Link href="/opportunities" className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline mt-4 inline-flex items-center gap-1">
            View opportunities
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="ch-card p-5 flex flex-col min-h-[178px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ch-text-muted)]">
              Resources
            </span>
            <BookOpen size={18} className="text-[var(--color-ch-orange)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--color-ch-navy)] mb-1">
            {summaryError || resourcesCount === null ? '—' : resourcesCount}
          </div>
          <p className="text-xs text-[var(--color-ch-text-secondary)] flex-1">
            Published engineering resources to explore.
          </p>
          <Link href="/resources" className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline mt-4 inline-flex items-center gap-1">
            Browse resources
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Recent projects list */}
      <div className="ch-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-ch-navy)] flex items-center gap-2">
              <FolderKanban size={19} className="text-[var(--color-ch-orange)]" />
              My Projects
            </h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
              Your recent projects on CivilHub.
            </p>
          </div>
          <Link href="/client/projects/new" className="ch-btn ch-btn-primary text-xs self-start sm:self-auto">
            <Plus size={14} />
            New Project
          </Link>
        </div>

        {projectsError ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            Your projects are unavailable right now. Please try again later.
          </div>
        ) : !hasClientProfile ? (
          <div className="p-5 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-sm text-[var(--color-ch-text-secondary)]">
            Complete your client profile before creating projects.
          </div>
        ) : projects.length === 0 ? (
          <div className="p-8 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-center">
            <FolderKanban size={32} className="mx-auto mb-3 text-[var(--color-ch-text-muted)]" />
            <p className="text-sm font-medium text-[var(--color-ch-navy)] mb-1">No projects yet</p>
            <p className="text-xs text-[var(--color-ch-text-secondary)] mb-4">
              Create your first project to get started.
            </p>
            <Link href="/client/projects/new" className="ch-btn ch-btn-outline text-xs">
              <Plus size={14} />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => {
              const timeline = formatTimeline(project)

              return (
                <Link
                  key={project.id}
                  href={`/client/projects/${project.id}`}
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
                      {project.is_published ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ch-green)]">
                          <Eye size={12} />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ch-text-muted)]">
                          <EyeOff size={12} />
                          Draft
                        </span>
                      )}
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
              <div className="pt-2">
                <Link href="/client/projects" className="text-xs font-medium text-[var(--color-ch-orange)] hover:underline inline-flex items-center gap-1">
                  View all {projects.length} projects
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

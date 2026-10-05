import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircle, ArrowRight, FolderKanban, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge'

type Project = Database['public']['Tables']['projects']['Row']
type Application = Pick<Database['public']['Tables']['project_applications']['Row'], 'id' | 'status' | 'created_at'> & {
  project: Pick<Project, 'id' | 'title' | 'description' | 'location' | 'status' | 'project_type'> | null
}

const PROJECT_STATUS: Record<Project['status'], string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  on_hold: 'On hold',
}

function ProjectCard({ project }: { project: Pick<Project, 'id' | 'title' | 'description' | 'location' | 'status' | 'project_type'> }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex min-w-0 items-start justify-between gap-4 rounded-lg border border-[var(--color-ch-border)] p-4 transition-colors hover:border-[var(--color-ch-orange)]/50 hover:bg-[var(--color-ch-surface)] group"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="break-words font-semibold text-sm text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)]">
            {project.title}
          </h3>
          <span className="ch-badge ch-badge-navy">{PROJECT_STATUS[project.status]}</span>
        </div>
        <p className="mt-2 line-clamp-2 break-words text-xs text-[var(--color-ch-text-secondary)]">{project.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ch-text-muted)]">
          <span>{project.project_type}</span>
          {project.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{project.location}</span>}
        </div>
      </div>
      <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--color-ch-text-muted)] group-hover:text-[var(--color-ch-orange)]" />
    </Link>
  )
}

export const metadata = {
  title: 'My Projects | CivilHub',
  description: 'Track project applications and assignments in your engineer workspace.',
}

export default async function EngineerProjectsPage() {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'engineer') redirect('/')

  const { data: engineer } = await db.from('engineer_profiles').select('id').eq('profile_id', user.id).maybeSingle()
  if (!engineer) {
    return (
      <section className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold text-[var(--color-ch-navy)]">My Projects</h1>
        <div className="ch-card p-6 text-sm text-[var(--color-ch-text-secondary)]">Complete your engineer profile to view and apply to projects.</div>
      </section>
    )
  }

  const [assignedResult, applicationsResult] = await Promise.all([
    db.from('projects')
      .select('id, title, description, location, status, project_type')
      .eq('engineer_profile_id', engineer.id)
      .order('updated_at', { ascending: false }),
    db.from('project_applications')
      .select('id, status, created_at, project:projects(id, title, description, location, status, project_type)')
      .eq('engineer_profile_id', engineer.id)
      .order('created_at', { ascending: false }),
  ])

  const assigned = (assignedResult.data ?? []) as Array<Pick<Project, 'id' | 'title' | 'description' | 'location' | 'status' | 'project_type'>>
  const applications = (applicationsResult.data ?? []) as Application[]
  const assignedProjectIds = new Set(assigned.map((project) => project.id))
  const appliedOnly = applications.filter(
    (application) => !application.project || !assignedProjectIds.has(application.project.id)
  )
  const hasError = Boolean(assignedResult.error || applicationsResult.error)

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ch-orange)]">Engineer Workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--color-ch-navy)]">My Projects</h1>
        <p className="mt-1 text-sm text-[var(--color-ch-text-secondary)]">Track projects you have applied to and projects assigned to you.</p>
      </header>

      {hasError && <div role="alert" className="flex items-start gap-3 rounded-lg border border-[var(--color-ch-red)]/20 bg-[var(--color-ch-red-light)] p-4 text-sm text-[var(--color-ch-red)]"><AlertCircle size={18} className="mt-0.5 shrink-0" />Some project information could not be loaded. Please try again later.</div>}

      <section className="ch-card min-w-0 space-y-4 p-6" aria-labelledby="applied-projects-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="applied-projects-heading" className="flex items-center gap-2 text-lg font-bold text-[var(--color-ch-navy)]"><FolderKanban size={19} className="text-[var(--color-ch-orange)]" />Applications</h2>
            <p className="mt-1 text-sm text-[var(--color-ch-text-secondary)]">Projects where you have submitted an application, with its current status.</p>
          </div>
          <Link href="/projects" className="ch-btn ch-btn-outline text-xs">Browse projects <ArrowRight size={14} /></Link>
        </div>
        {applicationsResult.error ? (
          <p className="rounded-lg bg-[var(--color-ch-surface)] p-4 text-sm text-[var(--color-ch-text-secondary)]">Your applications are unavailable right now.</p>
        ) : appliedOnly.length === 0 ? (
          <p className="rounded-lg bg-[var(--color-ch-surface)] p-4 text-sm text-[var(--color-ch-text-secondary)]">You have not applied to any projects yet. Browse published projects to find an opportunity.</p>
        ) : (
          <div className="space-y-3">{appliedOnly.map((application) => (
            <div key={application.id} className="min-w-0 space-y-3 rounded-lg bg-[var(--color-ch-surface)] p-3">
              {application.project ? <ProjectCard project={application.project} /> : <p className="text-sm text-[var(--color-ch-text-secondary)]">Project details are currently unavailable.</p>}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-ch-text-muted)]">
                <span>Applied {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(application.created_at))}</span>
                <ApplicationStatusBadge status={application.status} />
              </div>
            </div>
          ))}</div>
        )}
      </section>

      <section className="ch-card min-w-0 space-y-4 p-6" aria-labelledby="assigned-projects-heading">
        <div>
          <h2 id="assigned-projects-heading" className="flex items-center gap-2 text-lg font-bold text-[var(--color-ch-navy)]"><FolderKanban size={19} className="text-[var(--color-ch-orange)]" />Assigned Projects</h2>
          <p className="mt-1 text-sm text-[var(--color-ch-text-secondary)]">Projects where the client has assigned you as the engineer.</p>
        </div>
        {assignedResult.error ? (
          <p className="rounded-lg bg-[var(--color-ch-surface)] p-4 text-sm text-[var(--color-ch-text-secondary)]">Your assigned projects are unavailable right now.</p>
        ) : assigned.length === 0 ? (
          <p className="rounded-lg bg-[var(--color-ch-surface)] p-4 text-sm text-[var(--color-ch-text-secondary)]">No projects are assigned to you yet.</p>
        ) : (
          <div className="space-y-3">{assigned.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
        )}
      </section>
    </section>
  )
}

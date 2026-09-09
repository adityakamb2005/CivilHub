import Link from 'next/link'
import { ArrowRight, CalendarDays, FolderKanban, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

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

export async function FeaturedProjects() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('end_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(3)

  const projects = (data || []) as Project[]

  return (
    <section className="ch-section bg-white" aria-labelledby="projects-heading">
      <div className="ch-container">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="ch-section-label mb-3 block">Featured Projects</span>
            <h2
              id="projects-heading"
              className="ch-text-section-heading text-[var(--color-ch-navy)]"
            >
              Real Work. Real Results.
            </h2>
          </div>
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-ch-orange)] hover:underline whitespace-nowrap"
          >
            Browse all projects
            <ArrowRight size={15} />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="ch-card p-8 sm:p-10 text-center flex flex-col items-center">
            <FolderKanban size={30} className="text-[var(--color-ch-text-muted)] mb-4" />
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">
              No public projects yet
            </h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-md">
              Published engineer portfolio projects will appear here as they become available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const startDate = formatDate(project.start_date)
              const endDate = formatDate(project.end_date)
              const timeline = startDate && endDate
                ? `${startDate} – ${endDate}`
                : startDate || endDate

              return (
                <div
                  key={project.id}
                  className="ch-card p-6 hover:shadow-[0_4px_20px_0_rgb(15_28_46/0.10)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="ch-badge ch-badge-navy max-w-full truncate">
                      {project.project_type}
                    </span>
                    <span className={`ch-badge ${STATUS_BADGES[project.status]} shrink-0`}>
                      {STATUS_LABELS[project.status]}
                    </span>
                  </div>

                  <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed mb-5 flex-1 line-clamp-4">
                    {project.description}
                  </p>

                  <div className="flex flex-col gap-2 text-xs text-[var(--color-ch-text-muted)] mb-5">
                    {project.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        <span className="truncate">{project.location}</span>
                      </div>
                    )}
                    {timeline && (
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={12} />
                        <span className="truncate">{timeline}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/projects/${project.id}`}
                    className="ch-btn ch-btn-outline w-full text-xs justify-between group-hover:bg-[var(--color-ch-orange)]"
                  >
                    <span>View project</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

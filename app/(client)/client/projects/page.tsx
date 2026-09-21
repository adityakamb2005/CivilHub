import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FolderKanban,
  Plus,
  CalendarDays,
  MapPin,
  Eye,
  EyeOff,
  Edit3,
  AlertCircle,
  Clock,
  CheckCircle,
  PauseCircle,
  HelpCircle,
  Building2,
} from 'lucide-react'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']

export default async function ClientProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch role check
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Database['public']['Tables']['profiles']['Row'] | null

  if (!profile || profile.role !== 'client') {
    redirect('/')
  }

  // Fetch client_profile.id
  const { data: clientProfileData } = await (supabase as any)
    .from('client_profiles')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  const clientProfileId = clientProfileData?.id || null

  // Fetch all projects owned by this client
  let projectsData: any[] | null = null
  let error: any = null

  if (clientProfileId) {
    const res = await (supabase as any)
      .from('projects')
      .select('*')
      .eq('client_profile_id', clientProfileId)
      .order('created_at', { ascending: false })
    projectsData = res.data
    error = res.error
  }

  const projects = (projectsData ?? []) as ProjectRow[]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="ch-badge bg-blue-50 text-blue-700 border-blue-200 inline-flex items-center gap-1 text-xs">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        )
      case 'completed':
        return (
          <span className="ch-badge bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1 text-xs">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        )
      case 'on_hold':
        return (
          <span className="ch-badge bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1 text-xs">
            <PauseCircle className="w-3 h-3" /> On Hold
          </span>
        )
      case 'planned':
      default:
        return (
          <span className="ch-badge bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1 text-xs">
            <HelpCircle className="w-3 h-3" /> Planned
          </span>
        )
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-ch-border)] pb-6">
        <div>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] text-2xl font-bold flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-[var(--color-ch-orange)]" />
            My Civil Projects
          </h1>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
            Manage your civil engineering projects, publish directory listings, and track progress.
          </p>
        </div>
        <Link
          href="/client/projects/new"
          className="ch-btn ch-btn-primary inline-flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Project
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="p-5 rounded-xl bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-[var(--color-ch-red)] flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">Failed to load projects</h3>
            <p className="text-xs opacity-90 mt-1">{error.message}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!error && (!projects || projects.length === 0) && (
        <div className="ch-card p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-[var(--color-ch-orange)]/10 text-[var(--color-ch-orange)] flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-ch-navy)] mb-2">No projects created yet</h3>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mb-6 max-w-md mx-auto">
            You haven't posted any civil engineering projects. Create your first project to connect with engineers and prospective partners.
          </p>
          <Link
            href="/client/projects/new"
            className="ch-btn ch-btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Your First Project
          </Link>
        </div>
      )}

      {/* Projects List */}
      {!error && projects && projects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--color-ch-text-secondary)] px-1">
            <span>Showing {projects.length} project{projects.length === 1 ? '' : 's'}</span>
            <span className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" /> Published ({projects.filter((p) => p.is_published).length})
              </span>
              <span className="flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-slate-400" /> Draft ({projects.filter((p) => !p.is_published).length})
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {projects.map((project: ProjectRow) => (
              <div
                key={project.id}
                className="ch-card p-6 hover:border-[var(--color-ch-orange)]/40 transition-all space-y-4 group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="ch-badge bg-slate-100 text-slate-700 text-xs font-medium">
                        {project.project_type}
                      </span>
                      {getStatusBadge(project.status)}
                      {project.is_published ? (
                        <span className="ch-badge bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1 text-xs">
                          <Eye className="w-3 h-3" /> Public
                        </span>
                      ) : (
                        <span className="ch-badge bg-slate-100 text-slate-600 border-slate-200 inline-flex items-center gap-1 text-xs">
                          <EyeOff className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)] transition-colors">
                      {project.title}
                    </h2>

                    <p className="text-sm text-[var(--color-ch-text-secondary)] line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-start pt-2 md:pt-0">
                    {project.is_published && (
                      <Link
                        href={`/projects/${project.id}`}
                        target="_blank"
                        className="ch-btn ch-btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Public
                      </Link>
                    )}
                    <Link
                      href={`/client/projects/${project.id}`}
                      className="ch-btn ch-btn-primary text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Project
                    </Link>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[var(--color-ch-text-secondary)] pt-3 border-t border-[var(--color-ch-border)]/60">
                  {project.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-ch-orange)]" />
                      {project.location}
                    </span>
                  )}
                  {project.start_date && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      Start: {new Date(project.start_date).toLocaleDateString()}
                    </span>
                  )}
                  {project.end_date && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      Target: {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  )}
                  <span className="ml-auto text-slate-400">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

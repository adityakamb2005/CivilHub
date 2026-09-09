import Link from 'next/link'
import { Plus, FolderKanban } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminRowActions } from '@/components/admin/AdminRowActions'
import { deleteProject, toggleProjectPublication } from '@/lib/admin/actions'
import type { Project } from '@/types'

export const metadata = { title: 'Manage Projects | CivilHub' }
export const dynamic = 'force-dynamic'

const messages: Record<string, string> = { created: 'Project created.', updated: 'Project updated.', published: 'Project published.', unpublished: 'Project unpublished.', deleted: 'Project deleted.' }
const errors: Record<string, string> = { not_found: 'The project could not be found.', update_failed: 'The project could not be updated.', delete_failed: 'The project could not be deleted.' }
const statusLabels: Record<Project['status'], string> = { planned: 'Planned', in_progress: 'In progress', completed: 'Completed', on_hold: 'On hold' }

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const { supabase } = await requireAdminPage()
  const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false })
  const projects = (data || []) as Project[]
  const params = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><Link href="/admin/dashboard" className="text-sm text-[var(--color-ch-orange)] hover:underline">← Admin dashboard</Link><h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">Projects</h1><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Manage the public project directory.</p></div><Link href="/admin/projects/new" className="ch-btn ch-btn-primary"><Plus size={16} /> New project</Link></div>
      {params.message && messages[params.message] && <div className="p-4 rounded-lg bg-[var(--color-ch-green-light)] border border-[var(--color-ch-green)]/20 text-sm text-[var(--color-ch-green)]" role="status">{messages[params.message]}</div>}
      {params.error && errors[params.error] && <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-sm text-[var(--color-ch-red)]" role="alert">{errors[params.error]}</div>}
      {error ? <div className="ch-card p-10 text-center text-sm text-[var(--color-ch-red)]" role="alert">Projects could not be loaded. Please try again.</div> : projects.length === 0 ? <div className="ch-card p-12 text-center"><FolderKanban size={32} className="mx-auto text-[var(--color-ch-text-muted)] mb-4" /><h2 className="text-lg font-bold text-[var(--color-ch-navy)]">No projects yet</h2><p className="text-sm text-[var(--color-ch-text-secondary)] mt-2">Create the first project to populate the public directory.</p></div> : <div className="space-y-3">{projects.map((project) => <div key={project.id} className="ch-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 mb-1"><h2 className="font-semibold text-[var(--color-ch-navy)] truncate">{project.title}</h2><span className={`ch-badge ${project.is_published ? 'ch-badge-green' : 'ch-badge-gray'}`}>{project.is_published ? 'Published' : 'Draft'}</span><span className="ch-badge ch-badge-orange">{statusLabels[project.status]}</span></div><p className="text-sm text-[var(--color-ch-text-secondary)] line-clamp-2">{project.description}</p><p className="text-xs text-[var(--color-ch-text-muted)] mt-2">{project.project_type}{project.location ? ` · ${project.location}` : ''}{project.client_name ? ` · ${project.client_name}` : ''}</p></div><AdminRowActions id={project.id} editHref={`/admin/projects/${project.id}/edit`} isPublished={project.is_published} toggleAction={toggleProjectPublication} deleteAction={deleteProject} /></div>)}</div>}
    </div>
  )
}

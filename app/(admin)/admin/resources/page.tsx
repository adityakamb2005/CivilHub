import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminRowActions } from '@/components/admin/AdminRowActions'
import { deleteResource, toggleResourcePublication } from '@/lib/admin/actions'
import type { Resource } from '@/types'

export const metadata = { title: 'Manage Resources | CivilHub' }
export const dynamic = 'force-dynamic'

const messages: Record<string, string> = { created: 'Resource created.', updated: 'Resource updated.', published: 'Resource published.', unpublished: 'Resource unpublished.', deleted: 'Resource deleted.' }
const errors: Record<string, string> = { not_found: 'The resource could not be found.', update_failed: 'The resource could not be updated.', delete_failed: 'The resource could not be deleted.' }

export default async function AdminResourcesPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const { supabase } = await requireAdminPage()
  const { data, error } = await supabase.from('resources').select('*').order('updated_at', { ascending: false })
  const resources = (data || []) as Resource[]
  const params = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><Link href="/admin/dashboard" className="text-sm text-[var(--color-ch-orange)] hover:underline">← Admin dashboard</Link><h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">Resources</h1><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Create and publish engineering knowledge content.</p></div><Link href="/admin/resources/new" className="ch-btn ch-btn-primary"><Plus size={16} /> New resource</Link></div>
      {params.message && messages[params.message] && <div className="p-4 rounded-lg bg-[var(--color-ch-green-light)] border border-[var(--color-ch-green)]/20 text-sm text-[var(--color-ch-green)]" role="status">{messages[params.message]}</div>}
      {params.error && errors[params.error] && <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-sm text-[var(--color-ch-red)]" role="alert">{errors[params.error]}</div>}
      {error ? <div className="ch-card p-10 text-center text-sm text-[var(--color-ch-red)]" role="alert">Resources could not be loaded. Please try again.</div> : resources.length === 0 ? <div className="ch-card p-12 text-center"><BookOpen size={32} className="mx-auto text-[var(--color-ch-text-muted)] mb-4" /><h2 className="text-lg font-bold text-[var(--color-ch-navy)]">No resources yet</h2><p className="text-sm text-[var(--color-ch-text-secondary)] mt-2">Create the first resource to populate the public library.</p></div> : <div className="space-y-3">{resources.map((resource) => <div key={resource.id} className="ch-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 mb-1"><h2 className="font-semibold text-[var(--color-ch-navy)] truncate">{resource.title}</h2><span className={`ch-badge ${resource.is_published ? 'ch-badge-green' : 'ch-badge-gray'}`}>{resource.is_published ? 'Published' : 'Draft'}</span><span className="ch-badge ch-badge-orange">{resource.category}</span></div><p className="text-sm text-[var(--color-ch-text-secondary)] line-clamp-2">{resource.description}</p><p className="text-xs text-[var(--color-ch-text-muted)] mt-2">Updated {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(resource.updated_at))}</p></div><AdminRowActions id={resource.id} editHref={`/admin/resources/${resource.id}/edit`} isPublished={resource.is_published} toggleAction={toggleResourcePublication} deleteAction={deleteResource} /></div>)}</div>}
    </div>
  )
}

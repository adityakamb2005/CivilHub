import Link from 'next/link'
import { Plus, Briefcase } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminRowActions } from '@/components/admin/AdminRowActions'
import { deleteOpportunity, toggleOpportunityPublication } from '@/lib/admin/actions'
import type { Opportunity } from '@/types'

export const metadata = { title: 'Manage Opportunities | CivilHub' }
export const dynamic = 'force-dynamic'

const messages: Record<string, string> = { created: 'Opportunity created.', updated: 'Opportunity updated.', published: 'Opportunity published.', unpublished: 'Opportunity unpublished.', deleted: 'Opportunity deleted.' }
const errors: Record<string, string> = { not_found: 'The opportunity could not be found.', update_failed: 'The opportunity could not be updated.', delete_failed: 'The opportunity could not be deleted.' }

export default async function AdminOpportunitiesPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const { supabase } = await requireAdminPage()
  const { data, error } = await supabase.from('opportunities').select('*').order('updated_at', { ascending: false })
  const opportunities = (data || []) as Opportunity[]
  const params = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><Link href="/admin/dashboard" className="text-sm text-[var(--color-ch-orange)] hover:underline">← Admin dashboard</Link><h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">Opportunities</h1><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Manage the public opportunity board.</p></div><Link href="/admin/opportunities/new" className="ch-btn ch-btn-primary"><Plus size={16} /> New opportunity</Link></div>
      {params.message && messages[params.message] && <div className="p-4 rounded-lg bg-[var(--color-ch-green-light)] border border-[var(--color-ch-green)]/20 text-sm text-[var(--color-ch-green)]" role="status">{messages[params.message]}</div>}
      {params.error && errors[params.error] && <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-sm text-[var(--color-ch-red)]" role="alert">{errors[params.error]}</div>}
      {error ? <div className="ch-card p-10 text-center text-sm text-[var(--color-ch-red)]" role="alert">Opportunities could not be loaded. Please try again.</div> : opportunities.length === 0 ? <div className="ch-card p-12 text-center"><Briefcase size={32} className="mx-auto text-[var(--color-ch-text-muted)] mb-4" /><h2 className="text-lg font-bold text-[var(--color-ch-navy)]">No opportunities yet</h2><p className="text-sm text-[var(--color-ch-text-secondary)] mt-2">Create the first opportunity to populate the public board.</p></div> : <div className="space-y-3">{opportunities.map((opportunity) => <div key={opportunity.id} className="ch-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 mb-1"><h2 className="font-semibold text-[var(--color-ch-navy)] truncate">{opportunity.title}</h2><span className={`ch-badge ${opportunity.is_published && opportunity.status === 'open' ? 'ch-badge-green' : 'ch-badge-gray'}`}>{opportunity.is_published ? (opportunity.status === 'open' ? 'Published / open' : 'Published / closed') : 'Draft'}</span><span className="ch-badge ch-badge-orange">{opportunity.opportunity_type}</span></div><p className="text-sm text-[var(--color-ch-text-secondary)] line-clamp-2">{opportunity.description}</p><p className="text-xs text-[var(--color-ch-text-muted)] mt-2">{opportunity.organization_name || 'No organization'}{opportunity.location ? ` · ${opportunity.location}` : ''}{opportunity.deadline ? ` · Deadline ${opportunity.deadline}` : ''}</p></div><AdminRowActions id={opportunity.id} editHref={`/admin/opportunities/${opportunity.id}/edit`} isPublished={opportunity.is_published} toggleAction={toggleOpportunityPublication} deleteAction={deleteOpportunity} /></div>)}</div>}
    </div>
  )
}

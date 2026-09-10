import Link from 'next/link'
import { Briefcase, FileText } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/auth'
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge'
import { ApplicationStatusSelect } from '@/components/admin/ApplicationStatusSelect'
import type { OpportunityApplication } from '@/types'

export const metadata = { title: 'Applications | CivilHub Admin' }
export const dynamic = 'force-dynamic'

type ApplicationWithRelations = OpportunityApplication & {
  opportunity: { id: string; title: string } | null
  engineer_profile: { id: string; profile: { full_name: string | null } | null } | null
}

export default async function AdminApplicationsPage() {
  const { supabase } = await requireAdminPage()
  const { data, error } = await (supabase as any)
    .from('opportunity_applications')
    .select('*, opportunity:opportunities(id, title), engineer_profile:engineer_profiles(id, profile:profiles(full_name))')
    .order('created_at', { ascending: false })
  const applications = (data ?? []) as ApplicationWithRelations[]

  return (
    <div className="space-y-6">
      <div><Link href="/admin/dashboard" className="text-sm text-[var(--color-ch-orange)] hover:underline">← Admin dashboard</Link><h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">Applications</h1><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Review applications and update their status.</p></div>
      {error ? <div className="ch-card p-10 text-center text-sm text-[var(--color-ch-red)]" role="alert">Applications could not be loaded. Please try again.</div> : applications.length === 0 ? <div className="ch-card p-12 text-center"><FileText size={32} className="mx-auto text-[var(--color-ch-text-muted)] mb-4" /><h2 className="text-lg font-bold text-[var(--color-ch-navy)]">No applications yet</h2><p className="text-sm text-[var(--color-ch-text-secondary)] mt-2">Applications to published opportunities will appear here.</p></div> : <div className="space-y-4">{applications.map((application) => <article key={application.id} className="ch-card p-5"><div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Briefcase size={16} className="text-[var(--color-ch-orange)]" /><Link href={application.opportunity ? `/opportunities/${application.opportunity.id}` : '/admin/opportunities'} className="font-semibold text-[var(--color-ch-navy)] hover:text-[var(--color-ch-orange)] hover:underline">{application.opportunity?.title ?? 'Unavailable opportunity'}</Link><ApplicationStatusBadge status={application.status} /></div><p className="text-sm text-[var(--color-ch-text-secondary)] mt-2">Engineer: <span className="font-medium text-[var(--color-ch-navy)]">{application.engineer_profile?.profile?.full_name || 'Unnamed engineer'}</span></p><p className="text-xs text-[var(--color-ch-text-muted)] mt-1">Submitted {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(application.created_at))}</p></div><ApplicationStatusSelect applicationId={application.id} status={application.status} /></div><div className="mt-4 pt-4 border-t border-[var(--color-ch-border-subtle)]"><h2 className="ch-text-label mb-2">Cover message</h2><p className="text-sm text-[var(--color-ch-text-secondary)] whitespace-pre-line leading-relaxed">{application.cover_message}</p></div></article>)}</div>}
    </div>
  )
}

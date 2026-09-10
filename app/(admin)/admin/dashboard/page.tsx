import Link from 'next/link'
import { ArrowRight, BookOpen, Briefcase, FileText, FolderKanban, ShieldCheck, Users } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/auth'

export const metadata = { title: 'Admin Dashboard | CivilHub' }
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdminPage()
  const [resources, publishedResources, opportunities, activeOpportunities, projects, publishedProjects, engineers, applications] = await Promise.all([
    supabase.from('resources').select('*', { count: 'exact', head: true }),
    supabase.from('resources').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('is_published', true).eq('status', 'open'),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('engineer_profiles').select('*', { count: 'exact', head: true }).eq('visibility', 'public'),
    supabase.from('opportunity_applications').select('*', { count: 'exact', head: true }),
  ])

  const cards = [
    { label: 'Resources', count: resources.count, active: publishedResources.count, href: '/admin/resources', icon: BookOpen },
    { label: 'Opportunities', count: opportunities.count, active: activeOpportunities.count, href: '/admin/opportunities', icon: Briefcase },
    { label: 'Projects', count: projects.count, active: publishedProjects.count, href: '/admin/projects', icon: FolderKanban },
    { label: 'Public engineers', count: engineers.count, active: null, href: '/engineers', icon: Users },
    { label: 'Applications', count: applications.count, active: null, href: '/admin/applications', icon: FileText },
  ]
  const countError = [resources, publishedResources, opportunities, activeOpportunities, projects, publishedProjects, engineers, applications].some((result) => result.error)

  return (
    <div className="space-y-8">
      <div>
        <span className="ch-section-label mb-3 block">Administration</span>
        <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-2">Content workspace</h1>
        <p className="text-[var(--color-ch-text-secondary)] max-w-2xl">Manage the resources, opportunities, and projects published across CivilHub.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map(({ label, count, active, href, icon: Icon }) => (
          <Link key={label} href={href} className="ch-card p-5 hover:border-[var(--color-ch-orange)]/50 transition-colors group">
            <div className="flex items-center justify-between mb-5"><Icon size={22} className="text-[var(--color-ch-orange)]" /><ArrowRight size={17} className="text-[var(--color-ch-text-muted)] group-hover:text-[var(--color-ch-orange)]" /></div>
            <div className="text-3xl font-bold text-[var(--color-ch-navy)]">{count ?? '—'}</div>
            <div className="text-sm font-semibold text-[var(--color-ch-text-secondary)] mt-1">{label}</div>
            {active !== null && <div className="text-xs text-[var(--color-ch-text-muted)] mt-3">{active ?? '—'} published/active</div>}
          </Link>
        ))}
      </div>

      {countError && <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-sm text-[var(--color-ch-red)]" role="alert">Some counts are temporarily unavailable. Please refresh the dashboard.</div>}

      <div className="ch-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3"><ShieldCheck size={20} className="text-[var(--color-ch-green)] mt-0.5 shrink-0" /><div><h2 className="font-bold text-[var(--color-ch-navy)]">Admin-only content controls</h2><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Changes are checked server-side and protected by Supabase RLS. Public visitors only see content you publish.</p></div></div>
        <Link href="/" className="ch-btn ch-btn-outline text-xs shrink-0">View public site <ArrowRight size={14} /></Link>
      </div>
    </div>
  )
}

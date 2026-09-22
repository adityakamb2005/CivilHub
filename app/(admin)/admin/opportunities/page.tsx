import Link from 'next/link'
import { Plus, Briefcase, SearchX } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminRowActions } from '@/components/admin/AdminRowActions'
import { AdminSearchFilter } from '@/components/admin/AdminSearchFilter'
import { deleteOpportunity, toggleOpportunityPublication } from '@/lib/admin/actions'
import type { Opportunity } from '@/types'

export const metadata = { title: 'Manage Opportunities | CivilHub' }
export const dynamic = 'force-dynamic'

const messages: Record<string, string> = {
  created: 'Opportunity created successfully.',
  updated: 'Opportunity updated successfully.',
  published: 'Opportunity published.',
  unpublished: 'Opportunity unpublished.',
  deleted: 'Opportunity deleted.',
}
const errors: Record<string, string> = {
  not_found: 'The opportunity could not be found.',
  update_failed: 'The opportunity could not be updated.',
  delete_failed: 'The opportunity could not be deleted.',
}

export default async function AdminOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    type?: string
    status?: string
    published?: string
    message?: string
    error?: string
  }>
}) {
  const { supabase } = await requireAdminPage()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('updated_at', { ascending: false })

  const rawOpportunities = (data || []) as Opportunity[]
  const params = await searchParams

  const query = (params.q || '').trim().toLowerCase()
  const typeFilter = params.type || 'all'
  const statusFilter = params.status || 'all'
  const publishedFilter = params.published || 'all'

  const opportunityTypes = Array.from(
    new Set(rawOpportunities.map((o) => o.opportunity_type).filter(Boolean))
  ).sort()

  const opportunities = rawOpportunities.filter((opportunity) => {
    if (query) {
      const matchTitle = opportunity.title?.toLowerCase().includes(query)
      const matchDesc = opportunity.description?.toLowerCase().includes(query)
      const matchOrg = opportunity.organization_name?.toLowerCase().includes(query)
      const matchLoc = opportunity.location?.toLowerCase().includes(query)
      const matchType = opportunity.opportunity_type?.toLowerCase().includes(query)
      if (!matchTitle && !matchDesc && !matchOrg && !matchLoc && !matchType) return false
    }

    if (typeFilter !== 'all' && opportunity.opportunity_type !== typeFilter) {
      return false
    }

    if (statusFilter !== 'all' && opportunity.status !== statusFilter) {
      return false
    }

    if (publishedFilter === 'published' && !opportunity.is_published) {
      return false
    }
    if (publishedFilter === 'draft' && opportunity.is_published) {
      return false
    }

    return true
  })

  const filterSelects = [
    {
      id: 'type',
      label: 'Opportunity Type',
      options: [
        { label: 'All Types', value: 'all' },
        ...opportunityTypes.map((t) => ({ label: t, value: t })),
      ],
    },
    {
      id: 'status',
      label: 'Status',
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    {
      id: 'published',
      label: 'Publication State',
      options: [
        { label: 'All States', value: 'all' },
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/dashboard"
            className="text-sm text-[var(--color-ch-orange)] hover:underline"
          >
            ← Admin dashboard
          </Link>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">
            Opportunities
          </h1>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
            Manage public civil engineering job listings, tenders, and career opportunities.
          </p>
        </div>
        <Link href="/admin/opportunities/new" className="ch-btn ch-btn-primary">
          <Plus size={16} /> New opportunity
        </Link>
      </div>

      {params.message && messages[params.message] && (
        <div
          className="p-4 rounded-lg bg-[var(--color-ch-green-light)] border border-[var(--color-ch-green)]/20 text-sm text-[var(--color-ch-green)]"
          role="status"
        >
          {messages[params.message]}
        </div>
      )}
      {params.error && errors[params.error] && (
        <div
          className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-sm text-[var(--color-ch-red)]"
          role="alert"
        >
          {errors[params.error]}
        </div>
      )}

      <AdminSearchFilter
        placeholder="Search opportunities by title, organization, or location..."
        filterSelects={filterSelects}
      />

      {error ? (
        <div
          className="ch-card p-10 text-center text-sm text-[var(--color-ch-red)]"
          role="alert"
        >
          Opportunities could not be loaded. Please try again.
        </div>
      ) : rawOpportunities.length === 0 ? (
        <div className="ch-card p-12 text-center">
          <Briefcase
            size={32}
            className="mx-auto text-[var(--color-ch-text-muted)] mb-4"
          />
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            No opportunities yet
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-2">
            Create the first opportunity to populate the public board.
          </p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="ch-card p-12 text-center">
          <SearchX
            size={32}
            className="mx-auto text-[var(--color-ch-text-muted)] mb-4"
          />
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            No matching opportunities
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-2">
            No opportunities matched your search and filter criteria. Try clearing filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="ch-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-semibold text-[var(--color-ch-navy)] truncate">
                    {opportunity.title}
                  </h2>
                  <span
                    className={`ch-badge ${
                      opportunity.is_published && opportunity.status === 'open'
                        ? 'ch-badge-green'
                        : opportunity.status === 'closed'
                        ? 'ch-badge-red'
                        : 'ch-badge-gray'
                    }`}
                  >
                    {opportunity.is_published
                      ? opportunity.status === 'open'
                        ? 'Published / open'
                        : 'Published / closed'
                      : 'Draft'}
                  </span>
                  <span className="ch-badge ch-badge-orange">
                    {opportunity.opportunity_type}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ch-text-secondary)] line-clamp-2">
                  {opportunity.description}
                </p>
                <p className="text-xs text-[var(--color-ch-text-muted)] mt-2">
                  {opportunity.organization_name || 'No organization'}
                  {opportunity.location ? ` · ${opportunity.location}` : ''}
                  {opportunity.deadline ? ` · Deadline ${opportunity.deadline}` : ''}
                </p>
              </div>
              <AdminRowActions
                id={opportunity.id}
                editHref={`/admin/opportunities/${opportunity.id}/edit`}
                isPublished={opportunity.is_published}
                toggleAction={toggleOpportunityPublication}
                deleteAction={deleteOpportunity}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

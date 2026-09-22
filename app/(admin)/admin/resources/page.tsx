import Link from 'next/link'
import { Plus, BookOpen, SearchX } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminRowActions } from '@/components/admin/AdminRowActions'
import { AdminSearchFilter } from '@/components/admin/AdminSearchFilter'
import { deleteResource, toggleResourcePublication } from '@/lib/admin/actions'
import type { Resource } from '@/types'

export const metadata = { title: 'Manage Resources | CivilHub' }
export const dynamic = 'force-dynamic'

const messages: Record<string, string> = {
  created: 'Resource created successfully.',
  updated: 'Resource updated successfully.',
  published: 'Resource published.',
  unpublished: 'Resource unpublished.',
  deleted: 'Resource deleted.',
}
const errors: Record<string, string> = {
  not_found: 'The resource could not be found.',
  update_failed: 'The resource could not be updated.',
  delete_failed: 'The resource could not be deleted.',
}

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    category?: string
    status?: string
    message?: string
    error?: string
  }>
}) {
  const { supabase } = await requireAdminPage()
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('updated_at', { ascending: false })

  const rawResources = (data || []) as Resource[]
  const params = await searchParams

  const query = (params.q || '').trim().toLowerCase()
  const categoryFilter = params.category || 'all'
  const statusFilter = params.status || 'all'

  const categories = Array.from(
    new Set(rawResources.map((r) => r.category).filter(Boolean))
  ).sort()

  const resources = rawResources.filter((resource) => {
    if (query) {
      const matchTitle = resource.title?.toLowerCase().includes(query)
      const matchDesc = resource.description?.toLowerCase().includes(query)
      const matchCategory = resource.category?.toLowerCase().includes(query)
      const matchAuthor = resource.author_name?.toLowerCase().includes(query)
      if (!matchTitle && !matchDesc && !matchCategory && !matchAuthor) return false
    }

    if (categoryFilter !== 'all' && resource.category !== categoryFilter) {
      return false
    }

    if (statusFilter === 'published' && !resource.is_published) {
      return false
    }
    if (statusFilter === 'draft' && resource.is_published) {
      return false
    }

    return true
  })

  const filterSelects = [
    {
      id: 'category',
      label: 'Category',
      options: [
        { label: 'All Categories', value: 'all' },
        ...categories.map((cat) => ({ label: cat, value: cat })),
      ],
    },
    {
      id: 'status',
      label: 'Publication Status',
      options: [
        { label: 'All Statuses', value: 'all' },
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
            Resources
          </h1>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
            Create, manage, and publish civil engineering knowledge resources.
          </p>
        </div>
        <Link href="/admin/resources/new" className="ch-btn ch-btn-primary">
          <Plus size={16} /> New resource
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
        placeholder="Search resources by title, content, or author..."
        filterSelects={filterSelects}
      />

      {error ? (
        <div
          className="ch-card p-10 text-center text-sm text-[var(--color-ch-red)]"
          role="alert"
        >
          Resources could not be loaded. Please try again.
        </div>
      ) : rawResources.length === 0 ? (
        <div className="ch-card p-12 text-center">
          <BookOpen
            size={32}
            className="mx-auto text-[var(--color-ch-text-muted)] mb-4"
          />
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            No resources yet
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-2">
            Create the first resource to populate the public knowledge library.
          </p>
        </div>
      ) : resources.length === 0 ? (
        <div className="ch-card p-12 text-center">
          <SearchX
            size={32}
            className="mx-auto text-[var(--color-ch-text-muted)] mb-4"
          />
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">
            No matching resources
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-2">
            No resources matched your search and filter criteria. Try clearing filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="ch-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-semibold text-[var(--color-ch-navy)] truncate">
                    {resource.title}
                  </h2>
                  <span
                    className={`ch-badge ${
                      resource.is_published
                        ? 'ch-badge-green'
                        : 'ch-badge-gray'
                    }`}
                  >
                    {resource.is_published ? 'Published' : 'Draft'}
                  </span>
                  <span className="ch-badge ch-badge-orange">
                    {resource.category}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ch-text-secondary)] line-clamp-2">
                  {resource.description}
                </p>
                <p className="text-xs text-[var(--color-ch-text-muted)] mt-2">
                  {resource.author_name ? `By ${resource.author_name} · ` : ''}
                  Updated{' '}
                  {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
                    new Date(resource.updated_at)
                  )}
                </p>
              </div>
              <AdminRowActions
                id={resource.id}
                editHref={`/admin/resources/${resource.id}/edit`}
                isPublished={resource.is_published}
                toggleAction={toggleResourcePublication}
                deleteAction={deleteResource}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

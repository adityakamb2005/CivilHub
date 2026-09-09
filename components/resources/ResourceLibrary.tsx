'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  FilterX,
  Search,
  Tag,
  UserRound,
} from 'lucide-react'
import type { Resource } from '@/types'

const ALL_CATEGORIES = 'All categories'

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

export default function ResourceLibrary({
  resources,
  errorMessage,
}: {
  resources: Resource[]
  errorMessage?: string | null
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)

  const categories = useMemo(
    () => [
      ALL_CATEGORIES,
      ...Array.from(new Set(resources.map((resource) => resource.category))).sort(),
    ],
    [resources]
  )

  const filteredResources = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return resources.filter((resource) => {
      const matchesSearch =
        !query ||
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query)
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES || resource.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [resources, searchTerm, selectedCategory])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory(ALL_CATEGORIES)
  }

  if (errorMessage) {
    return (
      <div className="ch-card p-10 sm:p-14 text-center flex flex-col items-center justify-center" role="alert">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-ch-red-light)] border border-red-200 flex items-center justify-center mb-5">
          <AlertCircle size={30} className="text-[var(--color-ch-red)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
          Resources are temporarily unavailable
        </h2>
        <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-md">
          We could not load the published resource library right now. Please try again later.
        </p>
      </div>
    )
  }

  const hasResources = resources.length > 0
  const hasActiveFilters = searchTerm.trim().length > 0 || selectedCategory !== ALL_CATEGORIES

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ch-text-muted)]"
          />
          <label htmlFor="resource-search" className="sr-only">
            Search resources by title or description
          </label>
          <input
            id="resource-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title or description…"
            className="ch-input pl-10 h-11"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="resource-category" className="sr-only">
            Filter resources by category
          </label>
          <select
            id="resource-category"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="ch-input bg-white h-11 pr-8 text-sm font-medium cursor-pointer"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ch-btn ch-btn-ghost text-xs gap-1 h-11 px-3 text-[var(--color-ch-text-muted)] hover:text-[var(--color-ch-navy)]"
              title="Reset resource filters"
            >
              <FilterX size={16} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {!hasResources ? (
        <div className="ch-card p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] flex items-center justify-center mb-5">
            <BookOpen size={32} className="text-[var(--color-ch-text-muted)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
            No resources published yet
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-md">
            The CivilHub team has not published any resources yet. Check back soon for engineering articles, formulas, and practical references.
          </p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="ch-card p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-ch-orange-light)] flex items-center justify-center mb-4 text-[var(--color-ch-orange)]">
            <Search size={24} />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-1">
            No matching resources found
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-sm mb-4">
            Try a different title, description, or category, or clear the current filters.
          </p>
          <button type="button" onClick={clearFilters} className="ch-btn ch-btn-outline text-xs">
            Clear Search Filters
          </button>
        </div>
      ) : (
        <div>
          <div className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase tracking-wider mb-4">
            Showing {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => {
              const publishedDate = formatDate(resource.published_at || resource.created_at)

              return (
                <Link
                  key={resource.id}
                  href={`/resources/${resource.id}`}
                  className="ch-card p-6 hover:shadow-[0_4px_16px_0_rgb(15_28_46/0.10)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col group"
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="ch-badge ch-badge-orange gap-1 max-w-full truncate">
                      <Tag size={12} />
                      {resource.category}
                    </span>
                    {publishedDate && (
                      <time dateTime={resource.published_at || resource.created_at} className="text-xs text-[var(--color-ch-text-muted)] whitespace-nowrap">
                        {publishedDate}
                      </time>
                    )}
                  </div>

                  <h2 className="font-semibold text-[var(--color-ch-navy)] mb-2 leading-snug group-hover:text-[var(--color-ch-orange)] transition-colors">
                    {resource.title}
                  </h2>
                  <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed line-clamp-4 flex-1 mb-5">
                    {resource.description}
                  </p>

                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--color-ch-border-subtle)] text-xs">
                    <span className="flex items-center gap-1.5 text-[var(--color-ch-text-muted)] truncate">
                      <UserRound size={13} />
                      {resource.author_name || resource.source_name || 'CivilHub'}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--color-ch-orange)] font-medium whitespace-nowrap">
                      Read resource
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

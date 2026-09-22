'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Suspense } from 'react'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterSelect {
  id: string
  label: string
  options: FilterOption[]
}

function AdminSearchFilterContent({
  placeholder,
  filterSelects,
}: {
  placeholder: string
  filterSelects: FilterSelect[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('q') || ''

  const handleSearchChange = (term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleFilterChange = (filterId: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(filterId, value)
    } else {
      params.delete(filterId)
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    filterSelects.forEach((f) => params.delete(f.id))
    router.replace(`${pathname}?${params.toString()}`)
  }

  const hasActiveFilters =
    Boolean(currentSearch) ||
    filterSelects.some(
      (f) => searchParams.has(f.id) && searchParams.get(f.id) !== 'all'
    )

  return (
    <div className="ch-card p-4 bg-white">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ch-text-muted)] pointer-events-none"
          />
          <input
            type="text"
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={placeholder}
            className="ch-input pl-10 pr-9 py-2 text-sm w-full"
            aria-label={placeholder}
          />
          {currentSearch && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ch-text-muted)] hover:text-[var(--color-ch-navy)]"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {filterSelects.map((filter) => {
          const val = searchParams.get(filter.id) || 'all'
          return (
            <div key={filter.id} className="min-w-[150px]">
              <select
                value={val}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                className="ch-input py-2 text-sm bg-white"
                aria-label={filter.label}
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="ch-btn ch-btn-ghost text-xs px-3 py-2 text-[var(--color-ch-red)] hover:bg-[var(--color-ch-red-light)] flex items-center gap-1.5 shrink-0"
          >
            <X size={14} /> Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

export function AdminSearchFilter(props: {
  placeholder?: string
  filterSelects?: FilterSelect[]
}) {
  return (
    <Suspense
      fallback={<div className="ch-card p-4 bg-white min-h-[56px] animate-pulse" />}
    >
      <AdminSearchFilterContent
        placeholder={props.placeholder || 'Search by keyword...'}
        filterSelects={props.filterSelects || []}
      />
    </Suspense>
  )
}

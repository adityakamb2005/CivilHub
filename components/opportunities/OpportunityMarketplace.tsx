'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  FilterX,
  MapPin,
  Search,
} from 'lucide-react'
import type { Opportunity } from '@/types'

const ALL_TYPES = 'All opportunity types'
const ALL_LOCATIONS = 'All locations'

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

export default function OpportunityMarketplace({
  opportunities,
  errorMessage,
}: {
  opportunities: Opportunity[]
  errorMessage?: string | null
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState(ALL_TYPES)
  const [selectedLocation, setSelectedLocation] = useState(ALL_LOCATIONS)

  const types = useMemo(
    () => [
      ALL_TYPES,
      ...Array.from(new Set(opportunities.map((opportunity) => opportunity.opportunity_type))).sort(),
    ],
    [opportunities]
  )

  const locations = useMemo(
    () => [
      ALL_LOCATIONS,
      ...Array.from(
        new Set(
          opportunities
            .map((opportunity) => opportunity.location)
            .filter((location): location is string => Boolean(location))
        )
      ).sort(),
    ],
    [opportunities]
  )

  const filteredOpportunities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return opportunities.filter((opportunity) => {
      const matchesSearch =
        !query ||
        opportunity.title.toLowerCase().includes(query) ||
        opportunity.description.toLowerCase().includes(query)
      const matchesType =
        selectedType === ALL_TYPES || opportunity.opportunity_type === selectedType
      const matchesLocation =
        selectedLocation === ALL_LOCATIONS || opportunity.location === selectedLocation

      return matchesSearch && matchesType && matchesLocation
    })
  }, [opportunities, searchTerm, selectedType, selectedLocation])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedType(ALL_TYPES)
    setSelectedLocation(ALL_LOCATIONS)
  }

  if (errorMessage) {
    return (
      <div className="ch-card p-10 sm:p-14 text-center flex flex-col items-center justify-center" role="alert">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-ch-red-light)] border border-red-200 flex items-center justify-center mb-5">
          <AlertCircle size={30} className="text-[var(--color-ch-red)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
          Opportunities are temporarily unavailable
        </h2>
        <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-md">
          We could not load the active opportunity board right now. Please try again later.
        </p>
      </div>
    )
  }

  const hasOpportunities = opportunities.length > 0
  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedType !== ALL_TYPES ||
    selectedLocation !== ALL_LOCATIONS

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ch-text-muted)]"
          />
          <label htmlFor="opportunity-search" className="sr-only">
            Search opportunities by title or description
          </label>
          <input
            id="opportunity-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title or description…"
            className="ch-input pl-10 h-11"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <label htmlFor="opportunity-type" className="sr-only">
            Filter opportunities by type
          </label>
          <select
            id="opportunity-type"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className="ch-input bg-white h-11 pr-8 text-sm font-medium cursor-pointer"
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <label htmlFor="opportunity-location" className="sr-only">
            Filter opportunities by location
          </label>
          <select
            id="opportunity-location"
            value={selectedLocation}
            onChange={(event) => setSelectedLocation(event.target.value)}
            className="ch-input bg-white h-11 pr-8 text-sm font-medium cursor-pointer"
          >
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ch-btn ch-btn-ghost text-xs gap-1 h-11 px-3 text-[var(--color-ch-text-muted)] hover:text-[var(--color-ch-navy)]"
              title="Reset opportunity filters"
            >
              <FilterX size={16} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {!hasOpportunities ? (
        <div className="ch-card p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] flex items-center justify-center mb-5">
            <Briefcase size={32} className="text-[var(--color-ch-text-muted)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
            No opportunities published yet
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-md">
            There are no active public opportunities on CivilHub right now. Check back soon for engineering jobs, tenders, and other opportunities.
          </p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="ch-card p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-ch-orange-light)] flex items-center justify-center mb-4 text-[var(--color-ch-orange)]">
            <Search size={24} />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-1">
            No matching opportunities found
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-sm mb-4">
            Try adjusting the search, type, or location filters.
          </p>
          <button type="button" onClick={clearFilters} className="ch-btn ch-btn-outline text-xs">
            Clear Search Filters
          </button>
        </div>
      ) : (
        <div>
          <div className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase tracking-wider mb-4">
            Showing {filteredOpportunities.length}{' '}
            {filteredOpportunities.length === 1 ? 'opportunity' : 'opportunities'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => {
              const deadline = formatDate(opportunity.deadline)

              return (
                <Link
                  key={opportunity.id}
                  href={`/opportunities/${opportunity.id}`}
                  className="ch-card p-6 hover:shadow-[0_4px_16px_0_rgb(15_28_46/0.10)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col group"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="ch-badge ch-badge-orange gap-1 max-w-full truncate">
                      <Briefcase size={12} />
                      {opportunity.opportunity_type}
                    </span>
                    <span className="ch-badge ch-badge-green shrink-0">Open</span>
                  </div>

                  <h2 className="font-semibold text-[var(--color-ch-navy)] mb-2 leading-snug group-hover:text-[var(--color-ch-orange)] transition-colors">
                    {opportunity.title}
                  </h2>
                  <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed line-clamp-4 flex-1 mb-5">
                    {opportunity.description}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-[var(--color-ch-border-subtle)] text-xs text-[var(--color-ch-text-secondary)]">
                    {opportunity.organization_name && (
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-[var(--color-ch-text-muted)] shrink-0" />
                        <span className="truncate">{opportunity.organization_name}</span>
                      </div>
                    )}
                    {opportunity.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[var(--color-ch-text-muted)] shrink-0" />
                        <span className="truncate">{opportunity.location}</span>
                      </div>
                    )}
                    {deadline && (
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-[var(--color-ch-text-muted)] shrink-0" />
                        <span>Deadline: {deadline}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-5 mt-4 border-t border-[var(--color-ch-border-subtle)] text-xs text-[var(--color-ch-orange)] font-medium">
                    View details
                    <ArrowRight size={14} />
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

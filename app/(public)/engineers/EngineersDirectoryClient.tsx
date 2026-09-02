'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Database } from '@/types/database'
import { 
  Search, 
  SlidersHorizontal, 
  HardHat, 
  MapPin, 
  Briefcase, 
  BadgeCheck, 
  ArrowRight,
  FilterX
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']
type EngineerProfile = Database['public']['Tables']['engineer_profiles']['Row']

export interface PublicEngineerItem {
  id: string
  full_name: string | null
  avatar_url: string | null
  location: string | null
  title: string | null
  specialization: EngineerProfile['specialization']
  years_experience: number | null
  is_verified: boolean
}

const SPECIALIZATIONS = [
  'All Specializations',
  'Structural Engineering',
  'Civil Construction',
  'Geotechnical Engineering',
  'Transportation Engineering',
  'Water Resources',
  'Environmental Engineering',
  'Construction Management',
  'Surveying',
  'Quantity Surveying',
  'Other',
] as const

export function EngineersDirectoryClient({
  engineers,
}: {
  engineers: PublicEngineerItem[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('All Specializations')

  const filteredEngineers = useMemo(() => {
    return engineers.filter((eng) => {
      const nameMatch = (eng.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      const titleMatch = (eng.title || '').toLowerCase().includes(searchTerm.toLowerCase())
      const specMatch = (eng.specialization || '').toLowerCase().includes(searchTerm.toLowerCase())
      const locationMatch = (eng.location || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSearch = nameMatch || titleMatch || specMatch || locationMatch

      const matchesSpec = 
        selectedSpecialization === 'All Specializations' || 
        eng.specialization === selectedSpecialization

      return matchesSearch && matchesSpec
    })
  }, [engineers, searchTerm, selectedSpecialization])

  const hasEngineersInDb = engineers.length > 0

  return (
    <div>
      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ch-text-muted)]"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search engineers by name, title, specialization, or location..."
            className="ch-input pl-10 h-11"
            aria-label="Search engineers"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="ch-input bg-white h-11 pr-8 text-sm font-medium border-[var(--color-ch-border)] cursor-pointer"
              aria-label="Filter by specialization"
            >
              {SPECIALIZATIONS.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedSpecialization !== 'All Specializations') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedSpecialization('All Specializations')
              }}
              className="ch-btn ch-btn-ghost text-xs gap-1 h-11 px-3 text-[var(--color-ch-text-muted)] hover:text-[var(--color-ch-navy)]"
              title="Reset filters"
            >
              <FilterX size={16} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Content */}
      {!hasEngineersInDb ? (
        /* Empty Database State */
        <div className="ch-card p-12 text-center flex flex-col items-center justify-center my-8">
          <div className="w-16 h-16 bg-[var(--color-ch-surface)] rounded-2xl border border-[var(--color-ch-border)] flex items-center justify-center mb-4">
            <HardHat size={32} className="text-[var(--color-ch-text-muted)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
            No Public Engineer Profiles Available Yet
          </h2>
          <p className="text-[var(--color-ch-text-secondary)] max-w-md mb-6">
            Engineers are currently setting up their profiles on CivilHub. If you are a civil engineer, create and publish your profile today!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/register?role=engineer" className="ch-btn ch-btn-primary">
              Join as an Engineer
            </Link>
            <Link href="/login" className="ch-btn ch-btn-outline">
              Sign In to Your Workspace
            </Link>
          </div>
        </div>
      ) : filteredEngineers.length === 0 ? (
        /* No Filter Results State */
        <div className="ch-card p-12 text-center flex flex-col items-center justify-center my-8">
          <div className="w-12 h-12 bg-[var(--color-ch-orange-light)] rounded-full flex items-center justify-center mb-3 text-[var(--color-ch-orange)]">
            <Search size={24} />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-1">
            No matching engineers found
          </h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-sm mb-4">
            Try adjusting your search criteria or resetting the specialization filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedSpecialization('All Specializations')
            }}
            className="ch-btn ch-btn-outline text-xs"
          >
            Clear Search Filters
          </button>
        </div>
      ) : (
        /* Engineers Grid */
        <div>
          <div className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase tracking-wider mb-4">
            Showing {filteredEngineers.length} {filteredEngineers.length === 1 ? 'Engineer' : 'Engineers'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEngineers.map((eng) => {
              const displayName = eng.full_name || 'Civil Engineer'
              return (
                <div
                  key={eng.id}
                  className="ch-card p-6 flex flex-col justify-between hover:shadow-md hover:border-[var(--color-ch-orange)]/40 transition-all group"
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-[var(--color-ch-surface)] p-0.5 border border-[var(--color-ch-border)] overflow-hidden shrink-0">
                        {eng.avatar_url ? (
                          <img
                            src={eng.avatar_url}
                            alt={displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[var(--color-ch-orange-light)] flex items-center justify-center text-[var(--color-ch-orange)] font-bold text-lg">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {eng.is_verified && (
                        <span className="ch-badge ch-badge-green text-xs gap-1 py-1 px-2.5">
                          <BadgeCheck size={13} />
                          Verified
                        </span>
                      )}
                    </div>

                    {/* Name & Title */}
                    <h3 className="font-bold text-lg text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)] transition-colors line-clamp-1">
                      {displayName}
                    </h3>
                    <p className="text-sm font-medium text-[var(--color-ch-text-secondary)] mb-3 line-clamp-1">
                      {eng.title || 'Civil Engineer'}
                    </p>

                    {/* Specialization Badge */}
                    {eng.specialization && (
                      <span className="ch-badge ch-badge-navy text-xs mb-4 inline-block max-w-full truncate">
                        {eng.specialization}
                      </span>
                    )}

                    {/* Details */}
                    <div className="space-y-2 text-xs text-[var(--color-ch-text-secondary)] pt-3 border-t border-[var(--color-ch-border-subtle)] mb-6">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[var(--color-ch-text-muted)] shrink-0" />
                        <span className="truncate">{eng.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-[var(--color-ch-text-muted)] shrink-0" />
                        <span>
                          {eng.years_experience !== null && eng.years_experience !== undefined
                            ? `${eng.years_experience} Years Experience`
                            : 'Experience not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <Link
                    href={`/engineers/${eng.id}`}
                    className="ch-btn ch-btn-outline w-full text-xs justify-between group-hover:bg-[var(--color-ch-orange)] group-hover:text-white group-hover:border-[var(--color-ch-orange)] transition-all"
                  >
                    <span>View Public Profile</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

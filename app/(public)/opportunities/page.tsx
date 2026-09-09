import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import OpportunityMarketplace from '@/components/opportunities/OpportunityMarketplace'
import type { Opportunity } from '@/types'

export const metadata: Metadata = {
  title: 'Opportunities | CivilHub',
  description:
    'Browse civil engineering job listings, tenders, and career opportunities on CivilHub.',
}

export const dynamic = 'force-dynamic'

export default async function OpportunitiesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <div className="ch-section">
      <div className="ch-container">
        <div className="mb-10">
          <span className="ch-section-label mb-3 block">Opportunities</span>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
            Civil Engineering Opportunities
          </h1>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl">
            Job listings, project tenders, and career opportunities across the civil engineering industry.
          </p>
        </div>

        <OpportunityMarketplace
          opportunities={(data || []) as Opportunity[]}
          errorMessage={error ? 'Unable to load opportunities.' : null}
        />
      </div>
    </div>
  )
}

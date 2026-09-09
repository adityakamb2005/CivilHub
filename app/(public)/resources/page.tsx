import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ResourceLibrary from '@/components/resources/ResourceLibrary'
import type { Resource } from '@/types'

export const metadata: Metadata = {
  title: 'Resources | CivilHub',
  description:
    'Civil engineering articles, formulas, tutorials, career guidance, and construction knowledge on CivilHub.',
}

export const dynamic = 'force-dynamic'

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <div className="ch-section">
      <div className="ch-container">
        <div className="mb-10">
          <span className="ch-section-label mb-3 block">Resources</span>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
            Engineering Knowledge Hub
          </h1>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl">
            Articles, formulas, tutorials, career resources, and engineering references — curated for civil engineering professionals.
          </p>
        </div>

        <ResourceLibrary
          resources={(data || []) as Resource[]}
          errorMessage={error ? 'Unable to load resources.' : null}
        />
      </div>
    </div>
  )
}

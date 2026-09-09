import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProjectDirectory from '@/components/projects/ProjectDirectory'
import type { Project } from '@/types'

export const metadata: Metadata = {
  title: 'Projects | CivilHub',
  description: 'Browse civil engineering and construction projects on CivilHub.',
}

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('end_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <div className="ch-section">
      <div className="ch-container">
        <div className="mb-10">
          <span className="ch-section-label mb-3 block">Portfolio Projects</span>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
            Civil Engineering Projects
          </h1>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl">
            Explore completed and ongoing civil engineering projects from engineers on the platform.
          </p>
        </div>

        <ProjectDirectory
          projects={(data || []) as Project[]}
          errorMessage={error ? 'Unable to load projects.' : null}
        />
      </div>
    </div>
  )
}

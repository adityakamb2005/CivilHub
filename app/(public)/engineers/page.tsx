import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { EngineersDirectoryClient, PublicEngineerItem } from './EngineersDirectoryClient'

export const metadata: Metadata = {
  title: 'Find Civil Engineers | CivilHub',
  description:
    'Browse and connect with verified civil engineers. Filter by specialization, location, and experience.',
}

type Profile = Database['public']['Tables']['profiles']['Row']
type EngineerProfile = Database['public']['Tables']['engineer_profiles']['Row']

export default async function EngineersPage() {
  const supabase = await createClient()

  // 1. Fetch engineer profiles with visibility = 'public'
  const { data: engData } = await supabase
    .from('engineer_profiles')
    .select('*')
    .eq('visibility', 'public')

  const publicEngProfiles = (engData || []) as EngineerProfile[]

  if (publicEngProfiles.length === 0) {
    return (
      <div className="ch-section">
        <div className="ch-container">
          <div className="mb-10">
            <span className="ch-section-label mb-3 block">Engineer Directory</span>
            <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
              Find a Civil Engineer
            </h1>
            <p className="text-[var(--color-ch-text-secondary)] max-w-xl">
              Browse verified civil engineers across CivilHub. Filter by specialization, location, and experience level.
            </p>
          </div>

          <EngineersDirectoryClient engineers={[]} />
        </div>
      </div>
    )
  }

  // 2. Fetch corresponding profiles for public engineers
  const profileIds = publicEngProfiles.map((e) => e.profile_id)

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')
    .in('id', profileIds)
    .eq('role', 'engineer')

  const profilesMap = new Map<string, Profile>()
  ;((profilesData || []) as Profile[]).forEach((p) => {
    profilesMap.set(p.id, p)
  })

  // 3. Combine into PublicEngineerItem array
  const engineersList: PublicEngineerItem[] = []

  publicEngProfiles.forEach((eng) => {
    const prof = profilesMap.get(eng.profile_id)
    if (prof) {
      engineersList.push({
        id: prof.id,
        full_name: prof.full_name,
        avatar_url: prof.avatar_url,
        location: prof.location,
        title: eng.title,
        specialization: eng.specialization,
        years_experience: eng.years_experience,
        is_verified: eng.is_verified || false,
      })
    }
  })

  return (
    <div className="ch-section">
      <div className="ch-container">
        {/* Page header */}
        <div className="mb-10">
          <span className="ch-section-label mb-3 block">Engineer Directory</span>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
            Find a Civil Engineer
          </h1>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl">
            Browse verified civil engineers across CivilHub. Filter by specialization, location, and experience level.
          </p>
        </div>

        {/* Directory Search & List */}
        <EngineersDirectoryClient engineers={engineersList} />
      </div>
    </div>
  )
}

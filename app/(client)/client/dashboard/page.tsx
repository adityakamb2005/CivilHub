import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database'
import { ClientDashboardHeader } from './components/ClientDashboardHeader'
import { ClientProfileCompletionCard } from './components/ClientProfileCompletionCard'
import { ClientQuickActions } from './components/ClientQuickActions'
import { ClientProjectsSummary } from './components/ClientProjectsSummary'

export const metadata = {
  title: 'Client Dashboard | CivilHub',
  description: 'Manage your projects and engineering needs on CivilHub.',
}

export default async function ClientDashboardPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch profile
  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = data as Database['public']['Tables']['profiles']['Row'] | null

  if (profileError || !profile) {
    return (
      <div className="ch-card p-8 text-center text-[var(--color-ch-red)]">
        <h2 className="text-xl font-bold mb-2">Error Loading Profile</h2>
        <p>There was a problem loading your profile data. Please try refreshing the page.</p>
      </div>
    )
  }

  // Ensure role is client
  if (profile.role !== 'client') {
    redirect('/')
  }

  // Fetch client profile (if it exists)
  const { data: clientProfileData } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()
  const clientProfile = clientProfileData as Database['public']['Tables']['client_profiles']['Row'] | null

  // Fetch client's own projects
  let projects: Database['public']['Tables']['projects']['Row'][] = []
  let projectsError = false

  if (clientProfile) {
    const { data: projectsData, error: projectsQueryError } = await (supabase as any)
      .from('projects')
      .select('*')
      .eq('client_profile_id', clientProfile.id)
      .order('updated_at', { ascending: false })

    projects = (projectsData ?? []) as Database['public']['Tables']['projects']['Row'][]
    projectsError = Boolean(projectsQueryError)
  }

  // Fetch platform counts
  const [opportunitiesResult, resourcesResult] = await Promise.all([
    supabase.from('opportunities').select('*', { count: 'exact', head: true }),
    supabase.from('resources').select('*', { count: 'exact', head: true }),
  ])

  const summaryError = Boolean(
    opportunitiesResult.error || resourcesResult.error
  )

  return (
    <div className="max-w-6xl mx-auto">
      <ClientDashboardHeader name={profile.full_name} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <ClientProfileCompletionCard
            profile={profile}
            clientProfile={clientProfile}
          />
          <ClientQuickActions />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="ch-card p-6">
            <h3 className="text-sm font-bold text-[var(--color-ch-navy)] mb-4 uppercase tracking-wider">Profile Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ch-text-secondary)]">Name</span>
                <span className="font-medium text-[var(--color-ch-navy)] truncate ml-4">{profile.full_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ch-text-secondary)]">Company</span>
                <span className="font-medium text-[var(--color-ch-navy)] truncate ml-4">{clientProfile?.company || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ch-text-secondary)]">Location</span>
                <span className="font-medium text-[var(--color-ch-navy)] truncate ml-4">{profile.location || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ch-text-secondary)]">Phone</span>
                <span className="font-medium text-[var(--color-ch-navy)] truncate ml-4">{profile.phone || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ClientProjectsSummary
          projects={projects}
          projectsError={projectsError}
          opportunitiesCount={opportunitiesResult.count ?? null}
          resourcesCount={resourcesResult.count ?? null}
          summaryError={summaryError}
          hasClientProfile={Boolean(clientProfile)}
        />
      </div>
    </div>
  )
}

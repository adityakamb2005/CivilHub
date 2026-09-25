import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database'
import { DashboardHeader } from './components/DashboardHeader'
import { ProfileCompletionCard } from './components/ProfileCompletionCard'
import { ProfileStatusCard } from './components/ProfileStatusCard'
import { QuickActions } from './components/QuickActions'
import { ProfilePreview } from './components/ProfilePreview'
import { EngineerWorkspace } from './components/EngineerWorkspace'

export const metadata = {
  title: 'Engineer Dashboard | CivilHub',
  description: 'Manage your professional engineering profile on CivilHub.',
}

export default async function EngineerDashboardPage() {
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

  // Ensure role is engineer
  if (profile.role !== 'engineer') {
    redirect('/')
  }

  // Fetch engineer profile (if it exists)
  const { data: engineerProfileData, error: engineerProfileError } = await supabase
    .from('engineer_profiles')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()
  const engineerProfile = engineerProfileData as Database['public']['Tables']['engineer_profiles']['Row'] | null

  // Fetch assigned projects
  let projects: Database['public']['Tables']['projects']['Row'][] = []
  let projectsError = false

  if (engineerProfile) {
    const { data: projectsData, error: projectsQueryError } = await supabase
      .from('projects')
      .select('*')
      .eq('engineer_profile_id', engineerProfile.id)
      .order('end_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    projects = (projectsData ?? []) as Database['public']['Tables']['projects']['Row'][]
    projectsError = Boolean(projectsQueryError)
  }

  // Fetch Opportunity Applications
  let applications: Array<Database['public']['Tables']['opportunity_applications']['Row'] & { opportunity: Pick<Database['public']['Tables']['opportunities']['Row'], 'id' | 'title'> | null }> = []
  let applicationsError = false
  if (engineerProfile) {
    const { data: applicationsData, error: applicationsQueryError } = await (supabase as any)
      .from('opportunity_applications')
      .select('*, opportunity:opportunities(id, title)')
      .eq('engineer_profile_id', engineerProfile.id)
      .order('created_at', { ascending: false })
    applications = applicationsData ?? []
    applicationsError = Boolean(applicationsQueryError)
  }

  // Fetch Project Applications
  let projectApplications: Array<Database['public']['Tables']['project_applications']['Row'] & { project: Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'title' | 'client_name'> | null }> = []
  let projectApplicationsError = false
  if (engineerProfile) {
    const { data: projAppData, error: projAppQueryError } = await (supabase as any)
      .from('project_applications')
      .select('*, project:projects(id, title, client_name)')
      .eq('engineer_profile_id', engineerProfile.id)
      .order('created_at', { ascending: false })
    projectApplications = projAppData ?? []
    projectApplicationsError = Boolean(projAppQueryError)
  }

  // Fetch portfolio entries count
  let portfolioCount = 0
  if (engineerProfile) {
    const { count } = await (supabase as any)
      .from('engineer_portfolios')
      .select('*', { count: 'exact', head: true })
      .eq('engineer_profile_id', engineerProfile.id)
    portfolioCount = count || 0
  }

  const [opportunitiesResult, resourcesResult] = await Promise.all([
    supabase.from('opportunities').select('*', { count: 'exact', head: true }),
    supabase.from('resources').select('*', { count: 'exact', head: true }),
  ])

  const summaryError = Boolean(
    engineerProfileError || opportunitiesResult.error || resourcesResult.error
  )

  return (
    <div className="max-w-6xl mx-auto">
      <DashboardHeader name={profile.full_name} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileCompletionCard 
            profile={profile} 
            engineerProfile={engineerProfile} 
            portfolioCount={portfolioCount}
          />
          <QuickActions profileId={engineerProfile ? user.id : undefined} />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <ProfilePreview 
            profile={profile} 
            engineerProfile={engineerProfile} 
          />
          <ProfileStatusCard 
            engineerProfile={engineerProfile} 
          />
        </div>
      </div>

      <div className="mt-8">
        <EngineerWorkspace
          engineerProfile={engineerProfile}
          projects={projects}
          opportunitiesCount={opportunitiesResult.count ?? null}
          resourcesCount={resourcesResult.count ?? null}
          projectsError={projectsError}
          applications={applications}
          applicationsError={applicationsError}
          projectApplications={projectApplications}
          projectApplicationsError={projectApplicationsError}
          summaryError={summaryError}
        />
      </div>
    </div>
  )
}

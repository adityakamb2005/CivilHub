import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database'
import { DashboardHeader } from './components/DashboardHeader'
import { ProfileCompletionCard } from './components/ProfileCompletionCard'
import { ProfileStatusCard } from './components/ProfileStatusCard'
import { QuickActions } from './components/QuickActions'
import { ProfilePreview } from './components/ProfilePreview'

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
  const { data: engineerProfile } = await supabase
    .from('engineer_profiles')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  return (
    <div className="max-w-6xl mx-auto">
      <DashboardHeader name={profile.full_name} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileCompletionCard 
            profile={profile} 
            engineerProfile={engineerProfile} 
          />
          <QuickActions />
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
    </div>
  )
}

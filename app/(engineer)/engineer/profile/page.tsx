import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database'
import { ProfileEditorForm } from './ProfileEditorForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Edit Engineer Profile | CivilHub',
  description: 'Update your professional engineering profile on CivilHub.',
}

export default async function EngineerProfilePage() {
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
      <div className="max-w-4xl mx-auto p-4">
        <div className="ch-card p-8 text-center text-[var(--color-ch-red)]">
          <h2 className="text-xl font-bold mb-2">Error Loading Profile</h2>
          <p>There was a problem loading your profile data. Please try refreshing the page.</p>
        </div>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link 
          href="/engineer/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-2">
          {engineerProfile ? 'Edit Professional Profile' : 'Complete Your Profile'}
        </h1>
        <p className="text-[var(--color-ch-text-secondary)] text-base">
          A complete profile helps clients and potential employers discover your expertise on CivilHub.
        </p>
      </div>

      <ProfileEditorForm 
        profile={profile} 
        engineerProfile={engineerProfile} 
      />
    </div>
  )
}

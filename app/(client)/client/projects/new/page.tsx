import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProjectCreateForm } from './ProjectCreateForm'
import { Database } from '@/types/database'

export default async function NewClientProjectPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile to verify role
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Database['public']['Tables']['profiles']['Row'] | null

  if (!profile || profile.role !== 'client') {
    redirect('/')
  }

  // Fetch client profile
  const { data: clientProfileData } = await (supabase as any)
    .from('client_profiles')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  let clientProfile = clientProfileData as Database['public']['Tables']['client_profiles']['Row'] | null

  // If client_profiles record doesn't exist yet, attempt to create it
  if (!clientProfile) {
    const { data: newCp, error: cpErr } = await (supabase as any)
      .from('client_profiles')
      .insert({ profile_id: user.id })
      .select('*')
      .single()

    if (!cpErr && newCp) {
      clientProfile = newCp as Database['public']['Tables']['client_profiles']['Row']
    }
  }

  const clientProfileId = clientProfile?.id || user.id
  const clientName = clientProfile?.company || profile?.full_name || null

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <Link
          href="/client/projects"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-orange)] transition-colors mb-3 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Projects
        </Link>
        <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] text-2xl font-bold">
          Create New Civil Project
        </h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
          Add your project details to connect with qualified civil engineers and track progress.
        </p>
      </div>

      {/* Project Form */}
      <ProjectCreateForm clientProfileId={clientProfileId} clientName={clientName} />
    </div>
  )
}

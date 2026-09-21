import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProjectEditForm } from './ProjectEditForm'
import type { Database } from '@/types/database'

interface ProjectEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectEditPage({ params }: ProjectEditPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch role check
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Database['public']['Tables']['profiles']['Row'] | null

  if (!profile || profile.role !== 'client') {
    redirect('/')
  }

  // Fetch client_profile.id
  const { data: clientProfileData } = await (supabase as any)
    .from('client_profiles')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  const clientProfileId = clientProfileData?.id || null

  // Fetch project owned by this client
  const { data: projectData, error } = await (supabase as any)
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('client_profile_id', clientProfileId)
    .single()

  const project = projectData as Database['public']['Tables']['projects']['Row'] | null

  if (error || !project) {
    notFound()
  }

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
        <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] text-2xl font-bold truncate">
          Edit {project.title}
        </h1>
        <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
          Manage project details, dates, status, and directory publication settings.
        </p>
      </div>

      {/* Edit Form */}
      <ProjectEditForm project={project} />
    </div>
  )
}

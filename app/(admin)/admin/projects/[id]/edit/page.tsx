import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminProjectForm } from '@/components/admin/AdminProjectForm'
import type { Project } from '@/types'

export const metadata = { title: 'Edit Project | CivilHub' }

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage()
  const { id } = await params
  const [{ data, error }, { data: engineerData }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).maybeSingle(),
    supabase.from('engineer_profiles').select('id, profile_id').eq('visibility', 'public').order('updated_at', { ascending: false }),
  ])
  if (error || !data) notFound()
  const engineerRows = (engineerData || []) as { id: string; profile_id: string }[]
  const profileIds = engineerRows.map((engineer) => engineer.profile_id)
  const { data: profileData } = profileIds.length ? await supabase.from('profiles').select('id, full_name').in('id', profileIds) : { data: [] }
  const profileNames = new Map(((profileData || []) as { id: string; full_name: string | null }[]).map((profile) => [profile.id, profile.full_name || 'Unnamed engineer']))
  const engineers = engineerRows.map((engineer) => ({ id: engineer.id, name: profileNames.get(engineer.profile_id) || `Engineer profile ${engineer.id.slice(0, 8)}` }))
  return <div className="max-w-4xl mx-auto space-y-6"><div><Link href="/admin/projects" className="text-sm text-[var(--color-ch-orange)] hover:underline">← Back to projects</Link><h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">Edit project</h1><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Update project details and publication status.</p></div><AdminProjectForm project={data as Project} engineers={engineers} /></div>
}

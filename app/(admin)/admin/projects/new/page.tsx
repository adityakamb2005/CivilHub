import Link from 'next/link'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminProjectForm } from '@/components/admin/AdminProjectForm'

export const metadata = { title: 'New Project | CivilHub' }

export default async function NewProjectPage() {
  const { supabase } = await requireAdminPage()
  const { data: engineerData } = await supabase.from('engineer_profiles').select('id, profile_id').eq('visibility', 'public').order('updated_at', { ascending: false })
  const engineerRows = (engineerData || []) as { id: string; profile_id: string }[]
  const profileIds = engineerRows.map((engineer) => engineer.profile_id)
  const { data: profileData } = profileIds.length ? await supabase.from('profiles').select('id, full_name').in('id', profileIds) : { data: [] }
  const profileNames = new Map(((profileData || []) as { id: string; full_name: string | null }[]).map((profile) => [profile.id, profile.full_name || 'Unnamed engineer']))
  const engineers = engineerRows.map((engineer) => ({ id: engineer.id, name: profileNames.get(engineer.profile_id) || `Engineer profile ${engineer.id.slice(0, 8)}` }))
  return <div className="max-w-4xl mx-auto space-y-6"><div><Link href="/admin/projects" className="text-sm text-[var(--color-ch-orange)] hover:underline">← Back to projects</Link><h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">New project</h1><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Add a project to the CivilHub directory.</p></div><AdminProjectForm engineers={engineers} /></div>
}

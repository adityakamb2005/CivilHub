import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminResourceForm } from '@/components/admin/AdminResourceForm'
import type { Resource } from '@/types'

export const metadata = { title: 'Edit Resource | CivilHub' }

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage()
  const { id } = await params
  const { data, error } = await supabase.from('resources').select('*').eq('id', id).maybeSingle()
  if (error || !data) notFound()
  return <div className="max-w-4xl mx-auto space-y-6"><div><Link href="/admin/resources" className="text-sm text-[var(--color-ch-orange)] hover:underline">← Back to resources</Link><h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">Edit resource</h1><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Update content and publication status.</p></div><AdminResourceForm resource={data as Resource} /></div>
}

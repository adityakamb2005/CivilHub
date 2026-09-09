import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminOpportunityForm } from '@/components/admin/AdminOpportunityForm'
import type { Opportunity } from '@/types'

export const metadata = { title: 'Edit Opportunity | CivilHub' }

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage()
  const { id } = await params
  const { data, error } = await supabase.from('opportunities').select('*').eq('id', id).maybeSingle()
  if (error || !data) notFound()
  return <div className="max-w-4xl mx-auto space-y-6"><div><Link href="/admin/opportunities" className="text-sm text-[var(--color-ch-orange)] hover:underline">← Back to opportunities</Link><h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">Edit opportunity</h1><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Update details and publication status.</p></div><AdminOpportunityForm opportunity={data as Opportunity} /></div>
}

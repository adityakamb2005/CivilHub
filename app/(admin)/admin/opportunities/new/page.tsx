import Link from 'next/link'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminOpportunityForm } from '@/components/admin/AdminOpportunityForm'

export const metadata = { title: 'New Opportunity | CivilHub' }

export default async function NewOpportunityPage() {
  await requireAdminPage()
  return <div className="max-w-4xl mx-auto space-y-6"><div><Link href="/admin/opportunities" className="text-sm text-[var(--color-ch-orange)] hover:underline">← Back to opportunities</Link><h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">New opportunity</h1><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Add an opportunity to the CivilHub marketplace.</p></div><AdminOpportunityForm /></div>
}

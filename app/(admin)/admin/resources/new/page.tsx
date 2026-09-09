import Link from 'next/link'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminResourceForm } from '@/components/admin/AdminResourceForm'

export const metadata = { title: 'New Resource | CivilHub' }

export default async function NewResourcePage() {
  await requireAdminPage()
  return <div className="max-w-4xl mx-auto space-y-6"><div><Link href="/admin/resources" className="text-sm text-[var(--color-ch-orange)] hover:underline">← Back to resources</Link><h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mt-3">New resource</h1><p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">Add a resource to the CivilHub knowledge library.</p></div><AdminResourceForm /></div>
}

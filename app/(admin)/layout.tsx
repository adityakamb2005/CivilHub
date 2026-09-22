import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminHeaderActions } from './components/AdminHeader'
import { AdminNav } from './components/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdminPage()

  return (
    <div className="min-h-screen bg-[var(--color-ch-surface)] flex flex-col">
      <header className="bg-white border-b border-[var(--color-ch-border)] sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/admin/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-[var(--color-ch-red)] rounded-md flex items-center justify-center">
                <ShieldAlert size={16} className="text-white" />
              </div>
              <span className="font-bold tracking-tight text-[var(--color-ch-navy)] hidden sm:block">
                Civil<span className="text-[var(--color-ch-red)]">Hub</span> Admin
              </span>
            </Link>
            <div className="hidden md:block">
              <AdminNav />
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <span className="ch-badge bg-[var(--color-ch-red-light)] text-[var(--color-ch-red)] text-xs">Admin</span>
            <AdminHeaderActions />
          </div>
        </div>
        <div className="md:hidden border-t border-[var(--color-ch-border)] px-4 py-2 bg-white">
          <AdminNav />
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}

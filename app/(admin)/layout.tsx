'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HardHat, LogOut, ShieldAlert } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[var(--color-ch-surface)] flex flex-col">
      <header className="bg-white border-b border-[var(--color-ch-border)] sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--color-ch-red)] rounded-md flex items-center justify-center">
              <ShieldAlert size={16} className="text-white" />
            </div>
            <span className="font-bold tracking-tight text-[var(--color-ch-navy)] hidden sm:block">
              Civil<span className="text-[var(--color-ch-red)]">Hub</span> Admin
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="ch-badge bg-[var(--color-ch-red-light)] text-[var(--color-ch-red)] text-xs">Admin</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}

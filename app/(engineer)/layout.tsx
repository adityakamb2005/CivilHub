'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HardHat, LogOut } from 'lucide-react'

export default function EngineerLayout({
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
      {/* Top Navbar */}
      <header className="bg-white border-b border-[var(--color-ch-border)] sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/engineer/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--color-ch-navy)] rounded-md flex items-center justify-center">
              <HardHat size={16} className="text-[var(--color-ch-orange)]" />
            </div>
            <span className="font-bold tracking-tight text-[var(--color-ch-navy)] hidden sm:block">
              Civil<span className="text-[var(--color-ch-orange)]">Hub</span> Workspace
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="ch-badge ch-badge-orange text-xs">Engineer</span>
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

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}

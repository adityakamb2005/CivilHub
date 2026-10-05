'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  HardHat,
  LogOut,
  LayoutDashboard,
  User,
  FolderKanban,
  MessageSquare,
  Bell,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/engineer/dashboard', icon: LayoutDashboard },
  { label: 'Profile', href: '/engineer/profile', icon: User },
  { label: 'Projects', href: '/engineer/projects', icon: FolderKanban },
  { label: 'Messages', href: '/engineer/messages', icon: MessageSquare },
  { label: 'Notifications', href: '/engineer/notifications', icon: Bell },
]

export default function EngineerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--color-ch-orange-light)] text-[var(--color-ch-orange)]'
                      : 'text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] hover:bg-[var(--color-ch-surface)]'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
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

        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--color-ch-orange-light)] text-[var(--color-ch-orange)]'
                    : 'text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] hover:bg-[var(--color-ch-surface)]'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}

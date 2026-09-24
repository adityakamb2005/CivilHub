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
  Users,
  Briefcase,
  BookOpen,
  MessageSquare,
  Bell,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { label: 'Profile', href: '/client/profile', icon: User },
  { label: 'My Projects', href: '/client/projects', icon: FolderKanban },
  { label: 'Messages', href: '/client/messages', icon: MessageSquare },
  { label: 'Notifications', href: '/client/notifications', icon: Bell },
]

const EXPLORE_ITEMS = [
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Engineers', href: '/engineers', icon: Users },
  { label: 'Opportunities', href: '/opportunities', icon: Briefcase },
  { label: 'Resources', href: '/resources', icon: BookOpen },
]

export default function ClientLayout({
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
      <header className="bg-white border-b border-[var(--color-ch-border)] sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/client/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--color-ch-navy)] rounded-md flex items-center justify-center">
              <HardHat size={16} className="text-[var(--color-ch-orange)]" />
            </div>
            <span className="font-bold tracking-tight text-[var(--color-ch-navy)] hidden sm:block">
              Civil<span className="text-[var(--color-ch-orange)]">Hub</span> Client
            </span>
          </Link>

          {/* Desktop nav */}
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
            <span className="ch-badge ch-badge-navy text-xs">Client</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
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

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}

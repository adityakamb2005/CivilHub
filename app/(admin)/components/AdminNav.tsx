'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Briefcase, FolderKanban, FileText } from 'lucide-react'

const ADMIN_LINKS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Resources', href: '/admin/resources', icon: BookOpen },
  { label: 'Opportunities', href: '/admin/opportunities', icon: Briefcase },
  { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { label: 'Applications', href: '/admin/applications', icon: FileText },
]

export function AdminNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))

  return (
    <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none" aria-label="Admin Navigation">
      {ADMIN_LINKS.map(({ label, href, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              active
                ? 'bg-[var(--color-ch-navy)] text-white'
                : 'text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] hover:bg-[var(--color-ch-surface)]'
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

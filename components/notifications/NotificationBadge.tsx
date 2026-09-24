'use client'

import Link from 'next/link'
import { Bell, MessageSquare } from 'lucide-react'

export function NavBadgeIcon({
  href,
  count,
  type,
}: {
  href: string
  count: number
  type: 'notifications' | 'messages'
}) {
  const Icon = type === 'notifications' ? Bell : MessageSquare
  const label = type === 'notifications' ? 'Notifications' : 'Messages'

  return (
    <Link
      href={href}
      className="relative p-2 rounded-lg text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] hover:bg-[var(--color-ch-surface)] transition-colors inline-flex items-center gap-1.5 text-sm font-medium"
      title={label}
    >
      <Icon size={18} />
      <span className="hidden lg:inline">{label}</span>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-ch-orange)] text-white text-[10px] font-bold flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

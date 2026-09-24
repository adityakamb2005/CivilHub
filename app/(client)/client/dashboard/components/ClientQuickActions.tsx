'use client'

import { Settings, Plus, Users, MessageSquare, Bell } from 'lucide-react'
import Link from 'next/link'

export function ClientQuickActions() {
  return (
    <div className="ch-card p-6 animate-fade-in">
      <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/client/projects/new"
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] hover:border-[var(--color-ch-orange)] hover:bg-white transition-all text-center gap-2 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[var(--color-ch-border)] group-hover:border-[var(--color-ch-orange)]/30 group-hover:bg-[var(--color-ch-orange-light)] shadow-xs transition-colors">
            <Plus size={18} className="text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)] transition-colors" />
          </div>
          <div>
            <div className="font-semibold text-[var(--color-ch-navy)] text-xs">New Project</div>
            <div className="text-[11px] text-[var(--color-ch-text-secondary)]">Post project</div>
          </div>
        </Link>

        <Link
          href="/client/messages"
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] hover:border-[var(--color-ch-orange)] hover:bg-white transition-all text-center gap-2 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[var(--color-ch-border)] group-hover:border-[var(--color-ch-orange)]/30 group-hover:bg-[var(--color-ch-orange-light)] shadow-xs transition-colors">
            <MessageSquare size={18} className="text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)] transition-colors" />
          </div>
          <div>
            <div className="font-semibold text-[var(--color-ch-navy)] text-xs">Messages</div>
            <div className="text-[11px] text-[var(--color-ch-text-secondary)]">Client inbox</div>
          </div>
        </Link>

        <Link
          href="/client/notifications"
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] hover:border-[var(--color-ch-orange)] hover:bg-white transition-all text-center gap-2 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[var(--color-ch-border)] group-hover:border-[var(--color-ch-orange)]/30 group-hover:bg-[var(--color-ch-orange-light)] shadow-xs transition-colors">
            <Bell size={18} className="text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)] transition-colors" />
          </div>
          <div>
            <div className="font-semibold text-[var(--color-ch-navy)] text-xs">Notifications</div>
            <div className="text-[11px] text-[var(--color-ch-text-secondary)]">In-app alerts</div>
          </div>
        </Link>

        <Link
          href="/engineers"
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] hover:border-[var(--color-ch-navy)] hover:bg-white transition-all text-center gap-2 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[var(--color-ch-border)] group-hover:border-[var(--color-ch-navy)]/30 group-hover:bg-slate-100 shadow-xs transition-colors">
            <Users size={18} className="text-[var(--color-ch-navy)] transition-colors" />
          </div>
          <div>
            <div className="font-semibold text-[var(--color-ch-navy)] text-xs">Find Engineers</div>
            <div className="text-[11px] text-[var(--color-ch-text-secondary)]">Directory</div>
          </div>
        </Link>
      </div>
    </div>
  )
}

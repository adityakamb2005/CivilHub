'use client'

import { Briefcase, Settings, User } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  return (
    <div className="ch-card p-6 animate-fade-in">
      <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link 
          href="/engineer/profile" 
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] hover:border-[var(--color-ch-orange)] hover:bg-white transition-all text-center gap-2 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[var(--color-ch-border)] group-hover:border-[var(--color-ch-orange)]/30 group-hover:bg-[var(--color-ch-orange-light)] shadow-xs transition-colors">
            <Settings size={18} className="text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)] transition-colors" />
          </div>
          <div>
            <div className="font-semibold text-[var(--color-ch-navy)] text-sm">Edit Profile</div>
            <div className="text-xs text-[var(--color-ch-text-secondary)]">Update details</div>
          </div>
        </Link>

        <Link 
          href="/engineer/dashboard" 
          onClick={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] hover:border-[var(--color-ch-navy)]/30 hover:bg-white transition-all text-center gap-2 group cursor-not-allowed opacity-70"
          aria-disabled="true"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[var(--color-ch-border)] group-hover:border-[var(--color-ch-navy)]/20 shadow-sm">
            <User size={18} className="text-[var(--color-ch-text-secondary)]" />
          </div>
          <div>
            <div className="font-medium text-[var(--color-ch-text-primary)] text-sm">View Public Profile</div>
            <div className="text-xs text-[var(--color-ch-text-muted)]">Coming Soon</div>
          </div>
        </Link>

        <Link 
          href="/engineer/dashboard" 
          onClick={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[var(--color-ch-border)] bg-[var(--color-ch-surface)] hover:border-[var(--color-ch-navy)]/30 hover:bg-white transition-all text-center gap-2 group cursor-not-allowed opacity-70"
          aria-disabled="true"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[var(--color-ch-border)] group-hover:border-[var(--color-ch-navy)]/20 shadow-sm">
            <Briefcase size={18} className="text-[var(--color-ch-text-secondary)]" />
          </div>
          <div>
            <div className="font-medium text-[var(--color-ch-text-primary)] text-sm">Portfolio</div>
            <div className="text-xs text-[var(--color-ch-text-muted)]">Coming Soon</div>
          </div>
        </Link>
      </div>
    </div>
  )
}

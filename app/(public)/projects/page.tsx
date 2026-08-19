import type { Metadata } from 'next'
import Link from 'next/link'
import { FolderKanban } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Browse civil engineering and construction projects on CivilHub.',
}

export default function ProjectsPage() {
  return (
    <div className="ch-section">
      <div className="ch-container">
        <div className="mb-10">
          <span className="ch-section-label mb-3 block">Portfolio Projects</span>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
            Civil Engineering Projects
          </h1>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl">
            Explore completed and ongoing civil engineering projects from engineers on the platform.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-[var(--color-ch-surface)] rounded-2xl border border-[var(--color-ch-border)] flex items-center justify-center mb-6">
            <FolderKanban size={36} className="text-[var(--color-ch-text-muted)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-ch-navy)] mb-2">
            Projects Directory Coming Soon
          </h2>
          <p className="text-[var(--color-ch-text-secondary)] max-w-md mb-8">
            Portfolio projects will be visible here once engineers register and add their completed work to the platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/register?role=engineer" className="ch-btn ch-btn-primary">
              Join as Engineer
            </Link>
            <Link href="/engineers" className="ch-btn ch-btn-outline">
              Find an Engineer
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

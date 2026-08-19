import type { Metadata } from 'next'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Opportunities',
  description:
    'Browse civil engineering job listings, tenders, and career opportunities on CivilHub.',
}

export default function OpportunitiesPage() {
  return (
    <div className="ch-section">
      <div className="ch-container">
        <div className="mb-10">
          <span className="ch-section-label mb-3 block">Opportunities</span>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
            Civil Engineering Opportunities
          </h1>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl">
            Job listings, project tenders, and career opportunities across the civil engineering industry.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-[var(--color-ch-surface)] rounded-2xl border border-[var(--color-ch-border)] flex items-center justify-center mb-6">
            <Briefcase size={36} className="text-[var(--color-ch-text-muted)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-ch-navy)] mb-2">
            Opportunities Coming Soon
          </h2>
          <p className="text-[var(--color-ch-text-secondary)] max-w-md mb-8">
            We&apos;re building the opportunities board. Job listings, project tenders, and engineering career opportunities will be available here soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/register?role=engineer" className="ch-btn ch-btn-primary">
              Join as Engineer
            </Link>
            <Link href="/" className="ch-btn ch-btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

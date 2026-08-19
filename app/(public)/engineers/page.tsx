import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, SlidersHorizontal, HardHat } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Civil Engineers',
  description:
    'Browse and connect with verified civil engineers. Filter by specialization, location, experience, and ratings.',
}

export default function EngineersPage() {
  return (
    <div className="ch-section">
      <div className="ch-container">
        {/* Page header */}
        <div className="mb-10">
          <span className="ch-section-label mb-3 block">Engineer Directory</span>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
            Find a Civil Engineer
          </h1>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl">
            Browse verified civil engineers across India. Filter by specialization, location, experience level, and client ratings.
          </p>
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ch-text-muted)]"
            />
            <input
              type="search"
              placeholder="Search by name, specialization, or location…"
              className="ch-input pl-9"
              aria-label="Search engineers"
            />
          </div>
          <button className="ch-btn ch-btn-outline gap-2" aria-label="Open filters">
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {/* Coming soon state */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-[var(--color-ch-surface)] rounded-2xl border border-[var(--color-ch-border)] flex items-center justify-center mb-6">
            <HardHat size={36} className="text-[var(--color-ch-text-muted)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-ch-navy)] mb-2">
            Engineer Directory Coming Soon
          </h2>
          <p className="text-[var(--color-ch-text-secondary)] max-w-md mb-8">
            We&apos;re building out the full engineer directory with search, filters, and engineer profiles. In the meantime, engineers can register and create their profiles.
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

import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Civil engineering articles, formulas, tutorials, career guidance, and construction knowledge on CivilHub.',
}

export default function ResourcesPage() {
  return (
    <div className="ch-section">
      <div className="ch-container">
        <div className="mb-10">
          <span className="ch-section-label mb-3 block">Resources</span>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
            Engineering Knowledge Hub
          </h1>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl">
            Articles, formulas, tutorials, career resources, and engineering references — curated for civil engineering professionals.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg mb-10">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ch-text-muted)]" />
          <input
            type="search"
            placeholder="Search resources…"
            className="ch-input pl-9"
            aria-label="Search resources"
          />
        </div>

        {/* Coming soon */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-[var(--color-ch-surface)] rounded-2xl border border-[var(--color-ch-border)] flex items-center justify-center mb-6">
            <BookOpen size={36} className="text-[var(--color-ch-text-muted)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-ch-navy)] mb-2">
            Resources Library Coming Soon
          </h2>
          <p className="text-[var(--color-ch-text-secondary)] max-w-md mb-8">
            We&apos;re building a comprehensive library of civil engineering resources. Check back soon for articles, formulas, and tutorials.
          </p>
          <Link href="/" className="ch-btn ch-btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

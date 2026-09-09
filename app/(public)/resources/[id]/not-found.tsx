import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function ResourceNotFound() {
  return (
    <div className="ch-section">
      <div className="ch-container max-w-2xl">
        <div className="ch-card p-10 sm:p-14 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] flex items-center justify-center mb-5">
            <BookOpen size={32} className="text-[var(--color-ch-text-muted)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-2">
            Resource not found
          </h1>
          <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-md mb-6">
            This resource may have been removed, unpublished, or the link may be incorrect.
          </p>
          <Link href="/resources" className="ch-btn ch-btn-primary">
            <ArrowLeft size={16} />
            Back to Resources
          </Link>
        </div>
      </div>
    </div>
  )
}

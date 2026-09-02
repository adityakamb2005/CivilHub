import Link from 'next/link'
import { EyeOff, ArrowLeft, Search } from 'lucide-react'

export default function EngineerNotFound() {
  return (
    <div className="ch-section">
      <div className="ch-container max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-[var(--color-ch-surface)] rounded-2xl border border-[var(--color-ch-border)] flex items-center justify-center mx-auto mb-6">
          <EyeOff size={32} className="text-[var(--color-ch-text-muted)]" />
        </div>
        
        <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] mb-3">
          Profile Unavailable
        </h1>
        
        <p className="text-[var(--color-ch-text-secondary)] mb-8">
          This profile may be set to private by the engineer or does not exist on CivilHub.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/engineers" className="ch-btn ch-btn-primary w-full sm:w-auto">
            <Search size={16} />
            Browse Engineer Directory
          </Link>
          <Link href="/" className="ch-btn ch-btn-outline w-full sm:w-auto">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

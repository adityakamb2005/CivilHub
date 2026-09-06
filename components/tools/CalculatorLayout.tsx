import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

interface CalculatorLayoutProps {
  title: string
  description: string
  children: React.ReactNode
}

export default function CalculatorLayout({
  title,
  description,
  children,
}: CalculatorLayoutProps) {
  return (
    <div className="ch-section">
      <div className="ch-container">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Engineering Tools
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <span className="ch-section-label mb-2 block">Civil Engineering Tool</span>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
            {title}
          </h1>
          <p className="text-[var(--color-ch-text-secondary)] max-w-2xl text-base leading-relaxed">
            {description}
          </p>
        </div>

        {/* Prominent Non-dismissable Engineering Disclaimer */}
        <div className="mb-8 p-4 rounded-xl bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] flex items-start gap-3.5">
          <AlertTriangle size={20} className="text-[var(--color-ch-orange)] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[var(--color-ch-text-secondary)] leading-relaxed">
            <strong className="font-semibold text-[var(--color-ch-navy)]">Engineering Disclaimer:</strong>{' '}
            This tool provides preliminary estimations for field and planning reference only. All calculations use simplified geometric and nominal formulas and must be independently verified by a qualified professional engineer before being used in actual construction or structural design.
          </div>
        </div>

        {/* Calculator Body */}
        {children}
      </div>
    </div>
  )
}

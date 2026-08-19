import Link from 'next/link'
import { ArrowLeft, Calculator } from 'lucide-react'
import { notFound } from 'next/navigation'

// Map slugs to display names
const TOOLS_MAP: Record<string, string> = {
  'area-calculator': 'Area Calculator',
  'volume-calculator': 'Volume Calculator',
  'concrete-calculator': 'Concrete Calculator',
  'cement-calculator': 'Cement Calculator',
  'sand-calculator': 'Sand Calculator',
  'brick-calculator': 'Brick/Block Calculator',
  'steel-calculator': 'Steel Calculator',
  'unit-converter': 'Unit Converter',
  'cost-estimator': 'Cost Estimator',
}

interface PageProps {
  params: Promise<{ toolSlug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { toolSlug } = await params
  const toolName = TOOLS_MAP[toolSlug] || 'Engineering Tool'
  return {
    title: `${toolName} - Coming Soon`,
  }
}

export async function generateStaticParams() {
  return Object.keys(TOOLS_MAP).map((slug) => ({
    toolSlug: slug,
  }))
}

export default async function ToolPage({ params }: PageProps) {
  const { toolSlug } = await params
  const toolName = TOOLS_MAP[toolSlug]

  if (!toolName) {
    notFound()
  }

  return (
    <div className="ch-section">
      <div className="ch-container">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Tools
          </Link>
        </div>

        {/* Coming Soon Card */}
        <div className="max-w-2xl mx-auto ch-card p-10 sm:p-14 text-center">
          <div className="w-20 h-20 bg-[var(--color-ch-surface)] rounded-2xl border border-[var(--color-ch-border)] flex items-center justify-center mx-auto mb-6">
            <Calculator size={36} className="text-[var(--color-ch-text-muted)]" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-ch-navy)] mb-4">
            {toolName}
          </h1>
          
          <div className="inline-block px-3 py-1 rounded-full bg-[var(--color-ch-orange-light)] text-[var(--color-ch-orange)] text-xs font-semibold uppercase tracking-wider mb-6">
            Coming Soon
          </div>
          
          <p className="text-[var(--color-ch-text-secondary)] leading-relaxed mb-8 max-w-lg mx-auto">
            We are currently building this calculator for the CivilHub Tools module. 
            Once completed, it will provide professional-grade estimates and computations tailored for field engineers.
          </p>
          
          <Link href="/tools" className="ch-btn ch-btn-primary px-8">
            Browse Available Tools
          </Link>
        </div>
      </div>
    </div>
  )
}

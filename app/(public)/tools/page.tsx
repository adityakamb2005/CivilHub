import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, Square, Box, RefreshCw, Layers, Package, Ruler, DollarSign } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Engineering Tools & Calculators',
  description:
    'Free civil engineering calculators — concrete, brick, steel, cement, area, volume, unit converter, and construction cost estimator.',
}

const TOOLS = [
  { icon: Square, name: 'Area Calculator', href: '/tools/area-calculator', desc: 'Calculate floor, land, and surface areas.' },
  { icon: Box, name: 'Volume Calculator', href: '/tools/volume-calculator', desc: 'Compute volumes for concrete and earthwork.' },
  { icon: RefreshCw, name: 'Unit Converter', href: '/tools/unit-converter', desc: 'Convert between metric and imperial units.' },
  { icon: Calculator, name: 'Concrete Calculator', href: '/tools/concrete-calculator', desc: 'Estimate concrete for slabs, beams, columns.' },
  { icon: Package, name: 'Cement Calculator', href: '/tools/cement-calculator', desc: 'Calculate cement bags for concrete mixes.' },
  { icon: Package, name: 'Sand Calculator', href: '/tools/sand-calculator', desc: 'Estimate sand quantities for mortar and concrete.' },
  { icon: Layers, name: 'Brick/Block Calculator', href: '/tools/brick-calculator', desc: 'Bricks or blocks needed for walls.' },
  { icon: Ruler, name: 'Steel Calculator', href: '/tools/steel-calculator', desc: 'Reinforcement weight and bar quantities.' },
  { icon: DollarSign, name: 'Cost Estimator', href: '/tools/cost-estimator', desc: 'Rough construction cost estimates.' },
]

export default function ToolsPage() {
  return (
    <div className="ch-section">
      <div className="ch-container">
        <div className="mb-10">
          <span className="ch-section-label mb-3 block">Engineering Tools</span>
          <h1 className="ch-text-page-heading text-[var(--color-ch-navy)] mb-3">
            Civil Engineering Calculators
          </h1>
          <p className="text-[var(--color-ch-text-secondary)] max-w-xl">
            Practical, field-ready calculators built for civil engineers and construction professionals. Results include assumptions and disclaimers where professional judgment is required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.name}
                href={tool.href}
                className="ch-card p-6 hover:shadow-[0_4px_16px_0_rgb(15_28_46/0.10)] transition-all duration-200 hover:-translate-y-0.5 flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-ch-orange-light)] group-hover:border-[var(--color-ch-orange)]/20 transition-colors duration-200">
                  <Icon size={22} className="text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)] transition-colors duration-200" />
                </div>
                <div>
                  <h2 className="font-semibold text-[var(--color-ch-navy)] mb-1">
                    {tool.name}
                  </h2>
                  <p className="text-sm text-[var(--color-ch-text-secondary)]">{tool.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>

        <p className="mt-8 text-xs text-[var(--color-ch-text-muted)] max-w-2xl">
          <strong>Disclaimer:</strong> All calculators provide estimates only. Results should be reviewed by a qualified civil engineer before use in actual construction. CivilHub accepts no liability for decisions made based on calculator outputs.
        </p>
      </div>
    </div>
  )
}

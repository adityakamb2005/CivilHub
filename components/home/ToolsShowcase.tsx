import Link from 'next/link'
import {
  Calculator,
  Ruler,
  Layers,
  Package,
  DollarSign,
  ArrowRight,
  Square,
  Box,
  RefreshCw,
} from 'lucide-react'

const TOOLS = [
  {
    icon: Square,
    name: 'Area Calculator',
    description: 'Calculate floor, land, wall, and surface areas in multiple units.',
    href: '/tools/area-calculator',
    color: 'text-[var(--color-ch-navy)]',
    bg: 'bg-[var(--color-ch-surface)]',
  },
  {
    icon: Box,
    name: 'Volume Calculator',
    description: 'Compute volumes for concrete pours, excavation, and earthwork.',
    href: '/tools/volume-calculator',
    color: 'text-[var(--color-ch-orange)]',
    bg: 'bg-[var(--color-ch-orange-light)]',
  },
  {
    icon: RefreshCw,
    name: 'Unit Converter',
    description: 'Convert between metric and imperial units for length, area, and mass.',
    href: '/tools/unit-converter',
    color: 'text-[var(--color-ch-navy)]',
    bg: 'bg-[var(--color-ch-surface)]',
  },
  {
    icon: Calculator,
    name: 'Concrete Calculator',
    description: 'Estimate concrete quantities for slabs, beams, columns, and footings.',
    href: '/tools/concrete-calculator',
    color: 'text-[var(--color-ch-green)]',
    bg: 'bg-[var(--color-ch-green-light)]',
  },
  {
    icon: Layers,
    name: 'Brick/Block Calculator',
    description: 'Calculate bricks or blocks needed for walls with mortar allowance.',
    href: '/tools/brick-calculator',
    color: 'text-[var(--color-ch-navy)]',
    bg: 'bg-[var(--color-ch-surface)]',
  },
  {
    icon: Ruler,
    name: 'Steel Calculator',
    description: 'Estimate steel reinforcement weight and quantities for RCC work.',
    href: '/tools/steel-calculator',
    color: 'text-[var(--color-ch-orange)]',
    bg: 'bg-[var(--color-ch-orange-light)]',
  },
  {
    icon: Package,
    name: 'Cement Calculator',
    description: 'Calculate cement bags needed for different grades of concrete.',
    href: '/tools/cement-calculator',
    color: 'text-[var(--color-ch-navy)]',
    bg: 'bg-[var(--color-ch-surface)]',
  },
  {
    icon: DollarSign,
    name: 'Cost Estimator',
    description: 'Get a rough construction cost estimate based on area and finish quality.',
    href: '/tools/cost-estimator',
    color: 'text-[var(--color-ch-green)]',
    bg: 'bg-[var(--color-ch-green-light)]',
  },
]

export function ToolsShowcase() {
  return (
    <section className="ch-section bg-white" aria-labelledby="tools-heading">
      <div className="ch-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="ch-section-label mb-3 block">Engineering Tools</span>
            <h2
              id="tools-heading"
              className="ch-text-section-heading text-[var(--color-ch-navy)]"
            >
              Practical Calculators for the Field
            </h2>
          </div>
          <Link
            href="/tools"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-ch-orange)] hover:underline whitespace-nowrap"
          >
            All tools
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.name}
                href={tool.href}
                className="ch-card p-5 hover:shadow-[0_4px_16px_0_rgb(15_28_46/0.10)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-3 group"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${tool.bg} border border-[var(--color-ch-border)] flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon size={18} className={tool.color} />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-ch-navy)] text-sm mb-1">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-[var(--color-ch-text-secondary)] leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-xs font-medium text-[var(--color-ch-orange)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool
                  <ArrowRight size={12} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

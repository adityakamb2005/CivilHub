import Link from 'next/link'
import { Calculator } from 'lucide-react'
import { notFound } from 'next/navigation'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import AreaCalculator from '@/components/tools/AreaCalculator'
import VolumeCalculator from '@/components/tools/VolumeCalculator'
import ConcreteCalculator from '@/components/tools/ConcreteCalculator'
import CementCalculator from '@/components/tools/CementCalculator'
import SandCalculator from '@/components/tools/SandCalculator'
import SteelCalculator from '@/components/tools/SteelCalculator'
import UnitConverter from '@/components/tools/UnitConverter'

// Map slugs to display names and descriptions
const TOOLS_MAP: Record<string, { name: string; desc: string }> = {
  'area-calculator': {
    name: 'Area Calculator',
    desc: 'Calculate floor, land, and surface areas for rectangles, circles, triangles, and trapezoids in metric and imperial units.',
  },
  'volume-calculator': {
    name: 'Volume Calculator',
    desc: 'Compute 3D volumes for concrete slabs, footings, cylinders, cones, and earthwork excavations.',
  },
  'concrete-calculator': {
    name: 'Concrete Calculator',
    desc: 'Estimate wet concrete volume, dry materials, cement bags, sand, and aggregates for slabs, beams, and columns.',
  },
  'cement-calculator': {
    name: 'Cement Calculator',
    desc: 'Calculate total cement bags, weight, and volume required for given concrete mixes.',
  },
  'sand-calculator': {
    name: 'Sand Calculator',
    desc: 'Estimate required sand quantity and weight for concrete mixes and wall plastering.',
  },
  'steel-calculator': {
    name: 'Steel Calculator',
    desc: 'Estimate rebar weight and total bar lengths by count or slab spacing.',
  },
  'unit-converter': {
    name: 'Unit Converter',
    desc: 'Convert between metric and imperial engineering units for length, area, volume, mass, pressure, and force.',
  },
  'brick-calculator': {
    name: 'Brick/Block Calculator',
    desc: 'Compute bricks or hollow blocks needed for walls, factoring mortar joints and openings.',
  },
  'cost-estimator': {
    name: 'Cost Estimator',
    desc: 'Estimate building construction costs based on quality tiers and location classifications.',
  },
}

interface PageProps {
  params: Promise<{ toolSlug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { toolSlug } = await params
  const toolInfo = TOOLS_MAP[toolSlug]

  if (!toolInfo) {
    return { title: 'Tool Not Found - CivilHub' }
  }

  // Active implemented tool metadata
  const ACTIVE_SLUGS = [
    'area-calculator',
    'volume-calculator',
    'concrete-calculator',
    'cement-calculator',
    'sand-calculator',
    'steel-calculator',
    'unit-converter',
  ]

  if (ACTIVE_SLUGS.includes(toolSlug)) {
    return {
      title: `${toolInfo.name} - Free Civil Engineering Tools | CivilHub`,
      description: toolInfo.desc,
    }
  }

  return {
    title: `${toolInfo.name} - Coming Soon`,
  }
}

export async function generateStaticParams() {
  return Object.keys(TOOLS_MAP).map((slug) => ({
    toolSlug: slug,
  }))
}

export default async function ToolPage({ params }: PageProps) {
  const { toolSlug } = await params
  const toolInfo = TOOLS_MAP[toolSlug]

  if (!toolInfo) {
    notFound()
  }

  // Render active tools
  switch (toolSlug) {
    case 'area-calculator':
      return (
        <CalculatorLayout title={toolInfo.name} description={toolInfo.desc}>
          <AreaCalculator />
        </CalculatorLayout>
      )
    case 'volume-calculator':
      return (
        <CalculatorLayout title={toolInfo.name} description={toolInfo.desc}>
          <VolumeCalculator />
        </CalculatorLayout>
      )
    case 'concrete-calculator':
      return (
        <CalculatorLayout title={toolInfo.name} description={toolInfo.desc}>
          <ConcreteCalculator />
        </CalculatorLayout>
      )
    case 'cement-calculator':
      return (
        <CalculatorLayout title={toolInfo.name} description={toolInfo.desc}>
          <CementCalculator />
        </CalculatorLayout>
      )
    case 'sand-calculator':
      return (
        <CalculatorLayout title={toolInfo.name} description={toolInfo.desc}>
          <SandCalculator />
        </CalculatorLayout>
      )
    case 'steel-calculator':
      return (
        <CalculatorLayout title={toolInfo.name} description={toolInfo.desc}>
          <SteelCalculator />
        </CalculatorLayout>
      )
    case 'unit-converter':
      return (
        <CalculatorLayout title={toolInfo.name} description={toolInfo.desc}>
          <UnitConverter />
        </CalculatorLayout>
      )
  }

  // Render Coming Soon stub card for Brick Calculator & Cost Estimator
  return (
    <CalculatorLayout title={toolInfo.name} description={toolInfo.desc}>
      <div className="max-w-2xl mx-auto ch-card p-10 sm:p-14 text-center">
        <div className="w-20 h-20 bg-[var(--color-ch-surface)] rounded-2xl border border-[var(--color-ch-border)] flex items-center justify-center mx-auto mb-6">
          <Calculator size={36} className="text-[var(--color-ch-text-muted)]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-ch-navy)] mb-4">
          {toolInfo.name}
        </h2>

        <div className="inline-block px-3 py-1 rounded-full bg-[var(--color-ch-orange-light)] text-[var(--color-ch-orange)] text-xs font-semibold uppercase tracking-wider mb-6">
          Coming Soon
        </div>

        <p className="text-[var(--color-ch-text-secondary)] leading-relaxed mb-8 max-w-lg mx-auto">
          We are currently building this calculator for the CivilHub Tools module. Once completed, it will provide professional-grade estimates and computations tailored for field engineers.
        </p>

        <Link href="/tools" className="ch-btn ch-btn-primary px-8">
          Browse Available Tools
        </Link>
      </div>
    </CalculatorLayout>
  )
}

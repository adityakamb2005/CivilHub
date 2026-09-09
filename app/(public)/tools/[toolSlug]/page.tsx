import { notFound } from 'next/navigation'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import AreaCalculator from '@/components/tools/AreaCalculator'
import VolumeCalculator from '@/components/tools/VolumeCalculator'
import ConcreteCalculator from '@/components/tools/ConcreteCalculator'
import CementCalculator from '@/components/tools/CementCalculator'
import SandCalculator from '@/components/tools/SandCalculator'
import SteelCalculator from '@/components/tools/SteelCalculator'
import UnitConverter from '@/components/tools/UnitConverter'
import CostEstimator from '@/components/tools/CostEstimator'
import BrickCalculator from '@/components/tools/BrickCalculator'

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

  return {
    title: `${toolInfo.name} - Free Civil Engineering Tools | CivilHub`,
    description: toolInfo.desc,
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
    case 'brick-calculator':
      return (
        <CalculatorLayout title={toolInfo.name} description={toolInfo.desc}>
          <BrickCalculator />
        </CalculatorLayout>
      )
    case 'cost-estimator':
      return (
        <CalculatorLayout title={toolInfo.name} description={toolInfo.desc}>
          <CostEstimator />
        </CalculatorLayout>
      )
  }

  notFound()
}

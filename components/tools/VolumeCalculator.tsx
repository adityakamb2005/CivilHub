'use client'

import { useState } from 'react'
import {
  calcVolRectangularPrism,
  calcVolCylinder,
  calcVolCone,
  calcVolTrapezoidalPrism,
  VolumeShape,
  LengthUnit,
  VolumeResult,
} from '@/lib/calculators/volume'
import { CalculatorValidationError } from '@/lib/calculators/validation'
import { Box, Cylinder, Disc, Layers, RotateCcw, Calculator, CheckCircle2, AlertCircle } from 'lucide-react'

const SHAPES: { id: VolumeShape; label: string; icon: typeof Box }[] = [
  { id: 'rectangular-prism', label: 'Rectangular Prism', icon: Box },
  { id: 'cylinder', label: 'Cylinder', icon: Cylinder },
  { id: 'cone', label: 'Cone', icon: Disc },
  { id: 'trapezoidal-prism', label: 'Trapezoidal Prism', icon: Layers },
]

export default function VolumeCalculator() {
  const [shape, setShape] = useState<VolumeShape>('rectangular-prism')
  const [unit, setUnit] = useState<LengthUnit>('metres')

  // Rectangular Prism inputs
  const [length, setLength] = useState<string>('10')
  const [width, setWidth] = useState<string>('5')
  const [depth, setDepth] = useState<string>('2')

  // Cylinder inputs
  const [cylinderDiameter, setCylinderDiameter] = useState<string>('4')
  const [cylinderHeight, setCylinderHeight] = useState<string>('6')

  // Cone inputs
  const [coneDiameter, setConeDiameter] = useState<string>('4')
  const [coneHeight, setConeHeight] = useState<string>('6')

  // Trapezoidal Prism inputs
  const [bottomWidth, setBottomWidth] = useState<string>('6')
  const [topWidth, setTopWidth] = useState<string>('4')
  const [trapHeight, setTrapHeight] = useState<string>('3')
  const [trapLength, setTrapLength] = useState<string>('10')

  // Result & Error state
  const [result, setResult] = useState<VolumeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unitLabel = unit === 'metres' ? 'm' : 'ft'

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    try {
      let res: VolumeResult

      switch (shape) {
        case 'rectangular-prism':
          res = calcVolRectangularPrism(
            parseFloat(length),
            parseFloat(width),
            parseFloat(depth),
            unit
          )
          break
        case 'cylinder':
          res = calcVolCylinder(
            parseFloat(cylinderDiameter),
            parseFloat(cylinderHeight),
            unit
          )
          break
        case 'cone':
          res = calcVolCone(
            parseFloat(coneDiameter),
            parseFloat(coneHeight),
            unit
          )
          break
        case 'trapezoidal-prism':
          res = calcVolTrapezoidalPrism(
            parseFloat(bottomWidth),
            parseFloat(topWidth),
            parseFloat(trapHeight),
            parseFloat(trapLength),
            unit
          )
          break
      }

      setResult(res)
    } catch (err: unknown) {
      setResult(null)
      if (err instanceof CalculatorValidationError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred during volume calculation.')
      }
    }
  }

  const handleReset = () => {
    setLength('')
    setWidth('')
    setDepth('')
    setCylinderDiameter('')
    setCylinderHeight('')
    setConeDiameter('')
    setConeHeight('')
    setBottomWidth('')
    setTopWidth('')
    setTrapHeight('')
    setTrapLength('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls & Form Section */}
      <div className="lg:col-span-7 space-y-6">
        {/* Shape Mode Selection */}
        <div className="ch-card p-6 space-y-4">
          <label className="block text-sm font-semibold text-[var(--color-ch-navy)] mb-2">
            1. Select 3D Solid / Geometry
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SHAPES.map((s) => {
              const Icon = s.icon
              const isSelected = shape === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setShape(s.id)
                    setResult(null)
                    setError(null)
                  }}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-ch-navy)] text-white border-[var(--color-ch-navy)] shadow-sm'
                      : 'bg-white text-[var(--color-ch-text-secondary)] border-[var(--color-ch-border)] hover:bg-[var(--color-ch-surface)]'
                  }`}
                >
                  <Icon size={20} className="mb-1.5" />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleCalculate} className="ch-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--color-ch-border)] pb-4">
            <h2 className="text-base font-semibold text-[var(--color-ch-navy)] capitalize">
              2. Input Dimensions ({shape.replace('-', ' ')})
            </h2>
            {/* Unit Toggle */}
            <div className="inline-flex rounded-lg border border-[var(--color-ch-border)] p-0.5 bg-[var(--color-ch-surface)]">
              <button
                type="button"
                onClick={() => {
                  setUnit('metres')
                  setResult(null)
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  unit === 'metres'
                    ? 'bg-white text-[var(--color-ch-navy)] shadow-xs font-semibold'
                    : 'text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)]'
                }`}
              >
                Metres (m)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUnit('feet')
                  setResult(null)
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  unit === 'feet'
                    ? 'bg-white text-[var(--color-ch-navy)] shadow-xs font-semibold'
                    : 'text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)]'
                }`}
              >
                Feet (ft)
              </button>
            </div>
          </div>

          {/* Validation Error Alert */}
          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-red-200 flex items-start gap-3 text-sm text-[var(--color-ch-red)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Rectangular Prism Inputs */}
          {shape === 'rectangular-prism' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Length ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="e.g. 10"
                  className="ch-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Width ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="e.g. 5"
                  className="ch-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Depth / Height ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  placeholder="e.g. 2"
                  className="ch-input"
                  required
                />
              </div>
            </div>
          )}

          {/* Cylinder Inputs */}
          {shape === 'cylinder' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Diameter ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={cylinderDiameter}
                  onChange={(e) => setCylinderDiameter(e.target.value)}
                  placeholder="e.g. 4"
                  className="ch-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Height / Length ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={cylinderHeight}
                  onChange={(e) => setCylinderHeight(e.target.value)}
                  placeholder="e.g. 6"
                  className="ch-input"
                  required
                />
              </div>
            </div>
          )}

          {/* Cone Inputs */}
          {shape === 'cone' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Base Diameter ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={coneDiameter}
                  onChange={(e) => setConeDiameter(e.target.value)}
                  placeholder="e.g. 4"
                  className="ch-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Height ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={coneHeight}
                  onChange={(e) => setConeHeight(e.target.value)}
                  placeholder="e.g. 6"
                  className="ch-input"
                  required
                />
              </div>
            </div>
          )}

          {/* Trapezoidal Prism Inputs */}
          {shape === 'trapezoidal-prism' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Bottom Width (B) ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={bottomWidth}
                  onChange={(e) => setBottomWidth(e.target.value)}
                  placeholder="e.g. 6"
                  className="ch-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Top Width (T) ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={topWidth}
                  onChange={(e) => setTopWidth(e.target.value)}
                  placeholder="e.g. 4"
                  className="ch-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Cross-section Height (H) ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={trapHeight}
                  onChange={(e) => setTrapHeight(e.target.value)}
                  placeholder="e.g. 3"
                  className="ch-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Prism Length (L) ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={trapLength}
                  onChange={(e) => setTrapLength(e.target.value)}
                  placeholder="e.g. 10"
                  className="ch-input"
                  required
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="ch-btn ch-btn-primary flex-1">
              <Calculator size={16} />
              Calculate Volume
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="ch-btn ch-btn-outline"
              title="Reset Form"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Results & Explanation Section */}
      <div className="lg:col-span-5 space-y-6">
        {result ? (
          <div className="ch-card p-6 bg-[var(--color-ch-surface)] border-2 border-[var(--color-ch-orange)]/30 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[var(--color-ch-border)] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ch-orange)] flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Calculation Result
              </span>
              <span className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase">
                {shape.replace('-', ' ')}
              </span>
            </div>

            {/* Primary Result (m³) */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                Total Volume (Metric)
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ch-navy)] tracking-tight">
                {result.volumeM3.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{' '}
                <span className="text-xl font-semibold text-[var(--color-ch-orange)]">m³</span>
              </div>
            </div>

            {/* Secondary Results Grid (ft³ & Litres) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                  Imperial Equivalent
                </span>
                <div className="text-base font-bold text-[var(--color-ch-navy)]">
                  {result.volumeFt3.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}{' '}
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">ft³</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                  Fluid Capacity
                </span>
                <div className="text-base font-bold text-[var(--color-ch-navy)]">
                  {result.volumeLitres.toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">L</span>
                </div>
              </div>
            </div>

            {/* Formula Breakdown Card */}
            <div className="p-4 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-2">
              <span className="text-xs font-semibold text-[var(--color-ch-navy)] block uppercase tracking-wider">
                Formula & Step-by-Step Breakdown
              </span>
              <p className="font-mono text-xs text-[var(--color-ch-navy-light)] leading-relaxed break-words bg-[var(--color-ch-surface)] p-2.5 rounded border border-slate-200">
                {result.formula}
              </p>
            </div>
          </div>
        ) : (
          <div className="ch-card p-8 text-center bg-[var(--color-ch-surface)] border-dashed border-2 border-[var(--color-ch-border)] flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[var(--color-ch-border)] flex items-center justify-center mb-4 text-[var(--color-ch-text-muted)]">
              <Box size={28} />
            </div>
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">Ready to Calculate</h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-xs">
              Enter your solid dimensions on the left and click <strong>Calculate Volume</strong> to view cubic metres, cubic feet, and fluid capacity.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

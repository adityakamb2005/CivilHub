'use client'

import { useState } from 'react'
import {
  calculateArea,
  AreaInput,
  AreaResult,
  AreaShape,
  LengthUnit,
} from '@/lib/calculators/area'
import { CalculatorValidationError } from '@/lib/calculators/validation'
import { Square, Circle as CircleIcon, Triangle as TriangleIcon, Layers, RotateCcw, Calculator, CheckCircle2, AlertCircle } from 'lucide-react'

const SHAPES: { id: AreaShape; label: string; icon: typeof Square }[] = [
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: CircleIcon },
  { id: 'triangle', label: 'Triangle', icon: TriangleIcon },
  { id: 'trapezoid', label: 'Trapezoid', icon: Layers },
]

export default function AreaCalculator() {
  const [shape, setShape] = useState<AreaShape>('rectangle')
  const [unit, setUnit] = useState<LengthUnit>('metres')

  // Shape-specific inputs
  const [length, setLength] = useState<string>('10')
  const [width, setWidth] = useState<string>('5')

  const [radiusOrDiameter, setRadiusOrDiameter] = useState<'radius' | 'diameter'>('radius')
  const [circleValue, setCircleValue] = useState<string>('5')

  const [base, setBase] = useState<string>('8')
  const [triangleHeight, setTriangleHeight] = useState<string>('6')

  const [sideA, setSideA] = useState<string>('6')
  const [sideB, setSideB] = useState<string>('10')
  const [trapezoidHeight, setTrapezoidHeight] = useState<string>('4')

  // Result & Error state
  const [result, setResult] = useState<AreaResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unitLabel = unit === 'metres' ? 'm' : 'ft'

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    try {
      let input: AreaInput

      switch (shape) {
        case 'rectangle':
          input = {
            shape: 'rectangle',
            length: parseFloat(length),
            width: parseFloat(width),
            unit,
          }
          break
        case 'circle':
          input = {
            shape: 'circle',
            radiusOrDiameter,
            value: parseFloat(circleValue),
            unit,
          }
          break
        case 'triangle':
          input = {
            shape: 'triangle',
            base: parseFloat(base),
            height: parseFloat(triangleHeight),
            unit,
          }
          break
        case 'trapezoid':
          input = {
            shape: 'trapezoid',
            sideA: parseFloat(sideA),
            sideB: parseFloat(sideB),
            height: parseFloat(trapezoidHeight),
            unit,
          }
          break
      }

      const res = calculateArea(input)
      setResult(res)
    } catch (err: unknown) {
      setResult(null)
      if (err instanceof CalculatorValidationError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred during calculation.')
      }
    }
  }

  const handleReset = () => {
    setLength('')
    setWidth('')
    setCircleValue('')
    setBase('')
    setTriangleHeight('')
    setSideA('')
    setSideB('')
    setTrapezoidHeight('')
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
            1. Select Geometry / Shape
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
              2. Input Dimensions ({shape})
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

          {/* Dynamic Inputs per Shape */}
          {shape === 'rectangle' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          )}

          {shape === 'circle' && (
            <div className="space-y-4">
              <div className="flex gap-4 items-center text-sm">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--color-ch-navy)]">
                  <input
                    type="radio"
                    name="circleType"
                    checked={radiusOrDiameter === 'radius'}
                    onChange={() => setRadiusOrDiameter('radius')}
                    className="accent-[var(--color-ch-orange)]"
                  />
                  Radius
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--color-ch-navy)]">
                  <input
                    type="radio"
                    name="circleType"
                    checked={radiusOrDiameter === 'diameter'}
                    onChange={() => setRadiusOrDiameter('diameter')}
                    className="accent-[var(--color-ch-orange)]"
                  />
                  Diameter
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  {radiusOrDiameter === 'radius' ? 'Radius' : 'Diameter'} ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={circleValue}
                  onChange={(e) => setCircleValue(e.target.value)}
                  placeholder="e.g. 5"
                  className="ch-input"
                  required
                />
              </div>
            </div>
          )}

          {shape === 'triangle' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Base ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={base}
                  onChange={(e) => setBase(e.target.value)}
                  placeholder="e.g. 8"
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
                  value={triangleHeight}
                  onChange={(e) => setTriangleHeight(e.target.value)}
                  placeholder="e.g. 6"
                  className="ch-input"
                  required
                />
              </div>
            </div>
          )}

          {shape === 'trapezoid' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Side A (Top) ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={sideA}
                  onChange={(e) => setSideA(e.target.value)}
                  placeholder="e.g. 6"
                  className="ch-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Side B (Bottom) ({unitLabel})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={sideB}
                  onChange={(e) => setSideB(e.target.value)}
                  placeholder="e.g. 10"
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
                  value={trapezoidHeight}
                  onChange={(e) => setTrapezoidHeight(e.target.value)}
                  placeholder="e.g. 4"
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
              Calculate Area
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
                {shape}
              </span>
            </div>

            {/* Primary Result (m²) */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                Total Surface Area (Metric)
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ch-navy)] tracking-tight">
                {result.areaSqM.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{' '}
                <span className="text-xl font-semibold text-[var(--color-ch-orange)]">m²</span>
              </div>
            </div>

            {/* Secondary Result (ft²) */}
            <div className="p-3.5 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
              <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                Imperial Equivalent
              </span>
              <div className="text-lg font-bold text-[var(--color-ch-navy)]">
                {result.areaSqFt.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{' '}
                <span className="text-sm font-medium text-[var(--color-ch-text-secondary)]">ft²</span>
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
              <Square size={28} />
            </div>
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">Ready to Calculate</h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-xs">
              Enter your shape dimensions on the left and click <strong>Calculate Area</strong> to view precise metric and imperial surface areas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

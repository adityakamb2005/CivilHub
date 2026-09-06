'use client'

import { useState } from 'react'
import {
  calculateConcrete,
  MixGrade,
  LengthUnit,
  ConcreteResult,
  MIX_RATIOS,
} from '@/lib/calculators/concrete'
import { CalculatorValidationError } from '@/lib/calculators/validation'
import { Calculator, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react'

const GRADES: { id: MixGrade; label: string; desc: string }[] = [
  { id: 'M10', label: 'M10 (1 : 3 : 6)', desc: 'PCC, levelling course, non-structural' },
  { id: 'M15', label: 'M15 (1 : 2 : 4)', desc: 'Plain concrete, pathways, bedding' },
  { id: 'M20', label: 'M20 (1 : 1.5 : 3)', desc: 'RCC RCC slabs, beams, columns (standard)' },
  { id: 'M25', label: 'M25 (1 : 1 : 2)', desc: 'Heavy structural RCC, foundations' },
  { id: 'custom', label: 'Custom Ratio', desc: 'Specify custom C : S : A volumetric ratio' },
]

export default function ConcreteCalculator() {
  const [unit, setUnit] = useState<LengthUnit>('metres')
  const [length, setLength] = useState<string>('10')
  const [width, setWidth] = useState<string>('5')
  const [depth, setDepth] = useState<string>('0.15')

  const [grade, setGrade] = useState<MixGrade>('M20')
  const [customC, setCustomC] = useState<string>('1')
  const [customS, setCustomS] = useState<string>('1.5')
  const [customA, setCustomA] = useState<string>('3')
  const [wastagePercent, setWastagePercent] = useState<string>('5')

  const [result, setResult] = useState<ConcreteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unitLabel = unit === 'metres' ? 'm' : 'ft'

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    try {
      const cRatio: [number, number, number] = [
        parseFloat(customC) || 0,
        parseFloat(customS) || 0,
        parseFloat(customA) || 0,
      ]

      const res = calculateConcrete(
        parseFloat(length),
        parseFloat(width),
        parseFloat(depth),
        unit,
        grade,
        cRatio,
        parseFloat(wastagePercent) || 0
      )
      setResult(res)
    } catch (err: unknown) {
      setResult(null)
      if (err instanceof CalculatorValidationError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred during concrete calculation.')
      }
    }
  }

  const handleReset = () => {
    setLength('')
    setWidth('')
    setDepth('')
    setGrade('M20')
    setCustomC('1')
    setCustomS('1.5')
    setCustomA('3')
    setWastagePercent('5')
    setResult(null)
    setError(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls & Form Section */}
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleCalculate} className="ch-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--color-ch-border)] pb-4">
            <h2 className="text-base font-semibold text-[var(--color-ch-navy)]">
              Concrete Volume & Mix Specification
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

          {/* Member Dimensions */}
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
                Thickness / Depth ({unitLabel})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                placeholder="e.g. 0.15"
                className="ch-input"
                required
              />
            </div>
          </div>

          {/* Mix Grade Select */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
              Concrete Mix Grade
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as MixGrade)}
              className="ch-input"
            >
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label} — {g.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Ratio Inputs */}
          {grade === 'custom' && (
            <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-ch-navy)]">
                Custom Volumetric Ratio (Cement : Sand : Aggregate)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-[var(--color-ch-text-muted)] block mb-1">Cement</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={customC}
                    onChange={(e) => setCustomC(e.target.value)}
                    className="ch-input"
                    required
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[var(--color-ch-text-muted)] block mb-1">Sand</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={customS}
                    onChange={(e) => setCustomS(e.target.value)}
                    className="ch-input"
                    required
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[var(--color-ch-text-muted)] block mb-1">Aggregate</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={customA}
                    onChange={(e) => setCustomA(e.target.value)}
                    className="ch-input"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wastage */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
              Wastage Allowance (%)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={wastagePercent}
              onChange={(e) => setWastagePercent(e.target.value)}
              placeholder="e.g. 5"
              className="ch-input"
              required
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="ch-btn ch-btn-primary flex-1">
              <Calculator size={16} />
              Calculate Concrete Requirements
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

      {/* Results Section */}
      <div className="lg:col-span-5 space-y-6">
        {result ? (
          <div className="ch-card p-6 bg-[var(--color-ch-surface)] border-2 border-[var(--color-ch-orange)]/30 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[var(--color-ch-border)] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ch-orange)] flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Concrete Materials Required
              </span>
              <span className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase">
                {grade}
              </span>
            </div>

            {/* Cement Bags */}
            <div className="p-4 rounded-xl bg-white border border-[var(--color-ch-border)] space-y-1">
              <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                Cement Bags Required (50 kg bags)
              </span>
              <div className="text-3xl font-extrabold text-[var(--color-ch-navy)]">
                {result.cementBags}{' '}
                <span className="text-sm font-semibold text-[var(--color-ch-orange)]">bags</span>
              </div>
              <span className="text-[11px] text-[var(--color-ch-text-muted)] block">
                ({result.cementVolumeM3.toFixed(3)} m³ cement volume)
              </span>
            </div>

            {/* Sand & Aggregate Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                  Sand Volume
                </span>
                <div className="text-lg font-bold text-[var(--color-ch-navy)]">
                  {result.sandVolumeM3.toFixed(3)}{' '}
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">m³</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                  Aggregate Volume
                </span>
                <div className="text-lg font-bold text-[var(--color-ch-navy)]">
                  {result.aggregateVolumeM3.toFixed(3)}{' '}
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">m³</span>
                </div>
              </div>
            </div>

            {/* Volumes & Total Weight */}
            <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-1.5 text-xs text-[var(--color-ch-text-secondary)]">
              <div className="flex justify-between">
                <span>Wet Concrete Volume:</span>
                <strong className="text-[var(--color-ch-navy)]">{result.wetVolM3.toFixed(3)} m³</strong>
              </div>
              <div className="flex justify-between">
                <span>Dry Material Volume (1.54×):</span>
                <strong className="text-[var(--color-ch-navy)]">{result.dryVolM3.toFixed(3)} m³</strong>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1.5">
                <span>Est. Total Concrete Weight:</span>
                <strong className="text-[var(--color-ch-navy)]">
                  {result.concreteWeightKg.toLocaleString()} kg ({ (result.concreteWeightKg / 1000).toFixed(2) } tonnes)
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="ch-card p-8 text-center bg-[var(--color-ch-surface)] border-dashed border-2 border-[var(--color-ch-border)] flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">Ready to Calculate</h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-xs">
              Enter member dimensions and select a mix grade to view required cement bags, sand volume, and aggregate volume.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

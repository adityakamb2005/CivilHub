'use client'

import { useState } from 'react'
import { calculateCement, CementResult } from '@/lib/calculators/cement'
import { MixGrade, MIX_RATIOS } from '@/lib/calculators/concrete'
import { CalculatorValidationError } from '@/lib/calculators/validation'
import { Package, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react'

const GRADES: { id: MixGrade; label: string }[] = [
  { id: 'M10', label: 'M10 (1 : 3 : 6)' },
  { id: 'M15', label: 'M15 (1 : 2 : 4)' },
  { id: 'M20', label: 'M20 (1 : 1.5 : 3)' },
  { id: 'M25', label: 'M25 (1 : 1 : 2)' },
  { id: 'custom', label: 'Custom Ratio' },
]

export default function CementCalculator() {
  const [concreteVol, setConcreteVol] = useState<string>('10')
  const [grade, setGrade] = useState<MixGrade>('M20')
  const [customC, setCustomC] = useState<string>('1')
  const [customS, setCustomS] = useState<string>('1.5')
  const [customA, setCustomA] = useState<string>('3')
  const [bagSizeKg, setBagSizeKg] = useState<number>(50)

  const [result, setResult] = useState<CementResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    try {
      const cRatio: [number, number, number] = [
        parseFloat(customC) || 0,
        parseFloat(customS) || 0,
        parseFloat(customA) || 0,
      ]

      const res = calculateCement(
        parseFloat(concreteVol),
        grade,
        cRatio,
        bagSizeKg
      )
      setResult(res)
    } catch (err: unknown) {
      setResult(null)
      if (err instanceof CalculatorValidationError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred during cement calculation.')
      }
    }
  }

  const handleReset = () => {
    setConcreteVol('')
    setGrade('M20')
    setCustomC('1')
    setCustomS('1.5')
    setCustomA('3')
    setBagSizeKg(50)
    setResult(null)
    setError(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleCalculate} className="ch-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-[var(--color-ch-navy)] border-b border-[var(--color-ch-border)] pb-3">
            Cement Bag Estimation Specifications
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-red-200 flex items-start gap-3 text-sm text-[var(--color-ch-red)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Concrete Volume Input */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
              Target Wet Concrete Volume (m³)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={concreteVol}
              onChange={(e) => setConcreteVol(e.target.value)}
              placeholder="e.g. 10"
              className="ch-input"
              required
            />
          </div>

          {/* Mix Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                Bag Weight Packing
              </label>
              <select
                value={bagSizeKg}
                onChange={(e) => setBagSizeKg(Number(e.target.value))}
                className="ch-input"
              >
                <option value={50}>50 kg Standard Bag</option>
                <option value={40}>40 kg Bag</option>
              </select>
            </div>
          </div>

          {/* Custom Ratio */}
          {grade === 'custom' && (
            <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] space-y-2">
              <label className="block text-xs font-semibold text-[var(--color-ch-navy)]">
                Custom Ratio (Cement : Sand : Aggregate)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={customC}
                  onChange={(e) => setCustomC(e.target.value)}
                  className="ch-input"
                  placeholder="C"
                  required
                />
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={customS}
                  onChange={(e) => setCustomS(e.target.value)}
                  className="ch-input"
                  placeholder="S"
                  required
                />
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={customA}
                  onChange={(e) => setCustomA(e.target.value)}
                  className="ch-input"
                  placeholder="A"
                  required
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="ch-btn ch-btn-primary flex-1">
              <Package size={16} />
              Calculate Cement Bags
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
                <CheckCircle2 size={16} /> Cement Required
              </span>
              <span className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase">
                {bagSizeKg} kg Bags
              </span>
            </div>

            {/* Total Bags */}
            <div className="p-4 rounded-xl bg-white border border-[var(--color-ch-border)] space-y-1">
              <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                Total Cement Bags
              </span>
              <div className="text-3xl font-extrabold text-[var(--color-ch-navy)]">
                {result.cementBags}{' '}
                <span className="text-sm font-semibold text-[var(--color-ch-orange)]">bags</span>
              </div>
            </div>

            {/* Weight & Volume Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                  Total Weight
                </span>
                <div className="text-base font-bold text-[var(--color-ch-navy)]">
                  {result.cementWeightKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">kg</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                  Cement Volume
                </span>
                <div className="text-base font-bold text-[var(--color-ch-navy)]">
                  {result.cementVolumeM3.toFixed(3)}{' '}
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">m³</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="ch-card p-8 text-center bg-[var(--color-ch-surface)] border-dashed border-2 border-[var(--color-ch-border)] flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">Ready to Calculate</h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-xs">
              Enter target concrete volume and select a mix grade to determine exact cement bag requirements.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  calcSandForConcrete,
  calcSandForPlaster,
  SandResult,
} from '@/lib/calculators/sand'
import { MixGrade } from '@/lib/calculators/concrete'
import { CalculatorValidationError } from '@/lib/calculators/validation'
import { Layers, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react'

const CONCRETE_GRADES: { id: MixGrade; label: string }[] = [
  { id: 'M10', label: 'M10 (1 : 3 : 6)' },
  { id: 'M15', label: 'M15 (1 : 2 : 4)' },
  { id: 'M20', label: 'M20 (1 : 1.5 : 3)' },
  { id: 'M25', label: 'M25 (1 : 1 : 2)' },
  { id: 'custom', label: 'Custom Ratio' },
]

export default function SandCalculator() {
  const [mode, setMode] = useState<'concrete' | 'plaster'>('concrete')

  // Concrete mode inputs
  const [concreteVol, setConcreteVol] = useState<string>('10')
  const [grade, setGrade] = useState<MixGrade>('M20')
  const [customC, setCustomC] = useState<string>('1')
  const [customS, setCustomS] = useState<string>('1.5')
  const [customA, setCustomA] = useState<string>('3')

  // Plaster mode inputs
  const [plasterArea, setPlasterArea] = useState<string>('100')
  const [plasterThickness, setPlasterThickness] = useState<string>('12')
  const [cementParts, setCementParts] = useState<string>('1')
  const [sandParts, setSandParts] = useState<string>('4')

  const [result, setResult] = useState<SandResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    try {
      if (mode === 'concrete') {
        const cRatio: [number, number, number] = [
          parseFloat(customC) || 0,
          parseFloat(customS) || 0,
          parseFloat(customA) || 0,
        ]
        const res = calcSandForConcrete(parseFloat(concreteVol), grade, cRatio)
        setResult(res)
      } else {
        const res = calcSandForPlaster({
          areaSqM: parseFloat(plasterArea),
          thicknessMm: parseFloat(plasterThickness),
          cementParts: parseFloat(cementParts),
          sandParts: parseFloat(sandParts),
        })
        setResult(res)
      }
    } catch (err: unknown) {
      setResult(null)
      if (err instanceof CalculatorValidationError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred during sand calculation.')
      }
    }
  }

  const handleReset = () => {
    setConcreteVol('')
    setGrade('M20')
    setCustomC('1')
    setCustomS('1.5')
    setCustomA('3')
    setPlasterArea('')
    setPlasterThickness('12')
    setCementParts('1')
    setSandParts('4')
    setResult(null)
    setError(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-7 space-y-6">
        {/* Mode Selector */}
        <div className="ch-card p-6 space-y-3">
          <label className="block text-xs font-semibold text-[var(--color-ch-navy)] uppercase tracking-wider">
            Select Application Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('concrete')
                setResult(null)
                setError(null)
              }}
              className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                mode === 'concrete'
                  ? 'bg-[var(--color-ch-navy)] text-white border-[var(--color-ch-navy)]'
                  : 'bg-white text-[var(--color-ch-text-secondary)] border-[var(--color-ch-border)]'
              }`}
            >
              Concrete Mix Sand
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('plaster')
                setResult(null)
                setError(null)
              }}
              className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                mode === 'plaster'
                  ? 'bg-[var(--color-ch-navy)] text-white border-[var(--color-ch-navy)]'
                  : 'bg-white text-[var(--color-ch-text-secondary)] border-[var(--color-ch-border)]'
              }`}
            >
              Wall Plaster Sand
            </button>
          </div>
        </div>

        <form onSubmit={handleCalculate} className="ch-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-[var(--color-ch-navy)] border-b border-[var(--color-ch-border)] pb-3 capitalize">
            {mode} Mode Parameters
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-red-200 flex items-start gap-3 text-sm text-[var(--color-ch-red)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'concrete' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Concrete Volume (m³)
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

              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Mix Grade
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as MixGrade)}
                  className="ch-input"
                >
                  {CONCRETE_GRADES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {grade === 'custom' && (
                <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] space-y-2">
                  <label className="block text-xs font-semibold text-[var(--color-ch-navy)]">
                    Custom Volumetric Ratio (C : S : A)
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
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                    Plaster Wall Area (m²)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={plasterArea}
                    onChange={(e) => setPlasterArea(e.target.value)}
                    placeholder="e.g. 100"
                    className="ch-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                    Plaster Thickness (mm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={plasterThickness}
                    onChange={(e) => setPlasterThickness(e.target.value)}
                    placeholder="e.g. 12"
                    className="ch-input"
                    required
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] space-y-2">
                <label className="block text-xs font-semibold text-[var(--color-ch-navy)]">
                  Plaster Mortar Ratio (Cement : Sand)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-[var(--color-ch-text-muted)] block mb-1">Cement Parts</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={cementParts}
                      onChange={(e) => setCementParts(e.target.value)}
                      className="ch-input"
                      placeholder="1"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--color-ch-text-muted)] block mb-1">Sand Parts</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={sandParts}
                      onChange={(e) => setSandParts(e.target.value)}
                      className="ch-input"
                      placeholder="4"
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="ch-btn ch-btn-primary flex-1">
              <Layers size={16} />
              Calculate Sand Requirements
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
                <CheckCircle2 size={16} /> Sand Quantity Result
              </span>
              <span className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase">
                {result.mode} Mode
              </span>
            </div>

            {/* Sand Volume */}
            <div className="p-4 rounded-xl bg-white border border-[var(--color-ch-border)] space-y-1">
              <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                Total Sand Volume
              </span>
              <div className="text-3xl font-extrabold text-[var(--color-ch-navy)]">
                {result.sandVolumeM3.toFixed(3)}{' '}
                <span className="text-sm font-semibold text-[var(--color-ch-orange)]">m³</span>
              </div>
            </div>

            {/* Weight & Cement Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                  Sand Weight (1600 kg/m³)
                </span>
                <div className="text-base font-bold text-[var(--color-ch-navy)]">
                  {result.sandWeightKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">kg</span>
                </div>
              </div>

              {result.mode === 'plaster' ? (
                <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                    Cement Bags Needed
                  </span>
                  <div className="text-base font-bold text-[var(--color-ch-navy)]">
                    {result.cementBags}{' '}
                    <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">bags</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                    Dry Factor Applied
                  </span>
                  <div className="text-base font-bold text-[var(--color-ch-navy)]">1.54×</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="ch-card p-8 text-center bg-[var(--color-ch-surface)] border-dashed border-2 border-[var(--color-ch-border)] flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">Ready to Calculate</h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-xs">
              Select concrete or plaster mode to compute sand volume and weight.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

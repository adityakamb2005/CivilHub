'use client'

import { useState } from 'react'
import {
  calcSteelByBars,
  calcSteelBySlab,
  SteelResult,
} from '@/lib/calculators/steel'
import { CalculatorValidationError } from '@/lib/calculators/validation'
import { Ruler, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react'

const COMMON_DIAMETERS = [8, 10, 12, 16, 20, 25, 32]

export default function SteelCalculator() {
  const [mode, setMode] = useState<'bar' | 'slab'>('bar')

  // Bar mode inputs
  const [diameter, setDiameter] = useState<number>(12)
  const [barCount, setBarCount] = useState<string>('50')
  const [lengthPerBar, setLengthPerBar] = useState<string>('12')

  // Slab mode inputs
  const [slabLength, setSlabLength] = useState<string>('10')
  const [slabWidth, setSlabWidth] = useState<string>('6')
  const [slabDiameter, setSlabDiameter] = useState<number>(10)
  const [spacing, setSpacing] = useState<string>('150')
  const [cover, setCover] = useState<string>('25')
  const [bothWays, setBothWays] = useState<boolean>(true)

  const [result, setResult] = useState<SteelResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    try {
      if (mode === 'bar') {
        const res = calcSteelByBars(
          diameter,
          parseFloat(barCount),
          parseFloat(lengthPerBar)
        )
        setResult(res)
      } else {
        const res = calcSteelBySlab(
          parseFloat(slabLength),
          parseFloat(slabWidth),
          slabDiameter,
          parseFloat(spacing),
          parseFloat(cover),
          bothWays
        )
        setResult(res)
      }
    } catch (err: unknown) {
      setResult(null)
      if (err instanceof CalculatorValidationError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred during steel calculation.')
      }
    }
  }

  const handleReset = () => {
    setBarCount('')
    setLengthPerBar('')
    setSlabLength('')
    setSlabWidth('')
    setSpacing('150')
    setCover('25')
    setBothWays(true)
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
            Select Calculation Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('bar')
                setResult(null)
                setError(null)
              }}
              className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                mode === 'bar'
                  ? 'bg-[var(--color-ch-navy)] text-white border-[var(--color-ch-navy)]'
                  : 'bg-white text-[var(--color-ch-text-secondary)] border-[var(--color-ch-border)]'
              }`}
            >
              Mode A: Bar Count & Length
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('slab')
                setResult(null)
                setError(null)
              }}
              className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                mode === 'slab'
                  ? 'bg-[var(--color-ch-navy)] text-white border-[var(--color-ch-navy)]'
                  : 'bg-white text-[var(--color-ch-text-secondary)] border-[var(--color-ch-border)]'
              }`}
            >
              Mode B: Slab Reinforcement Grid
            </button>
          </div>
        </div>

        <form onSubmit={handleCalculate} className="ch-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-[var(--color-ch-navy)] border-b border-[var(--color-ch-border)] pb-3">
            {mode === 'bar' ? 'Bar Count Inputs' : 'Slab Grid Inputs'}
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-red-200 flex items-start gap-3 text-sm text-[var(--color-ch-red)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'bar' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                  Rebar Diameter (mm)
                </label>
                <select
                  value={diameter}
                  onChange={(e) => setDiameter(Number(e.target.value))}
                  className="ch-input"
                >
                  {COMMON_DIAMETERS.map((d) => (
                    <option key={d} value={d}>
                      {d} mm Rebar (D² / 162 = {((d * d) / 162).toFixed(3)} kg/m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                    Number of Bars
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={barCount}
                    onChange={(e) => setBarCount(e.target.value)}
                    placeholder="e.g. 50"
                    className="ch-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                    Length per Bar (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={lengthPerBar}
                    onChange={(e) => setLengthPerBar(e.target.value)}
                    placeholder="e.g. 12"
                    className="ch-input"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                    Slab Length (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={slabLength}
                    onChange={(e) => setSlabLength(e.target.value)}
                    placeholder="e.g. 10"
                    className="ch-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                    Slab Width (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={slabWidth}
                    onChange={(e) => setSlabWidth(e.target.value)}
                    placeholder="e.g. 6"
                    className="ch-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                    Rebar Diameter (mm)
                  </label>
                  <select
                    value={slabDiameter}
                    onChange={(e) => setSlabDiameter(Number(e.target.value))}
                    className="ch-input"
                  >
                    {COMMON_DIAMETERS.map((d) => (
                      <option key={d} value={d}>
                        {d} mm
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                    Spacing (mm c/c)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={spacing}
                    onChange={(e) => setSpacing(e.target.value)}
                    placeholder="e.g. 150"
                    className="ch-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                    Clear Cover (mm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    placeholder="e.g. 25"
                    className="ch-input"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-sm font-medium text-[var(--color-ch-navy)]">
                <input
                  type="checkbox"
                  checked={bothWays}
                  onChange={(e) => setBothWays(e.target.checked)}
                  className="rounded border-[var(--color-ch-border)] text-[var(--color-ch-orange)] focus:ring-[var(--color-ch-orange)]"
                />
                Both-ways Orthogonal Grid Reinforcement (Main + Distribution)
              </label>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="ch-btn ch-btn-primary flex-1">
              <Ruler size={16} />
              Calculate Steel Weight
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
                <CheckCircle2 size={16} /> Steel Reinforcement Result
              </span>
              <span className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase">
                {result.mode} Mode
              </span>
            </div>

            {/* Total Weight */}
            <div className="p-4 rounded-xl bg-white border border-[var(--color-ch-border)] space-y-1">
              <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                Total Steel Weight
              </span>
              <div className="text-3xl font-extrabold text-[var(--color-ch-navy)]">
                {result.totalWeightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                <span className="text-sm font-semibold text-[var(--color-ch-orange)]">kg</span>
              </div>
              <span className="text-[11px] text-[var(--color-ch-text-muted)] block">
                ({(result.totalWeightKg / 1000).toFixed(3)} metric tonnes)
              </span>
            </div>

            {/* Total Length & Weight/m² Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                  Total Rebar Length
                </span>
                <div className="text-base font-bold text-[var(--color-ch-navy)]">
                  {result.totalLengthM.toFixed(2)}{' '}
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">m</span>
                </div>
              </div>

              {result.mode === 'slab' && (
                <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                    Weight per Area
                  </span>
                  <div className="text-base font-bold text-[var(--color-ch-navy)]">
                    {result.weightPerM2.toFixed(2)}{' '}
                    <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">kg/m²</span>
                  </div>
                </div>
              )}
            </div>

            {result.mode === 'slab' && (
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs text-[var(--color-ch-text-secondary)]">
                <strong className="text-[var(--color-ch-navy)] block mb-1">Hook Allowance Note:</strong>
                Includes default 9D hook allowance per bar end (18D total per bar).
              </div>
            )}
          </div>
        ) : (
          <div className="ch-card p-8 text-center bg-[var(--color-ch-surface)] border-dashed border-2 border-[var(--color-ch-border)] flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">Ready to Calculate</h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-xs">
              Enter bar details or slab reinforcement grid spacing to compute steel weight.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

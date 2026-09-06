'use client'

import { useState } from 'react'
import {
  convert,
  UNITS,
  CATEGORY_LABELS,
  UnitCategory,
} from '@/lib/calculators/unitConverter'
import { CalculatorValidationError } from '@/lib/calculators/validation'
import { RefreshCw, RotateCcw, CheckCircle2, AlertCircle, ArrowRightLeft } from 'lucide-react'

const CATEGORIES: UnitCategory[] = [
  'length',
  'area',
  'volume',
  'mass',
  'pressure',
  'force',
]

export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('length')
  const [inputValue, setInputValue] = useState<string>('10')

  const availableUnits = UNITS[category]
  const [fromSymbol, setFromSymbol] = useState<string>(availableUnits[2]?.symbol || availableUnits[0].symbol)
  const [toSymbol, setToSymbol] = useState<string>(availableUnits[5]?.symbol || availableUnits[1].symbol)

  const [convertedValue, setConvertedValue] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    try {
      const val = parseFloat(inputValue)
      const res = convert(val, fromSymbol, toSymbol, category)
      if (Number.isNaN(res)) {
        throw new CalculatorValidationError('Invalid unit selection or conversion failure.', 'Units')
      }
      setConvertedValue(res)
    } catch (err: unknown) {
      setConvertedValue(null)
      if (err instanceof CalculatorValidationError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred during unit conversion.')
      }
    }
  }

  const handleCategoryChange = (newCat: UnitCategory) => {
    setCategory(newCat)
    const units = UNITS[newCat]
    setFromSymbol(units[0].symbol)
    setToSymbol(units[1] ? units[1].symbol : units[0].symbol)
    setConvertedValue(null)
    setError(null)
  }

  const handleSwapUnits = () => {
    const temp = fromSymbol
    setFromSymbol(toSymbol)
    setToSymbol(temp)
    setConvertedValue(null)
  }

  const handleReset = () => {
    setInputValue('10')
    setConvertedValue(null)
    setError(null)
  }

  const fromDef = availableUnits.find((u) => u.symbol === fromSymbol)
  const toDef = availableUnits.find((u) => u.symbol === toSymbol)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-7 space-y-6">
        {/* Category Tabs */}
        <div className="ch-card p-6 space-y-3">
          <label className="block text-xs font-semibold text-[var(--color-ch-navy)] uppercase tracking-wider">
            1. Select Unit Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-[var(--color-ch-navy)] text-white border-[var(--color-ch-navy)] shadow-xs font-semibold'
                    : 'bg-white text-[var(--color-ch-text-secondary)] border-[var(--color-ch-border)] hover:bg-[var(--color-ch-surface)]'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleConvert} className="ch-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-[var(--color-ch-navy)] border-b border-[var(--color-ch-border)] pb-3 capitalize">
            2. Convert {CATEGORY_LABELS[category]} Units
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-red-200 flex items-start gap-3 text-sm text-[var(--color-ch-red)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Value Input */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
              Value to Convert
            </label>
            <input
              type="number"
              step="any"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. 10"
              className="ch-input"
              required
            />
          </div>

          {/* Source & Target Unit Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                From Unit
              </label>
              <select
                value={fromSymbol}
                onChange={(e) => {
                  setFromSymbol(e.target.value)
                  setConvertedValue(null)
                }}
                className="ch-input"
              >
                {availableUnits.map((u) => (
                  <option key={u.symbol} value={u.symbol}>
                    {u.label} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1 flex justify-center pt-5 sm:pt-4">
              <button
                type="button"
                onClick={handleSwapUnits}
                className="p-2 rounded-lg border border-[var(--color-ch-border)] hover:bg-[var(--color-ch-surface)] text-[var(--color-ch-navy)] transition-colors"
                title="Swap Units"
              >
                <ArrowRightLeft size={16} />
              </button>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                To Unit
              </label>
              <select
                value={toSymbol}
                onChange={(e) => {
                  setToSymbol(e.target.value)
                  setConvertedValue(null)
                }}
                className="ch-input"
              >
                {availableUnits.map((u) => (
                  <option key={u.symbol} value={u.symbol}>
                    {u.label} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="ch-btn ch-btn-primary flex-1">
              <RefreshCw size={16} />
              Convert Units
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
        {convertedValue !== null ? (
          <div className="ch-card p-6 bg-[var(--color-ch-surface)] border-2 border-[var(--color-ch-orange)]/30 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[var(--color-ch-border)] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ch-orange)] flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Conversion Result
              </span>
              <span className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase">
                {CATEGORY_LABELS[category]}
              </span>
            </div>

            {/* Result Display */}
            <div className="p-4 rounded-xl bg-white border border-[var(--color-ch-border)] space-y-1">
              <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                {inputValue} {fromDef?.label} =
              </span>
              <div className="text-3xl font-extrabold text-[var(--color-ch-navy)] tracking-tight">
                {convertedValue.toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}{' '}
                <span className="text-xl font-semibold text-[var(--color-ch-orange)]">
                  {toDef?.symbol}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-[var(--color-ch-navy-light)]">
              {inputValue} {fromSymbol} = {convertedValue} {toSymbol}
            </div>
          </div>
        ) : (
          <div className="ch-card p-8 text-center bg-[var(--color-ch-surface)] border-dashed border-2 border-[var(--color-ch-border)] flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">Ready to Convert</h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-xs">
              Select category and unit symbols to perform instant precision unit conversions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  calculateCost,
  ConstructionType,
  Currency,
  CostResult,
  LocationTier,
} from '@/lib/calculators/costEstimator'
import { CalculatorValidationError } from '@/lib/calculators/validation'
import { AlertCircle, Calculator, CheckCircle2, RotateCcw } from 'lucide-react'

const CONSTRUCTION_TYPES: { value: ConstructionType; label: string }[] = [
  { value: 'economy', label: 'Economy' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxury', label: 'Luxury' },
]

const LOCATION_TIERS: { value: LocationTier; label: string }[] = [
  { value: 'tier1', label: 'Tier 1 City' },
  { value: 'tier2', label: 'Tier 2 City' },
  { value: 'rural', label: 'Rural' },
]

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
]

function formatMoney(value: number, currency: Currency): string {
  if (!Number.isFinite(value)) return '—'

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  }).format(value)
}

function formatArea(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function CostEstimator() {
  const [areaM2, setAreaM2] = useState<string>('100')
  const [constructionType, setConstructionType] = useState<ConstructionType>('standard')
  const [locationTier, setLocationTier] = useState<LocationTier>('tier1')
  const [currency, setCurrency] = useState<Currency>('INR')
  const [result, setResult] = useState<CostResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const calculation = calculateCost(
        parseFloat(areaM2),
        constructionType,
        locationTier,
        currency
      )
      setResult(calculation)
    } catch (err: unknown) {
      setResult(null)
      if (err instanceof CalculatorValidationError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred during cost estimation.')
      }
    }
  }

  const handleReset = () => {
    setAreaM2('')
    setConstructionType('standard')
    setLocationTier('tier1')
    setCurrency('INR')
    setResult(null)
    setError(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleCalculate} className="ch-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--color-ch-border)] pb-4">
            <h2 className="text-base font-semibold text-[var(--color-ch-navy)]">
              Construction Cost Inputs
            </h2>
            <span className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase">
              Estimate
            </span>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-red-200 flex items-start gap-3 text-sm text-[var(--color-ch-red)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="cost-area" className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
              Built-up Area (m²)
            </label>
            <input
              id="cost-area"
              type="number"
              step="any"
              min="0"
              value={areaM2}
              onChange={(event) => setAreaM2(event.target.value)}
              placeholder="e.g. 100"
              className="ch-input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cost-construction-type" className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                Construction Type
              </label>
              <select
                id="cost-construction-type"
                value={constructionType}
                onChange={(event) => {
                  setConstructionType(event.target.value as ConstructionType)
                  setResult(null)
                }}
                className="ch-input"
              >
                {CONSTRUCTION_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cost-location-tier" className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                Location Tier
              </label>
              <select
                id="cost-location-tier"
                value={locationTier}
                onChange={(event) => {
                  setLocationTier(event.target.value as LocationTier)
                  setResult(null)
                }}
                className="ch-input"
              >
                {LOCATION_TIERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="cost-currency" className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
              Currency
            </label>
            <select
              id="cost-currency"
              value={currency}
              onChange={(event) => {
                setCurrency(event.target.value as Currency)
                setResult(null)
              }}
              className="ch-input"
            >
              {CURRENCIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="ch-btn ch-btn-primary flex-1">
              <Calculator size={16} />
              Estimate Cost
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

      <div className="lg:col-span-5 space-y-6">
        {result ? (
          <div className="ch-card p-6 bg-[var(--color-ch-surface)] border-2 border-[var(--color-ch-orange)]/30 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[var(--color-ch-border)] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ch-orange)] flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Estimated Cost
              </span>
              <span className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase">
                {result.currency}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                Estimated Range
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-ch-navy)] tracking-tight">
                {formatMoney(result.lowEstimate, result.currency)}
                <span className="text-xl font-semibold text-[var(--color-ch-orange)]"> – </span>
                {formatMoney(result.highEstimate, result.currency)}
              </div>
              <span className="text-xs text-[var(--color-ch-text-muted)] block">
                For {formatArea(result.areaM2)} m² of built-up area
              </span>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-1.5">
              <span className="text-xs font-semibold text-[var(--color-ch-navy)] block uppercase tracking-wider">
                Rate Range
              </span>
              <div className="text-lg font-bold text-[var(--color-ch-navy)]">
                {formatMoney(result.ratePerM2Low, result.currency)}
                <span className="text-sm font-medium text-[var(--color-ch-text-secondary)]"> – </span>
                {formatMoney(result.ratePerM2High, result.currency)}
                <span className="text-sm font-medium text-[var(--color-ch-text-secondary)]"> / m²</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="ch-card p-8 text-center bg-[var(--color-ch-surface)] border-dashed border-2 border-[var(--color-ch-border)] flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[var(--color-ch-border)] flex items-center justify-center mb-4 text-[var(--color-ch-text-muted)]">
              <Calculator size={28} />
            </div>
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">Ready to Estimate</h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-xs">
              Enter the built-up area and select the construction and location categories to view an estimated cost range.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

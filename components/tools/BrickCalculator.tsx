'use client'

import { useState } from 'react'
import {
  BRICK_PRESETS,
  calculateBricks,
  BrickResult,
  Opening,
} from '@/lib/calculators/brick'
import { CalculatorValidationError } from '@/lib/calculators/validation'
import { AlertCircle, Calculator, CheckCircle2, Layers, Plus, RotateCcw, Trash2 } from 'lucide-react'

interface OpeningInput {
  widthM: string
  heightM: string
}

const DEFAULT_PRESET = Object.keys(BRICK_PRESETS)[0]

function formatFinite(value: number, maximumFractionDigits: number): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, { maximumFractionDigits })
}

export default function BrickCalculator() {
  const [wallLengthM, setWallLengthM] = useState<string>('10')
  const [wallHeightM, setWallHeightM] = useState<string>('3')
  const [wallThicknessMm, setWallThicknessMm] = useState<string>('230')
  const [brickPreset, setBrickPreset] = useState<string>(DEFAULT_PRESET)
  const [mortarJointMm, setMortarJointMm] = useState<string>('10')
  const [wastagePercent, setWastagePercent] = useState<string>('5')
  const [openings, setOpenings] = useState<OpeningInput[]>([])
  const [result, setResult] = useState<BrickResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clearResult = () => {
    setResult(null)
    setError(null)
  }

  const handleCalculate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const openingValues: Opening[] = openings.map((opening) => ({
        widthM: parseFloat(opening.widthM),
        heightM: parseFloat(opening.heightM),
      }))

      const calculation = calculateBricks({
        wallLengthM: parseFloat(wallLengthM),
        wallHeightM: parseFloat(wallHeightM),
        wallThicknessMm: parseFloat(wallThicknessMm),
        brick: BRICK_PRESETS[brickPreset],
        mortarJointMm: parseFloat(mortarJointMm),
        wastagePercent: parseFloat(wastagePercent),
        openings: openingValues,
      })
      setResult(calculation)
    } catch (err: unknown) {
      setResult(null)
      if (err instanceof CalculatorValidationError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred during brick calculation.')
      }
    }
  }

  const handleReset = () => {
    setWallLengthM('')
    setWallHeightM('')
    setWallThicknessMm('')
    setBrickPreset(DEFAULT_PRESET)
    setMortarJointMm('')
    setWastagePercent('')
    setOpenings([])
    setResult(null)
    setError(null)
  }

  const addOpening = () => {
    setOpenings((current) => [...current, { widthM: '', heightM: '' }])
    clearResult()
  }

  const updateOpening = (index: number, field: keyof OpeningInput, value: string) => {
    setOpenings((current) =>
      current.map((opening, openingIndex) =>
        openingIndex === index ? { ...opening, [field]: value } : opening
      )
    )
    clearResult()
  }

  const removeOpening = (index: number) => {
    setOpenings((current) => current.filter((_, openingIndex) => openingIndex !== index))
    clearResult()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleCalculate} className="ch-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--color-ch-border)] pb-4">
            <h2 className="text-base font-semibold text-[var(--color-ch-navy)]">
              Wall & Brick Inputs
            </h2>
            <span className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase">
              Metric
            </span>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-ch-red-light)] border border-red-200 flex items-start gap-3 text-sm text-[var(--color-ch-red)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brick-wall-length" className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                Wall Length (m)
              </label>
              <input
                id="brick-wall-length"
                type="number"
                step="any"
                min="0"
                value={wallLengthM}
                onChange={(event) => {
                  setWallLengthM(event.target.value)
                  clearResult()
                }}
                placeholder="e.g. 10"
                className="ch-input"
                required
              />
            </div>
            <div>
              <label htmlFor="brick-wall-height" className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                Wall Height (m)
              </label>
              <input
                id="brick-wall-height"
                type="number"
                step="any"
                min="0"
                value={wallHeightM}
                onChange={(event) => {
                  setWallHeightM(event.target.value)
                  clearResult()
                }}
                placeholder="e.g. 3"
                className="ch-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brick-wall-thickness" className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                Wall Thickness (mm)
              </label>
              <input
                id="brick-wall-thickness"
                type="number"
                step="any"
                min="0"
                value={wallThicknessMm}
                onChange={(event) => {
                  setWallThicknessMm(event.target.value)
                  clearResult()
                }}
                placeholder="e.g. 230"
                className="ch-input"
                required
              />
            </div>
            <div>
              <label htmlFor="brick-preset" className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                Brick / Block Preset
              </label>
              <select
                id="brick-preset"
                value={brickPreset}
                onChange={(event) => {
                  setBrickPreset(event.target.value)
                  clearResult()
                }}
                className="ch-input"
              >
                {Object.keys(BRICK_PRESETS).map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brick-mortar-joint" className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                Mortar Joint (mm)
              </label>
              <input
                id="brick-mortar-joint"
                type="number"
                step="any"
                min="0"
                value={mortarJointMm}
                onChange={(event) => {
                  setMortarJointMm(event.target.value)
                  clearResult()
                }}
                placeholder="e.g. 10"
                className="ch-input"
                required
              />
            </div>
            <div>
              <label htmlFor="brick-wastage" className="block text-xs font-medium text-[var(--color-ch-text-secondary)] mb-1">
                Wastage Allowance (%)
              </label>
              <input
                id="brick-wastage"
                type="number"
                step="any"
                min="0"
                value={wastagePercent}
                onChange={(event) => {
                  setWastagePercent(event.target.value)
                  clearResult()
                }}
                placeholder="e.g. 5"
                className="ch-input"
                required
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-[var(--color-ch-navy)] uppercase tracking-wider">
                  Openings
                </h3>
                <p className="text-[11px] text-[var(--color-ch-text-muted)] mt-1">
                  Add door and window openings to subtract from the wall area.
                </p>
              </div>
              <button type="button" onClick={addOpening} className="ch-btn ch-btn-outline px-3 py-2 text-xs">
                <Plus size={14} />
                Add Opening
              </button>
            </div>

            {openings.length > 0 && (
              <div className="space-y-3">
                {openings.map((opening, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <div>
                      <label htmlFor={`opening-width-${index}`} className="block text-[11px] text-[var(--color-ch-text-muted)] mb-1">
                        Opening {index + 1} Width (m)
                      </label>
                      <input
                        id={`opening-width-${index}`}
                        type="number"
                        step="any"
                        min="0"
                        value={opening.widthM}
                        onChange={(event) => updateOpening(index, 'widthM', event.target.value)}
                        placeholder="e.g. 1.2"
                        className="ch-input"
                      />
                    </div>
                    <div>
                      <label htmlFor={`opening-height-${index}`} className="block text-[11px] text-[var(--color-ch-text-muted)] mb-1">
                        Height (m)
                      </label>
                      <input
                        id={`opening-height-${index}`}
                        type="number"
                        step="any"
                        min="0"
                        value={opening.heightM}
                        onChange={(event) => updateOpening(index, 'heightM', event.target.value)}
                        placeholder="e.g. 2.1"
                        className="ch-input"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOpening(index)}
                      className="ch-btn ch-btn-outline px-3 py-2 text-[var(--color-ch-red)]"
                      title={`Remove opening ${index + 1}`}
                      aria-label={`Remove opening ${index + 1}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="ch-btn ch-btn-primary flex-1">
              <Calculator size={16} />
              Calculate Bricks
            </button>
            <button type="button" onClick={handleReset} className="ch-btn ch-btn-outline" title="Reset Form">
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
                <CheckCircle2 size={16} /> Calculation Result
              </span>
              <span className="text-xs font-semibold text-[var(--color-ch-text-muted)] uppercase">
                Brick / Block
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                Bricks Required (including wastage)
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ch-navy)] tracking-tight">
                {formatFinite(result.bricksRequired, 0)}
                <span className="text-xl font-semibold text-[var(--color-ch-orange)]"> units</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                  Net Wall Area
                </span>
                <div className="text-lg font-bold text-[var(--color-ch-navy)]">
                  {formatFinite(result.netWallAreaM2, 2)}{' '}
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">m²</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[var(--color-ch-border)] space-y-0.5">
                <span className="text-xs font-medium text-[var(--color-ch-text-secondary)] block">
                  Mortar Volume
                </span>
                <div className="text-lg font-bold text-[var(--color-ch-navy)]">
                  {formatFinite(result.mortarVolumeM3, 3)}{' '}
                  <span className="text-xs font-medium text-[var(--color-ch-text-secondary)]">m³</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="ch-card p-8 text-center bg-[var(--color-ch-surface)] border-dashed border-2 border-[var(--color-ch-border)] flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[var(--color-ch-border)] flex items-center justify-center mb-4 text-[var(--color-ch-text-muted)]">
              <Layers size={28} />
            </div>
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">Ready to Calculate</h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-xs">
              Enter the wall dimensions, select a brick or block preset, and add any openings to view the required quantity and mortar volume.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

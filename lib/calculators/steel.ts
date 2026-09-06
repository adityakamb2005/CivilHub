// lib/calculators/steel.ts
// Standard formula: Weight (kg) = (D² / 162) × Length (m)
// where D is bar diameter in mm

import {
  validatePositiveNumber,
  validateNonNegativeNumber,
  CalculatorValidationError,
} from './validation'

export interface SteelBarResult {
  mode: 'bar'
  totalLengthM: number
  totalWeightKg: number
}

export interface SteelSlabResult {
  mode: 'slab'
  totalLengthM: number
  totalWeightKg: number
  weightPerM2: number
  hookAllowanceNoteShown: true
}

export type SteelResult = SteelBarResult | SteelSlabResult

/**
 * Mode A — by bar count and individual length
 */
export function calcSteelByBars(
  diameterMm: number,
  barCount: number,
  lengthPerBarM: number
): SteelBarResult {
  validatePositiveNumber(diameterMm, 'Diameter')
  validatePositiveNumber(barCount, 'Bar count')
  validatePositiveNumber(lengthPerBarM, 'Length per bar')

  const totalLength = barCount * lengthPerBarM
  const weight = (diameterMm ** 2 / 162) * totalLength
  return { mode: 'bar', totalLengthM: totalLength, totalWeightKg: weight }
}

/**
 * Mode B — slab reinforcement by spacing
 * Hook allowance: 9D per hook end (2 ends per bar), fixed default, shown as a note.
 */
export function calcSteelBySlab(
  slabLengthM: number,
  slabWidthM: number,
  diameterMm: number,
  spacingMm: number,
  coverMm: number,
  bothWays: boolean
): SteelSlabResult {
  validatePositiveNumber(slabLengthM, 'Slab length')
  validatePositiveNumber(slabWidthM, 'Slab width')
  validatePositiveNumber(diameterMm, 'Diameter')
  validatePositiveNumber(spacingMm, 'Spacing')
  validateNonNegativeNumber(coverMm, 'Concrete cover')

  const coverM = coverMm / 1000
  if (2 * coverM >= slabLengthM || 2 * coverM >= slabWidthM) {
    throw new CalculatorValidationError(
      'Concrete cover cannot equal or exceed half of slab span.',
      'Concrete cover'
    )
  }

  const HOOK_ALLOWANCE_M = (9 * diameterMm * 2) / 1000  // 9D per hook × 2 ends

  function barsInDirection(span: number, perpSpan: number): { count: number; totalLength: number } {
    const effective = span - 2 * coverM
    const barLen = perpSpan - 2 * coverM + HOOK_ALLOWANCE_M
    const count = Math.floor(effective / (spacingMm / 1000)) + 1
    return { count, totalLength: count * barLen }
  }

  const dir1 = barsInDirection(slabLengthM, slabWidthM)
  let totalLength = dir1.totalLength

  if (bothWays) {
    const dir2 = barsInDirection(slabWidthM, slabLengthM)
    totalLength += dir2.totalLength
  }

  const weight = (diameterMm ** 2 / 162) * totalLength
  const areaM2 = slabLengthM * slabWidthM

  return {
    mode: 'slab',
    totalLengthM: totalLength,
    totalWeightKg: weight,
    weightPerM2: areaM2 > 0 ? weight / areaM2 : 0,
    hookAllowanceNoteShown: true,
  }
}

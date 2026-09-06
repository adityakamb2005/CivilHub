// lib/calculators/concrete.ts

import {
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateRatioSum,
} from './validation'

export type LengthUnit = 'metres' | 'feet'
export type MixGrade = 'M10' | 'M15' | 'M20' | 'M25' | 'custom'

// Standard mix ratios C:S:A
export const MIX_RATIOS: Record<Exclude<MixGrade, 'custom'>, [number, number, number]> = {
  M10: [1, 3, 6],
  M15: [1, 2, 4],
  M20: [1, 1.5, 3],
  M25: [1, 1, 2],
}

const DRY_FACTOR = 1.54        // wet-to-dry expansion
const CEMENT_DENSITY = 1440    // kg/m³
const CEMENT_BAG_KG = 50       // standard bag
const CEMENT_BAG_M3 = CEMENT_BAG_KG / CEMENT_DENSITY  // 0.03472 m³
const CONCRETE_DENSITY = 2400  // kg/m³ for weight reference
const FT_TO_M = 0.3048

function toM(v: number, unit: LengthUnit) {
  return unit === 'feet' ? v * FT_TO_M : v
}

export interface ConcreteResult {
  wetVolM3: number
  dryVolM3: number
  cementBags: number
  cementVolumeM3: number
  sandVolumeM3: number
  aggregateVolumeM3: number
  concreteWeightKg: number
}

export function calculateConcrete(
  length: number,
  width: number,
  depth: number,
  unit: LengthUnit,
  grade: MixGrade,
  customRatio: [number, number, number],   // C, S, A — used only when grade === 'custom'
  wastagePercent: number
): ConcreteResult {
  validatePositiveNumber(length, 'Length')
  validatePositiveNumber(width, 'Width')
  validatePositiveNumber(depth, 'Depth')
  validateNonNegativeNumber(wastagePercent, 'Wastage percentage')

  const L = toM(length, unit)
  const W = toM(width, unit)
  const D = toM(depth, unit)

  const wetVol = L * W * D
  const dryVol = wetVol * DRY_FACTOR * (1 + wastagePercent / 100)

  const ratio = grade === 'custom' ? customRatio : MIX_RATIOS[grade]
  validateRatioSum(ratio, 'Mix ratio')
  const [C, S, A] = ratio
  const sum = C + S + A

  const cementVol = (C / sum) * dryVol
  const sandVol = (S / sum) * dryVol
  const aggVol = (A / sum) * dryVol

  // Ceiling: always round up cement bags
  const cementBags = Math.ceil(cementVol / CEMENT_BAG_M3)

  return {
    wetVolM3: wetVol,
    dryVolM3: dryVol,
    cementBags,
    cementVolumeM3: cementVol,
    sandVolumeM3: sandVol,
    aggregateVolumeM3: aggVol,
    concreteWeightKg: wetVol * CONCRETE_DENSITY,
  }
}

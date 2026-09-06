// lib/calculators/cement.ts

import { MIX_RATIOS, MixGrade } from './concrete'
import { validatePositiveNumber, validateRatioSum } from './validation'

const DRY_FACTOR = 1.54
const CEMENT_DENSITY = 1440  // kg/m³

export interface CementResult {
  cementBags: number
  cementWeightKg: number
  cementVolumeM3: number
}

/**
 * @param concreteVolumeM3  wet concrete volume in m³
 * @param grade             mix grade
 * @param customRatio       [C, S, A] used only when grade === 'custom'
 * @param bagSizeKg         50 or 40 kg
 */
export function calculateCement(
  concreteVolumeM3: number,
  grade: MixGrade,
  customRatio: [number, number, number],
  bagSizeKg: number
): CementResult {
  validatePositiveNumber(concreteVolumeM3, 'Concrete volume')
  validatePositiveNumber(bagSizeKg, 'Bag size')

  const ratio = grade === 'custom' ? customRatio : MIX_RATIOS[grade]
  validateRatioSum(ratio, 'Mix ratio')
  const [C, S, A] = ratio
  const sum = C + S + A

  const dryVol = concreteVolumeM3 * DRY_FACTOR
  const cementVol = (C / sum) * dryVol
  const cementKg = cementVol * CEMENT_DENSITY
  const bagM3 = bagSizeKg / CEMENT_DENSITY
  const bags = Math.ceil(cementVol / bagM3)

  return {
    cementBags: bags,
    cementWeightKg: cementKg,
    cementVolumeM3: cementVol,
  }
}

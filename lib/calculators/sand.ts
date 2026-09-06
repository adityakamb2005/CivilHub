// lib/calculators/sand.ts

import { MIX_RATIOS, MixGrade } from './concrete'
import { validatePositiveNumber, validateRatioSum } from './validation'

const DRY_FACTOR_CONCRETE = 1.54
const DRY_FACTOR_PLASTER = 1.27
const SAND_DENSITY = 1600   // kg/m³
const CEMENT_DENSITY = 1440 // kg/m³
const CEMENT_BAG_KG = 50

export interface SandConcreteResult {
  mode: 'concrete'
  sandVolumeM3: number
  sandWeightKg: number
}

export interface SandPlasterResult {
  mode: 'plaster'
  sandVolumeM3: number
  sandWeightKg: number
  cementBags: number
}

export type SandResult = SandConcreteResult | SandPlasterResult

export function calcSandForConcrete(
  concreteVolumeM3: number,
  grade: MixGrade,
  customRatio: [number, number, number]
): SandConcreteResult {
  validatePositiveNumber(concreteVolumeM3, 'Concrete volume')

  const ratio = grade === 'custom' ? customRatio : MIX_RATIOS[grade]
  validateRatioSum(ratio, 'Mix ratio')
  const [C, S, A] = ratio
  const sum = C + S + A

  const dryVol = concreteVolumeM3 * DRY_FACTOR_CONCRETE
  const sandVol = (S / sum) * dryVol

  return {
    mode: 'concrete',
    sandVolumeM3: sandVol,
    sandWeightKg: sandVol * SAND_DENSITY,
  }
}

export interface PlasterInput {
  areaSqM: number
  thicknessMm: number
  cementParts: number  // e.g. 1
  sandParts: number    // e.g. 4
}

export function calcSandForPlaster(input: PlasterInput): SandPlasterResult {
  const { areaSqM, thicknessMm, cementParts, sandParts } = input
  validatePositiveNumber(areaSqM, 'Area')
  validatePositiveNumber(thicknessMm, 'Thickness')
  validateRatioSum([cementParts, sandParts], 'Plaster ratio')

  const mortarVol = areaSqM * (thicknessMm / 1000)
  const dryVol = mortarVol * DRY_FACTOR_PLASTER
  const sum = cementParts + sandParts

  const sandVol = (sandParts / sum) * dryVol
  const cementVol = (cementParts / sum) * dryVol
  const cementBags = Math.ceil((cementVol * CEMENT_DENSITY) / CEMENT_BAG_KG)

  return {
    mode: 'plaster',
    sandVolumeM3: sandVol,
    sandWeightKg: sandVol * SAND_DENSITY,
    cementBags,
  }
}

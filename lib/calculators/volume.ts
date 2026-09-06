// lib/calculators/volume.ts

import { validatePositiveNumber } from './validation'

export type VolumeShape =
  | 'rectangular-prism'
  | 'cylinder'
  | 'cone'
  | 'trapezoidal-prism'

export type LengthUnit = 'metres' | 'feet'

export interface VolumeResult {
  volumeM3: number
  volumeFt3: number
  volumeLitres: number
  formula: string
}

const FT_TO_M = 0.3048
const M3_TO_FT3 = 1 / (FT_TO_M ** 3)
const M3_TO_L = 1000

function toM(v: number, unit: LengthUnit) {
  return unit === 'feet' ? v * FT_TO_M : v
}

function fmt(n: number) {
  return parseFloat(n.toFixed(4)).toString()
}

export function calcVolRectangularPrism(
  length: number,
  width: number,
  depth: number,
  unit: LengthUnit
): VolumeResult {
  validatePositiveNumber(length, 'Length')
  validatePositiveNumber(width, 'Width')
  validatePositiveNumber(depth, 'Depth')
  const L = toM(length, unit)
  const W = toM(width, unit)
  const D = toM(depth, unit)
  const v = L * W * D
  return result(v, `V = L × W × D = ${fmt(L)} m × ${fmt(W)} m × ${fmt(D)} m = ${fmt(v)} m³`)
}

export function calcVolCylinder(
  diameter: number,
  height: number,
  unit: LengthUnit
): VolumeResult {
  validatePositiveNumber(diameter, 'Diameter')
  validatePositiveNumber(height, 'Height')
  const r = toM(diameter, unit) / 2
  const H = toM(height, unit)
  const v = Math.PI * r * r * H
  return result(v, `V = π × r² × H = π × (${fmt(r)} m)² × ${fmt(H)} m = ${fmt(v)} m³`)
}

export function calcVolCone(
  diameter: number,
  height: number,
  unit: LengthUnit
): VolumeResult {
  validatePositiveNumber(diameter, 'Diameter')
  validatePositiveNumber(height, 'Height')
  const r = toM(diameter, unit) / 2
  const H = toM(height, unit)
  const v = (1 / 3) * Math.PI * r * r * H
  return result(v, `V = ⅓ × π × r² × H = ⅓ × π × (${fmt(r)} m)² × ${fmt(H)} m = ${fmt(v)} m³`)
}

export function calcVolTrapezoidalPrism(
  bottomWidth: number,
  topWidth: number,
  height: number,
  length: number,
  unit: LengthUnit
): VolumeResult {
  validatePositiveNumber(bottomWidth, 'Bottom width')
  validatePositiveNumber(topWidth, 'Top width')
  validatePositiveNumber(height, 'Height')
  validatePositiveNumber(length, 'Length')
  const B = toM(bottomWidth, unit)
  const T = toM(topWidth, unit)
  const H = toM(height, unit)
  const L = toM(length, unit)
  const v = 0.5 * (B + T) * H * L
  return result(
    v,
    `V = ½ × (B + T) × H × L = ½ × (${fmt(B)} m + ${fmt(T)} m) × ${fmt(H)} m × ${fmt(L)} m = ${fmt(v)} m³`
  )
}

function result(volumeM3: number, formula: string): VolumeResult {
  return {
    volumeM3,
    volumeFt3: volumeM3 * M3_TO_FT3,
    volumeLitres: volumeM3 * M3_TO_L,
    formula,
  }
}

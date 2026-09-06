// lib/calculators/area.ts
// Pure calculation functions — no JSX, no side effects.

import { validatePositiveNumber } from './validation'

export type AreaShape = 'rectangle' | 'circle' | 'triangle' | 'trapezoid'
export type LengthUnit = 'metres' | 'feet'

export interface AreaInputRectangle {
  shape: 'rectangle'
  length: number
  width: number
  unit: LengthUnit
}
export interface AreaInputCircle {
  shape: 'circle'
  radiusOrDiameter: 'radius' | 'diameter'
  value: number
  unit: LengthUnit
}
export interface AreaInputTriangle {
  shape: 'triangle'
  base: number
  height: number
  unit: LengthUnit
}
export interface AreaInputTrapezoid {
  shape: 'trapezoid'
  sideA: number
  sideB: number
  height: number
  unit: LengthUnit
}

export type AreaInput =
  | AreaInputRectangle
  | AreaInputCircle
  | AreaInputTriangle
  | AreaInputTrapezoid

export interface AreaResult {
  areaSqM: number
  areaSqFt: number
  formula: string
}

const FT_TO_M = 0.3048
const M2_TO_FT2 = 1 / (FT_TO_M * FT_TO_M)

function toMetres(value: number, unit: LengthUnit): number {
  return unit === 'feet' ? value * FT_TO_M : value
}

export function calculateArea(input: AreaInput): AreaResult {
  let areaSqM = 0
  let formula = ''

  switch (input.shape) {
    case 'rectangle': {
      validatePositiveNumber(input.length, 'Length')
      validatePositiveNumber(input.width, 'Width')
      const L = toMetres(input.length, input.unit)
      const W = toMetres(input.width, input.unit)
      areaSqM = L * W
      formula = `Area = Length × Width = ${fmt(L)} m × ${fmt(W)} m = ${fmt(areaSqM)} m²`
      break
    }
    case 'circle': {
      const label = input.radiusOrDiameter === 'radius' ? 'Radius' : 'Diameter'
      validatePositiveNumber(input.value, label)
      const r =
        input.radiusOrDiameter === 'radius'
          ? toMetres(input.value, input.unit)
          : toMetres(input.value, input.unit) / 2
      areaSqM = Math.PI * r * r
      formula = `Area = π × r² = π × (${fmt(r)} m)² = ${fmt(areaSqM)} m²`
      break
    }
    case 'triangle': {
      validatePositiveNumber(input.base, 'Base')
      validatePositiveNumber(input.height, 'Height')
      const B = toMetres(input.base, input.unit)
      const H = toMetres(input.height, input.unit)
      areaSqM = 0.5 * B * H
      formula = `Area = ½ × Base × Height = ½ × ${fmt(B)} m × ${fmt(H)} m = ${fmt(areaSqM)} m²`
      break
    }
    case 'trapezoid': {
      validatePositiveNumber(input.sideA, 'Side A')
      validatePositiveNumber(input.sideB, 'Side B')
      validatePositiveNumber(input.height, 'Height')
      const A = toMetres(input.sideA, input.unit)
      const B = toMetres(input.sideB, input.unit)
      const H = toMetres(input.height, input.unit)
      areaSqM = 0.5 * (A + B) * H
      formula = `Area = ½ × (a + b) × h = ½ × (${fmt(A)} m + ${fmt(B)} m) × ${fmt(H)} m = ${fmt(areaSqM)} m²`
      break
    }
  }

  return {
    areaSqM,
    areaSqFt: areaSqM * M2_TO_FT2,
    formula,
  }
}

function fmt(n: number): string {
  return parseFloat(n.toFixed(4)).toString()
}

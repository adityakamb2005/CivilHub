// lib/calculators/brick.ts

import {
  CalculatorValidationError,
  validateNonNegativeNumber,
  validatePositiveNumber,
} from './validation'

export type LengthUnit = 'metres' | 'feet'

const FT_TO_M = 0.3048

function toM(v: number, unit: LengthUnit) {
  return unit === 'feet' ? v * FT_TO_M : v
}

export interface BrickSize {
  lengthMm: number
  widthMm: number
  heightMm: number
}

// Standard presets
export const BRICK_PRESETS: Record<string, BrickSize> = {
  'Standard Brick (190×90×90 mm)': { lengthMm: 190, widthMm: 90, heightMm: 90 },
  'Hollow Block (400×200×200 mm)': { lengthMm: 400, widthMm: 200, heightMm: 200 },
}

export interface Opening {
  widthM: number
  heightM: number
}

export interface BrickInput {
  wallLengthM: number
  wallHeightM: number
  wallThicknessMm: number
  brick: BrickSize
  mortarJointMm: number
  wastagePercent: number
  openings: Opening[]
}

export interface BrickResult {
  netWallAreaM2: number
  bricksRequired: number
  mortarVolumeM3: number
}

export function calculateBricks(input: BrickInput): BrickResult {
  if (!input || typeof input !== 'object') {
    throw new CalculatorValidationError('Brick calculator input is required.', 'Input')
  }

  const { wallLengthM, wallHeightM, wallThicknessMm, brick, mortarJointMm, wastagePercent, openings } = input

  validatePositiveNumber(wallLengthM, 'Wall length')
  validatePositiveNumber(wallHeightM, 'Wall height')
  validatePositiveNumber(wallThicknessMm, 'Wall thickness')
  validateBrickSize(brick)
  validateNonNegativeNumber(mortarJointMm, 'Mortar joint')
  validateNonNegativeNumber(wastagePercent, 'Wastage')

  if (!Array.isArray(openings)) {
    throw new CalculatorValidationError('Openings must be an array.', 'Openings')
  }

  const grossAreaM2 = wallLengthM * wallHeightM
  assertFiniteCalculation(grossAreaM2, 'Wall area')

  const openingAreaM2 = openings.reduce((sum, opening, index) => {
    if (!opening || typeof opening !== 'object') {
      throw new CalculatorValidationError(
        `Opening ${index + 1} must have a width and height.`,
        `Opening ${index + 1}`
      )
    }

    validateNonNegativeNumber(opening.widthM, `Opening ${index + 1} width`)
    validateNonNegativeNumber(opening.heightM, `Opening ${index + 1} height`)
    const areaM2 = opening.widthM * opening.heightM
    assertFiniteCalculation(areaM2, `Opening ${index + 1} area`)

    const totalAreaM2 = sum + areaM2
    assertFiniteCalculation(totalAreaM2, 'Total opening area')
    return totalAreaM2
  }, 0)

  if (openingAreaM2 > grossAreaM2) {
    throw new CalculatorValidationError(
      'Total opening area cannot exceed wall area.',
      'Openings'
    )
  }

  const netAreaM2 = grossAreaM2 - openingAreaM2
  const thicknessM = wallThicknessMm / 1000
  const netVolM3 = netAreaM2 * thicknessM
  assertFiniteCalculation(netVolM3, 'Net wall volume')

  // Mortar joints occur across the brick face (length × height). Wall thickness
  // determines the number of brick widths, so adding a joint to brick width would
  // count a joint through the wall thickness without information that one exists.
  const brickFaceModuleM2 =
    ((brick.lengthMm + mortarJointMm) / 1000) *
    ((brick.heightMm + mortarJointMm) / 1000)
  assertFiniteCalculation(brickFaceModuleM2, 'Brick face module')

  const rawBricks =
    (netAreaM2 / brickFaceModuleM2) * (wallThicknessMm / brick.widthMm)
  assertFiniteCalculation(rawBricks, 'Brick quantity')

  // Wastage increases the purchase quantity only; it is not additional mortar.
  const bricksWithWastage = rawBricks * (1 + wastagePercent / 100)
  assertFiniteCalculation(bricksWithWastage, 'Brick quantity with wastage')
  const bricksRequired = Math.ceil(bricksWithWastage)

  const pureBrickVolM3 =
    (brick.lengthMm / 1000) * (brick.widthMm / 1000) * (brick.heightMm / 1000)
  const brickVolumeM3 = rawBricks * pureBrickVolM3
  assertFiniteCalculation(brickVolumeM3, 'Brick volume')
  const mortarVolumeM3 = netVolM3 - brickVolumeM3

  // The module calculation makes this non-negative; retain a tiny tolerance for
  // floating-point round-off without concealing invalid input.
  if (mortarVolumeM3 < -Number.EPSILON) {
    throw new CalculatorValidationError(
      'Calculated mortar volume cannot be negative.',
      'Mortar volume'
    )
  }

  return {
    netWallAreaM2: netAreaM2,
    bricksRequired,
    mortarVolumeM3: Math.max(0, mortarVolumeM3),
  }
}

function validateBrickSize(brick: BrickSize): void {
  if (!brick || typeof brick !== 'object') {
    throw new CalculatorValidationError('Brick dimensions are required.', 'Brick')
  }

  validatePositiveNumber(brick.lengthMm, 'Brick length')
  validatePositiveNumber(brick.widthMm, 'Brick width')
  validatePositiveNumber(brick.heightMm, 'Brick height')
}

function assertFiniteCalculation(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new CalculatorValidationError(
      `${fieldName} must be a valid finite number.`,
      fieldName
    )
  }
}

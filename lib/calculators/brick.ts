// lib/calculators/brick.ts

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
  const { wallLengthM, wallHeightM, wallThicknessMm, brick, mortarJointMm, wastagePercent, openings } = input
  const thicknessM = wallThicknessMm / 1000

  // Gross wall volume
  const grossVolM3 = wallLengthM * wallHeightM * thicknessM

  // Subtract openings
  const openingVol = openings.reduce((sum, o) => sum + o.widthM * o.heightM * thicknessM, 0)
  const netVolM3 = Math.max(0, grossVolM3 - openingVol)
  const netAreaM2 = wallLengthM * wallHeightM - openings.reduce((s, o) => s + o.widthM * o.heightM, 0)

  // Brick unit volume including mortar joint
  const jMm = mortarJointMm
  const brickUnitVolM3 =
    ((brick.lengthMm + jMm) / 1000) *
    ((brick.widthMm + jMm) / 1000) *
    ((brick.heightMm + jMm) / 1000)

  const rawBricks = netVolM3 / brickUnitVolM3
  const bricksRequired = Math.ceil(rawBricks * (1 + wastagePercent / 100))

  // Mortar volume = net wall volume - (raw bricks × pure brick volume)
  const pureBrickVolM3 =
    (brick.lengthMm / 1000) * (brick.widthMm / 1000) * (brick.heightMm / 1000)
  const mortarVolumeM3 = Math.max(0, netVolM3 - rawBricks * pureBrickVolM3)

  return {
    netWallAreaM2: Math.max(0, netAreaM2),
    bricksRequired,
    mortarVolumeM3,
  }
}

// lib/calculators/costEstimator.ts

export type ConstructionType = 'economy' | 'standard' | 'premium' | 'luxury'
export type LocationTier = 'tier1' | 'tier2' | 'rural'
export type Currency = 'INR' | 'USD'

// Approved rate table — INR per m²
// Each entry is [low, high]
const RATES_INR: Record<ConstructionType, Record<LocationTier, [number, number]>> = {
  economy:  { tier1: [1500, 1800], tier2: [1200, 1500], rural: [900,  1200] },
  standard: { tier1: [2200, 2800], tier2: [1800, 2200], rural: [1400, 1800] },
  premium:  { tier1: [3500, 4500], tier2: [2800, 3500], rural: [2200, 2800] },
  luxury:   { tier1: [5500, 7500], tier2: [4500, 5500], rural: [3500, 4500] },
}

// Approximate USD conversion (1 USD ≈ 83 INR — update as needed)
const INR_TO_USD = 1 / 83

export interface CostResult {
  lowEstimate: number
  highEstimate: number
  currency: Currency
  ratePerM2Low: number
  ratePerM2High: number
  areaM2: number
}

export function calculateCost(
  areaM2: number,
  type: ConstructionType,
  tier: LocationTier,
  currency: Currency
): CostResult {
  const [rLow, rHigh] = RATES_INR[type][tier]
  const factor = currency === 'USD' ? INR_TO_USD : 1

  return {
    lowEstimate: areaM2 * rLow * factor,
    highEstimate: areaM2 * rHigh * factor,
    currency,
    ratePerM2Low: rLow * factor,
    ratePerM2High: rHigh * factor,
    areaM2,
  }
}

export const CONSTRUCTION_LABELS: Record<ConstructionType, string> = {
  economy:  'Economy',
  standard: 'Standard',
  premium:  'Premium',
  luxury:   'Luxury',
}

export const TIER_LABELS: Record<LocationTier, string> = {
  tier1: 'Tier 1 City',
  tier2: 'Tier 2 City',
  rural: 'Rural',
}

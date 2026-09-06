// lib/calculators/unitConverter.ts

import { validateFiniteNumber } from './validation'

export type UnitCategory =
  | 'length'
  | 'area'
  | 'volume'
  | 'mass'
  | 'pressure'
  | 'force'

export interface UnitDef {
  label: string
  symbol: string
  toBase: number   // multiply by this to get base SI unit
}

// Base units: m, m², m³, kg, Pa, N
export const UNITS: Record<UnitCategory, UnitDef[]> = {
  length: [
    { label: 'Millimetres', symbol: 'mm',   toBase: 0.001 },
    { label: 'Centimetres', symbol: 'cm',   toBase: 0.01 },
    { label: 'Metres',      symbol: 'm',    toBase: 1 },
    { label: 'Kilometres',  symbol: 'km',   toBase: 1000 },
    { label: 'Inches',      symbol: 'in',   toBase: 0.0254 },
    { label: 'Feet',        symbol: 'ft',   toBase: 0.3048 },
    { label: 'Yards',       symbol: 'yd',   toBase: 0.9144 },
    { label: 'Miles',       symbol: 'mi',   toBase: 1609.344 },
  ],
  area: [
    { label: 'Sq. Millimetres', symbol: 'mm²',       toBase: 1e-6 },
    { label: 'Sq. Centimetres', symbol: 'cm²',       toBase: 1e-4 },
    { label: 'Sq. Metres',      symbol: 'm²',        toBase: 1 },
    { label: 'Hectares',        symbol: 'ha',        toBase: 10000 },
    { label: 'Sq. Feet',        symbol: 'ft²',       toBase: 0.092903 },
    { label: 'Sq. Yards',       symbol: 'yd²',       toBase: 0.836127 },
    { label: 'Acres',           symbol: 'ac',        toBase: 4046.86 },
  ],
  volume: [
    { label: 'Cubic Millimetres', symbol: 'mm³', toBase: 1e-9 },
    { label: 'Cubic Centimetres', symbol: 'cm³', toBase: 1e-6 },
    { label: 'Cubic Metres',      symbol: 'm³',  toBase: 1 },
    { label: 'Litres',            symbol: 'L',   toBase: 0.001 },
    { label: 'US Gallons',        symbol: 'gal', toBase: 0.00378541 },
    { label: 'Cubic Feet',        symbol: 'ft³', toBase: 0.0283168 },
    { label: 'Cubic Yards',       symbol: 'yd³', toBase: 0.764555 },
  ],
  mass: [
    { label: 'Grams',         symbol: 'g',   toBase: 0.001 },
    { label: 'Kilograms',     symbol: 'kg',  toBase: 1 },
    { label: 'Tonnes (metric)', symbol: 't', toBase: 1000 },
    { label: 'Pounds',        symbol: 'lb',  toBase: 0.453592 },
    { label: 'US Tons',       symbol: 'ton', toBase: 907.185 },
  ],
  pressure: [
    { label: 'Pascals',      symbol: 'Pa',      toBase: 1 },
    { label: 'Kilopascals',  symbol: 'kPa',     toBase: 1000 },
    { label: 'Megapascals',  symbol: 'MPa',     toBase: 1e6 },
    { label: 'N/mm²',        symbol: 'N/mm²',   toBase: 1e6 },
    { label: 'Bar',          symbol: 'bar',     toBase: 100000 },
    { label: 'PSI',          symbol: 'psi',     toBase: 6894.76 },
    { label: 'kgf/cm²',      symbol: 'kgf/cm²', toBase: 98066.5 },
  ],
  force: [
    { label: 'Newtons',       symbol: 'N',  toBase: 1 },
    { label: 'Kilonewtons',   symbol: 'kN', toBase: 1000 },
    { label: 'Meganewtons',   symbol: 'MN', toBase: 1e6 },
    { label: 'kgf',           symbol: 'kgf',toBase: 9.80665 },
    { label: 'lbf',           symbol: 'lbf',toBase: 4.44822 },
  ],
}

export function convert(
  value: number,
  fromSymbol: string,
  toSymbol: string,
  category: UnitCategory
): number {
  validateFiniteNumber(value, 'Value')
  const units = UNITS[category]
  const from = units.find(u => u.symbol === fromSymbol)
  const to = units.find(u => u.symbol === toSymbol)
  if (!from || !to) return NaN
  return (value * from.toBase) / to.toBase
}

export const CATEGORY_LABELS: Record<UnitCategory, string> = {
  length:   'Length',
  area:     'Area',
  volume:   'Volume',
  mass:     'Mass / Weight',
  pressure: 'Pressure',
  force:    'Force',
}

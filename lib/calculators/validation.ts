// lib/calculators/validation.ts

export class CalculatorValidationError extends Error {
  public readonly fieldName?: string

  constructor(message: string, fieldName?: string) {
    super(message)
    this.name = 'CalculatorValidationError'
    this.fieldName = fieldName
  }
}

/**
 * Validates that a value is a finite number (not NaN or Infinity).
 */
export function validateFiniteNumber(value: number, fieldName = 'Value'): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new CalculatorValidationError(
      `${fieldName} must be a valid finite number.`,
      fieldName
    )
  }
  return value
}

/**
 * Validates that a value is a finite number strictly greater than 0 (> 0).
 */
export function validatePositiveNumber(value: number, fieldName = 'Value'): number {
  validateFiniteNumber(value, fieldName)
  if (value <= 0) {
    throw new CalculatorValidationError(
      `${fieldName} must be greater than zero.`,
      fieldName
    )
  }
  return value
}

/**
 * Validates that a value is a finite number greater than or equal to 0 (>= 0).
 */
export function validateNonNegativeNumber(value: number, fieldName = 'Value'): number {
  validateFiniteNumber(value, fieldName)
  if (value < 0) {
    throw new CalculatorValidationError(
      `${fieldName} cannot be negative.`,
      fieldName
    )
  }
  return value
}

/**
 * Validates that a mix ratio array contains non-negative numbers and has a sum > 0.
 */
export function validateRatioSum(
  ratio: number[],
  fieldName = 'Mix ratio'
): number[] {
  if (!Array.isArray(ratio) || ratio.length === 0) {
    throw new CalculatorValidationError(
      `${fieldName} must be a non-empty array of numbers.`,
      fieldName
    )
  }

  let sum = 0
  for (let i = 0; i < ratio.length; i++) {
    const val = ratio[i]
    validateNonNegativeNumber(val, `${fieldName} component ${i + 1}`)
    sum += val
  }

  if (sum <= 0) {
    throw new CalculatorValidationError(
      `${fieldName} components must sum to a value greater than zero.`,
      fieldName
    )
  }

  return ratio
}

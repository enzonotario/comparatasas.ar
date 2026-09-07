import { describe, expect, it } from 'vitest'
import { isPositiveYieldRate } from './yield-curve'

describe('isPositiveYieldRate', () => {
  it('acepta tasas positivas', () => {
    expect(isPositiveYieldRate(0.24)).toBe(true)
    expect(isPositiveYieldRate(24)).toBe(true)
  })

  it('rechaza cero, negativas y no finitas', () => {
    expect(isPositiveYieldRate(0)).toBe(false)
    expect(isPositiveYieldRate(-0.16)).toBe(false)
    expect(isPositiveYieldRate(null)).toBe(false)
    expect(isPositiveYieldRate(undefined)).toBe(false)
    expect(isPositiveYieldRate(Number.NaN)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { formatPercentAuto } from './fci-fund-formatters'

describe('formatPercentAuto', () => {
  it('formats fee values already in percentage points without scaling', () => {
    expect(formatPercentAuto(0.815)).toBe('0,82%')
    expect(formatPercentAuto(0.085)).toBe('0,09%')
    expect(formatPercentAuto(0.0666)).toBe('0,07%')
  })

  it('formats returns and composition already in percentage points', () => {
    expect(formatPercentAuto(0.0898)).toBe('0,09%')
    expect(formatPercentAuto(2.8484)).toBe('2,85%')
    expect(formatPercentAuto(9.1, 1)).toBe('9,1%')
  })

  it('returns em dash for missing values', () => {
    expect(formatPercentAuto(null)).toBe('—')
    expect(formatPercentAuto(undefined)).toBe('—')
    expect(formatPercentAuto(Number.NaN)).toBe('—')
  })
})

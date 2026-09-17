import { describe, expect, it } from 'vitest'
import {
  formatArsEquivalentHint,
  formatCompactPatrimonio,
  formatCurrency,
  formatDate,
  formatPercentAuto,
  normalizeCurrencyCode,
  toArsPatrimonio,
} from './fci-fund-formatters'

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

describe('normalizeCurrencyCode', () => {
  it('maps CNV peso labels to ARS', () => {
    expect(normalizeCurrencyCode('Peso Argentino')).toBe('ARS')
    expect(normalizeCurrencyCode('PESO ARGENTINO')).toBe('ARS')
    expect(normalizeCurrencyCode('Peso Argentina')).toBe('ARS')
    expect(normalizeCurrencyCode('pesos argentinos')).toBe('ARS')
  })

  it('maps CNV dolar labels and USB typo to USD', () => {
    expect(normalizeCurrencyCode('Dolar Estadounidense')).toBe('USD')
    expect(normalizeCurrencyCode('Dólar Estadounidense Billete')).toBe('USD')
    expect(normalizeCurrencyCode('USB')).toBe('USD')
  })

  it('falls back to ARS for unknown labels', () => {
    expect(normalizeCurrencyCode('EURO')).toBe('ARS')
    expect(normalizeCurrencyCode('')).toBe('ARS')
    expect(normalizeCurrencyCode(null)).toBe('ARS')
  })
})

describe('formatCurrency', () => {
  it('formats peso argentino labels without throwing', () => {
    expect(formatCurrency(1000, 'PESO ARGENTINO')).toMatch(/1\.000/)
  })
})

describe('toArsPatrimonio', () => {
  it('leaves ARS amounts unchanged', () => {
    expect(toArsPatrimonio(1000, 'Peso Argentino', 1400)).toBe(1000)
  })

  it('converts USD with MEP venta rate', () => {
    expect(toArsPatrimonio(2, 'Dolar Estadounidense', 1400)).toBe(2800)
  })

  it('returns null for USD without a valid rate', () => {
    expect(toArsPatrimonio(2, 'USD', null)).toBeNull()
    expect(toArsPatrimonio(2, 'USD', 0)).toBeNull()
  })
})

describe('formatCompactPatrimonio / formatArsEquivalentHint', () => {
  it('adds USD suffix and ARS equivalent hint', () => {
    expect(formatCompactPatrimonio(1_986_500_000, 'USD')).toMatch(/USD$/)
    expect(formatArsEquivalentHint(1_000_000, 'USD', 1400)).toMatch(/ARS/)
    expect(formatArsEquivalentHint(1_000_000, 'ARS', 1400)).toBeNull()
  })
})

describe('formatDate', () => {
  it('formats YYYY-MM-DD as a local calendar date', () => {
    expect(formatDate('2026-08-14')).toBe('14 ago 2026')
  })

  it('returns em dash for missing values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
  })
})

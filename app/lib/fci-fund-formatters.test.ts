import { describe, expect, it } from 'vitest'
import { formatCurrency, formatPercentAuto, normalizeCurrencyCode } from './fci-fund-formatters'

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

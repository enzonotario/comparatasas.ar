import { describe, expect, it } from 'vitest'
import { getComparatasasReturnPercent, getComparatasasTnaAndTea } from './fci-comparatasas-returns'

describe('getComparatasasReturnPercent', () => {
  it('uses unMes for money market when available', () => {
    expect(
      getComparatasasReturnPercent({ unMes: 16.5, ultimos7Dias: 18.4 }, 'Mercado de Dinero'),
    ).toBe(16.5)
  })

  it('falls back to ultimos7Dias for money market when unMes is null', () => {
    expect(
      getComparatasasReturnPercent({ unMes: null, ultimos7Dias: 18.4158 }, 'Mercado de Dinero'),
    ).toBe(18.4158)
  })

  it('does not fall back to ultimos7Dias for non money market funds', () => {
    expect(getComparatasasReturnPercent({ unMes: null, ultimos7Dias: 18.4158 }, 'Renta Fija')).toBe(
      0,
    )
  })
})

describe('getComparatasasTnaAndTea', () => {
  it('uses the monthly return directly as TNA for money market', () => {
    expect(getComparatasasTnaAndTea(16.5, 'Mercado de Dinero')).toEqual({
      tna: 0.165,
      tea: Math.pow(1.165, 12) - 1,
    })
  })

  it('annualizes the monthly return for other fund types', () => {
    const { tna } = getComparatasasTnaAndTea(3, 'Renta Fija')
    expect(tna).toBeCloseTo(0.03 * (365 / 30))
  })
})

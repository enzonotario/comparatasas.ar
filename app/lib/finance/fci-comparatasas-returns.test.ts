import { describe, expect, it } from 'vitest'
import { getComparatasasReturnPercent, getComparatasasTnaAndTea } from './fci-comparatasas-returns'

describe('getComparatasasReturnPercent', () => {
  it('anualiza el 30D para money market (no el diario)', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: 1.5393, ultimos7Dias: 0.3818, variacionDiariaPct: 0.225 },
        'Mercado de Dinero',
      ),
    ).toBeCloseTo((1.5393 * 365) / 30, 4)
  })

  it('no usa la variación diaria si hay unMes (evita TNA ~82% por un día ruidoso)', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: 1.5393, ultimos7Dias: 0.3818, variacionDiariaPct: 0.225 },
        'Mercado de Dinero',
      ),
    ).not.toBeCloseTo(0.225 * 365, 0)
  })

  it('falls back to 7D annualized when unMes is missing', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: null, ultimos7Dias: 0.3818, variacionDiariaPct: 0.225 },
        'Mercado de Dinero',
      ),
    ).toBeCloseTo((0.3818 * 365) / 7, 4)
  })

  it('falls back to daily annualized when 30D and 7D are missing', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: null, ultimos7Dias: null, variacionDiariaPct: 0.05 },
        'Mercado de Dinero',
      ),
    ).toBeCloseTo(18.25, 2)
  })

  it('keeps legacy CAFCI unMes as already-annualized TNA', () => {
    expect(
      getComparatasasReturnPercent({ unMes: 16.5, ultimos7Dias: 18.4 }, 'Mercado de Dinero'),
    ).toBe(16.5)
  })

  it('keeps legacy CAFCI ultimos7Dias as already-annualized TNA', () => {
    expect(
      getComparatasasReturnPercent({ unMes: null, ultimos7Dias: 18.4158 }, 'Mercado de Dinero'),
    ).toBe(18.4158)
  })

  it('uses CNV period unMes for non money market funds', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: -9.849, ultimos7Dias: -1.2, variacionDiariaPct: -1.514 },
        'Renta Variable',
      ),
    ).toBeCloseTo(-9.849, 3)
  })

  it('does not fall back to ultimos7Dias for non money market funds', () => {
    expect(getComparatasasReturnPercent({ unMes: null, ultimos7Dias: 18.4158 }, 'Renta Fija')).toBe(
      0,
    )
  })
})

describe('getComparatasasTnaAndTea', () => {
  it('uses the monthly return directly as TNA for non money market', () => {
    expect(getComparatasasTnaAndTea(16.5)).toEqual({
      tna: 0.165,
      tea: Math.pow(1.165, 12) - 1,
    })
  })

  it('does not linearly annualize the monthly return', () => {
    const { tna, tea } = getComparatasasTnaAndTea(3)
    expect(tna).toBeCloseTo(0.03)
    expect(tea).toBeCloseTo(Math.pow(1.03, 12) - 1)
  })

  it('compounds TEA from annual TNA for money market', () => {
    const tnaPercent = (1.5393 * 365) / 30
    const { tna, tea } = getComparatasasTnaAndTea(tnaPercent, 'Mercado de Dinero')
    expect(tna).toBeCloseTo(tnaPercent / 100, 6)
    expect(tea).toBeCloseTo(Math.pow(1 + tna / 365, 365) - 1, 8)
  })
})

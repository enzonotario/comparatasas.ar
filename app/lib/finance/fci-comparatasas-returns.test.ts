import { describe, expect, it } from 'vitest'
import { getComparatasasReturnPercent, getComparatasasTnaAndTea } from './fci-comparatasas-returns'

describe('getComparatasasReturnPercent', () => {
  it('anualiza la variación diaria para money market', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: 0.602, ultimos7Dias: 0.35, variacionDiariaPct: 0.05 },
        'Mercado de Dinero',
      ),
    ).toBeCloseTo(18.25, 2)
  })

  it('falls back to legacy CAFCI unMes for money market when daily is missing', () => {
    expect(
      getComparatasasReturnPercent({ unMes: 16.5, ultimos7Dias: 18.4 }, 'Mercado de Dinero'),
    ).toBe(16.5)
  })

  it('falls back to ultimos7Dias for money market when unMes is null', () => {
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
  it('uses the monthly return directly as TNA', () => {
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
})

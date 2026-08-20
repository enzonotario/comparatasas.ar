import { describe, expect, it } from 'vitest'
import {
  estimateNominalTnaFromReturnRows,
  getComparatasasReturnPercent,
  getComparatasasTnaAndTea,
  getNominalTnaEstimateFromRendimientos,
} from './fci-comparatasas-returns'

describe('estimateNominalTnaFromReturnRows', () => {
  it('builds a 30D nominal TNA formula from return rows', () => {
    expect(
      estimateNominalTnaFromReturnRows([
        { period: '1D', value: 0.225, effectiveDays: 1 },
        { period: '30D', value: 1.5393, effectiveDays: 30 },
      ]),
    ).toEqual({
      value: (1.5393 * 365) / 30,
      period: '30D',
      days: 30,
      formula: 'Nominal 30D: r30D × 365/30',
    })
  })

  it('uses effective days from the detail rows when present', () => {
    expect(
      estimateNominalTnaFromReturnRows([{ period: '30D', value: 1.5872, effectiveDays: 29 }]),
    ).toEqual({
      value: (1.5872 * 365) / 29,
      period: '30D',
      days: 29,
      formula: 'Nominal 30D: r30D × 365/29',
    })
  })
})

describe('getNominalTnaEstimateFromRendimientos', () => {
  it('anualiza el 30D con días fijos cuando no hay histórico', () => {
    expect(
      getNominalTnaEstimateFromRendimientos({
        unMes: 1.5872,
        ultimos7Dias: 0.3954,
        variacionDiariaPct: 0.23,
      }),
    ).toEqual({
      value: (1.5872 * 365) / 30,
      period: '30D',
      days: 30,
      formula: 'Nominal 30D: r30D × 365/30',
    })
  })
})

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

  it('anualiza el 30D para renta mixta y demás tipos', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: 1.5872, ultimos7Dias: 0.3954, variacionDiariaPct: 0.23 },
        'Renta Mixta',
      ),
    ).toBeCloseTo((1.5872 * 365) / 30, 4)
  })

  it('keeps legacy CAFCI values for renta variable', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: -9.849, ultimos7Dias: -1.2, variacionDiariaPct: -1.514 },
        'Renta Variable',
      ),
    ).toBeCloseTo(-9.849, 3)
  })

  it('falls back to 7D for non money market funds when 30D is missing', () => {
    expect(
      getComparatasasReturnPercent({ unMes: null, ultimos7Dias: 0.3818 }, 'Renta Fija'),
    ).toBeCloseTo((0.3818 * 365) / 7, 4)
  })
})

describe('getComparatasasTnaAndTea', () => {
  it('compounds TEA from annual nominal TNA for all fund types', () => {
    expect(getComparatasasTnaAndTea(16.5, 'Renta Mixta')).toEqual({
      tna: 0.165,
      tea: Math.pow(1 + 0.165 / 365, 365) - 1,
    })
  })

  it('compounds TEA from annual TNA for money market', () => {
    const tnaPercent = (1.5393 * 365) / 30
    const { tna, tea } = getComparatasasTnaAndTea(tnaPercent, 'Mercado de Dinero')
    expect(tna).toBeCloseTo(tnaPercent / 100, 6)
    expect(tea).toBeCloseTo(Math.pow(1 + tna / 365, 365) - 1, 8)
  })
})

import { describe, expect, it } from 'vitest'
import {
  estimateNominalTnaFromReturnRows,
  getComparatasasReturnPercent,
  getComparatasasTnaAndTea,
  getNominalTnaEstimateFromRendimientos,
} from './fci-comparatasas-returns'

describe('estimateNominalTnaFromReturnRows', () => {
  it('builds a 7D nominal TNA formula from return rows (ignora 30D)', () => {
    expect(
      estimateNominalTnaFromReturnRows([
        { period: '1D', value: 0.225, effectiveDays: 1 },
        { period: '7D', value: 0.3818, effectiveDays: 7 },
        { period: '30D', value: 1.5393, effectiveDays: 30 },
      ]),
    ).toEqual({
      value: (0.3818 * 365) / 7,
      period: '7D',
      days: 7,
      formula: 'Nominal 7D: r7D × 365/7',
    })
  })

  it('uses effective days from the detail rows when present', () => {
    expect(
      estimateNominalTnaFromReturnRows([{ period: '7D', value: 0.3954, effectiveDays: 6 }]),
    ).toEqual({
      value: (0.3954 * 365) / 6,
      period: '7D',
      days: 6,
      formula: 'Nominal 7D: r7D × 365/6',
    })
  })
})

describe('getNominalTnaEstimateFromRendimientos', () => {
  it('anualiza el 7D aunque haya unMes (Com. A 8497)', () => {
    expect(
      getNominalTnaEstimateFromRendimientos({
        unMes: 1.5872,
        ultimos7Dias: 0.3954,
        variacionDiariaPct: 0.23,
      }),
    ).toEqual({
      value: (0.3954 * 365) / 7,
      period: '7D',
      days: 7,
      formula: 'Nominal 7D: r7D × 365/7',
    })
  })

  it('usa diasUltimos7Dias de la API cuando viene informado', () => {
    expect(
      getNominalTnaEstimateFromRendimientos({
        unMes: 1.5872,
        diasUnMes: 29,
        ultimos7Dias: 0.3954,
        diasUltimos7Dias: 6,
        variacionDiariaPct: 0.23,
      }),
    ).toEqual({
      value: (0.3954 * 365) / 6,
      period: '7D',
      days: 6,
      formula: 'Nominal 7D: r7D × 365/6',
    })
  })
})

describe('getComparatasasReturnPercent', () => {
  it('anualiza el 7D para money market (no el 30D ni el diario)', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: 1.5393, ultimos7Dias: 0.3818, variacionDiariaPct: 0.225 },
        'Mercado de Dinero',
      ),
    ).toBeCloseTo((0.3818 * 365) / 7, 4)
  })

  it('no usa la variación diaria si hay 7D (evita TNA ~82% por un día ruidoso)', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: 1.5393, ultimos7Dias: 0.3818, variacionDiariaPct: 0.225 },
        'Mercado de Dinero',
      ),
    ).not.toBeCloseTo(0.225 * 365, 0)
  })

  it('falls back to daily annualized when 7D is missing (ignora unMes)', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: 1.5393, ultimos7Dias: null, variacionDiariaPct: 0.05 },
        'Mercado de Dinero',
      ),
    ).toBeCloseTo(18.25, 2)
  })

  it('falls back to daily annualized when 7D is missing', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: null, ultimos7Dias: null, variacionDiariaPct: 0.05 },
        'Mercado de Dinero',
      ),
    ).toBeCloseTo(18.25, 2)
  })

  it('keeps legacy CAFCI ultimos7Dias as already-annualized TNA', () => {
    expect(
      getComparatasasReturnPercent({ unMes: 16.5, ultimos7Dias: 18.4158 }, 'Mercado de Dinero'),
    ).toBe(18.4158)
  })

  it('keeps legacy CAFCI ultimos7Dias alone as already-annualized TNA', () => {
    expect(
      getComparatasasReturnPercent({ unMes: null, ultimos7Dias: 18.4158 }, 'Mercado de Dinero'),
    ).toBe(18.4158)
  })

  it('anualiza el 7D para renta mixta y demás tipos', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: 1.5872, ultimos7Dias: 0.3954, variacionDiariaPct: 0.23 },
        'Renta Mixta',
      ),
    ).toBeCloseTo((0.3954 * 365) / 7, 4)
  })

  it('keeps legacy CAFCI 7D values for renta variable', () => {
    expect(
      getComparatasasReturnPercent(
        { unMes: -9.849, ultimos7Dias: -18.4, variacionDiariaPct: -1.514 },
        'Renta Variable',
      ),
    ).toBeCloseTo(-18.4, 3)
  })

  it('anualiza 7D de período para non money market funds', () => {
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
    const tnaPercent = (0.3818 * 365) / 7
    const { tna, tea } = getComparatasasTnaAndTea(tnaPercent, 'Mercado de Dinero')
    expect(tna).toBeCloseTo(tnaPercent / 100, 6)
    expect(tea).toBeCloseTo(Math.pow(1 + tna / 365, 365) - 1, 8)
  })
})

import { describe, expect, it } from 'vitest'
import type { FciFundHistoryItem } from '../composables/useFciFundDetails'
import {
  filterFundHistoryByPeriod,
  fundHistoryPeriodLabel,
  getFundHistoryPeriodCutoff,
} from './funds-detail'
import { prepareFciCompareChartSeries } from './fci-fund-compare-chart'

describe('filterFundHistoryByPeriod', () => {
  const points = [
    { fecha: '2025-12-01' },
    { fecha: '2026-01-15' },
    { fecha: '2026-06-01' },
    { fecha: '2026-09-01' },
  ]

  it('returns all points for all', () => {
    expect(filterFundHistoryByPeriod(points, 'all')).toEqual(points)
  })

  it('filters ytd from Jan 1 of latest year', () => {
    expect(filterFundHistoryByPeriod(points, 'ytd').map((p) => p.fecha)).toEqual([
      '2026-01-15',
      '2026-06-01',
      '2026-09-01',
    ])
  })

  it('filters last 3 months from latest point', () => {
    expect(filterFundHistoryByPeriod(points, '3m').map((p) => p.fecha)).toEqual([
      '2026-06-01',
      '2026-09-01',
    ])
  })

  it('builds cutoff for 1y', () => {
    const latest = new Date(2026, 8, 1)
    const cutoff = getFundHistoryPeriodCutoff(latest, '1y')
    expect(cutoff?.getFullYear()).toBe(2025)
    expect(cutoff?.getMonth()).toBe(8)
  })

  it('labels periods in Spanish', () => {
    expect(fundHistoryPeriodLabel('1y')).toBe('último año')
  })
})

describe('prepareFciCompareChartSeries', () => {
  function point(fecha: string, valorCuotaparte: number, patrimonio: number): FciFundHistoryItem {
    return {
      slug: 'test',
      fondoId: null,
      claseId: null,
      nombre: 'Test',
      fecha,
      categoria: null,
      categoriaKey: null,
      horizonte: null,
      valorCuotaparte,
      patrimonio,
      retornoDiario: null,
      retornoAcumulado: null,
      flujoEstimado: null,
      origen: 'test',
    }
  }

  it('indexes VCP to base 100 and returns period return', () => {
    const prepared = prepareFciCompareChartSeries(
      [
        {
          key: 'a',
          label: 'Fondo A',
          color: '#000',
          points: [
            point('2026-01-01', 100, 1000),
            point('2026-02-01', 110, 1100),
            point('2026-03-01', 121, 1200),
          ],
        },
      ],
      'all',
      'vcp',
    )

    expect(prepared[0]?.points[0]?.value).toBe(100)
    expect(prepared[0]?.points[2]?.value).toBe(121)
    expect(prepared[0]?.latestValue).toBe(121)
  })

  it('recomputes cumulative return inside the window', () => {
    const prepared = prepareFciCompareChartSeries(
      [
        {
          key: 'a',
          label: 'Fondo A',
          color: '#000',
          points: [
            point('2026-01-01', 100, 1000),
            point('2026-06-01', 110, 1100),
            point('2026-09-01', 121, 1200),
          ],
        },
      ],
      '3m',
      'retorno',
    )

    // Window starts at 2026-06-01 → return from 110 to 121 ≈ 10%
    expect(prepared[0]?.points[0]?.value).toBe(0)
    expect(prepared[0]?.latestValue).toBeCloseTo(10, 1)
  })
})

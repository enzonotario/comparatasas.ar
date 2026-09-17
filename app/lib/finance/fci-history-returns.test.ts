import { describe, expect, it } from 'vitest'
import {
  computeRendimientosFromHistory,
  filterPlausibleHistoryPoints,
  periodReturnPercent,
  recomputeHistoryReturns,
  sanitizePeriodReturnPercent,
} from './fci-history-returns'

describe('sanitizePeriodReturnPercent', () => {
  it('drops absurd persisted returns', () => {
    expect(sanitizePeriodReturnPercent(1233482.2167)).toBeNull()
    expect(sanitizePeriodReturnPercent(-217.8022)).toBeNull()
    expect(sanitizePeriodReturnPercent(-9.849)).toBeCloseTo(-9.849)
    expect(sanitizePeriodReturnPercent(26.535)).toBeCloseTo(26.535)
  })
})

describe('filterPlausibleHistoryPoints', () => {
  it('drops VCP=1 seeds when latest VCP is ~1000', () => {
    const cleaned = filterPlausibleHistoryPoints([
      { fecha: '2026-07-13', valorCuotaparte: 1 },
      { fecha: '2026-07-15', valorCuotaparte: 1001.981 },
      { fecha: '2026-08-12', valorCuotaparte: 1014.821 },
    ])

    expect(cleaned.map((item) => item.fecha)).toEqual(['2026-07-15', '2026-08-12'])
  })
})

describe('computeRendimientosFromHistory', () => {
  it('computes rolling period returns from VCP', () => {
    const rendimientos = computeRendimientosFromHistory({
      fecha: '2026-08-14',
      valorCuotaparte: 104992.455,
      history: [
        { fecha: '2025-08-14', valorCuotaparte: 81290 },
        { fecha: '2025-12-30', valorCuotaparte: 92280 },
        { fecha: '2026-05-21', valorCuotaparte: 100870 },
        { fecha: '2026-07-15', valorCuotaparte: 103479 },
        { fecha: '2026-08-07', valorCuotaparte: 104617 },
        { fecha: '2026-08-13', valorCuotaparte: 104930.7 },
        { fecha: '2026-08-14', valorCuotaparte: 104992.455 },
      ],
    })

    expect(rendimientos.ultimos7Dias).toBeCloseTo(periodReturnPercent(104992.455, 104617)!, 3)
    expect(rendimientos.unMes).toBeCloseTo(periodReturnPercent(104992.455, 103479)!, 3)
    expect(rendimientos.noventaDias).toBeCloseTo(periodReturnPercent(104992.455, 100870)!, 3)
    expect(rendimientos.enElAnio).toBeCloseTo(periodReturnPercent(104992.455, 92280)!, 3)
    expect(rendimientos.doceMeses).toBeCloseTo(periodReturnPercent(104992.455, 81290)!, 3)
    expect(rendimientos.thirtyDays).toBe(30)
  })

  it('falls back to CNV columns when history cannot resolve the window', () => {
    const rendimientos = computeRendimientosFromHistory({
      fecha: '2026-08-14',
      valorCuotaparte: 250943.119,
      variacionUnMesPct: -9.849,
      variacionEnElAnioPct: -6.474,
      variacionDoceMesesPct: 26.535,
      history: [{ fecha: '2026-08-07', valorCuotaparte: 255000 }],
    })

    // Solo hay ~7 días de historia: 30D/YTD/1Y caen al fallback CNV.
    expect(rendimientos.ultimos7Dias).toBeCloseTo(periodReturnPercent(250943.119, 255000)!, 3)
    expect(rendimientos.unMes).toBeCloseTo(-9.849, 3)
    expect(rendimientos.enElAnio).toBeCloseTo(-6.474, 3)
    expect(rendimientos.doceMeses).toBeCloseTo(26.535, 3)
  })

  it('uses period returns from VCP when CNV columns are missing', () => {
    const rendimientos = computeRendimientosFromHistory({
      fecha: '2026-08-12',
      valorCuotaparte: 1014.821,
      history: [
        { fecha: '2026-07-01', valorCuotaparte: 1 },
        { fecha: '2026-07-13', valorCuotaparte: 1 },
        { fecha: '2026-07-15', valorCuotaparte: 1001.981 },
        { fecha: '2026-08-05', valorCuotaparte: 1009.672 },
      ],
    })

    expect(rendimientos.ultimos7Dias).toBeCloseTo(periodReturnPercent(1014.821, 1009.672)!, 3)
    expect(rendimientos.unMes).toBeCloseTo(periodReturnPercent(1014.821, 1001.981)!, 3)
    expect(rendimientos.thirtyDays).toBe(28)
  })
})

describe('recomputeHistoryReturns', () => {
  it('recomputes daily/cumulative returns from the first real VCP', () => {
    const rows = recomputeHistoryReturns([
      { fecha: '2026-07-13', valorCuotaparte: 1 },
      { fecha: '2026-07-15', valorCuotaparte: 1001.981 },
      { fecha: '2026-08-12', valorCuotaparte: 1014.821 },
    ])

    expect(rows).toHaveLength(2)
    expect(rows[0].retornoAcumulado).toBe(0)
    expect(rows[1].retornoAcumulado).toBeCloseTo(((1014.821 - 1001.981) / 1001.981) * 100, 4)
  })
})

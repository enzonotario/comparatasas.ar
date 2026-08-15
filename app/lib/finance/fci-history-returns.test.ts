import { describe, expect, it } from 'vitest'
import {
  annualizeReturnPercent,
  computeRendimientosFromHistory,
  filterPlausibleHistoryPoints,
  recomputeHistoryReturns,
  sanitizeAnnualizedReturnPercent,
} from './fci-history-returns'

describe('sanitizeAnnualizedReturnPercent', () => {
  it('drops absurd persisted returns', () => {
    expect(sanitizeAnnualizedReturnPercent(1233482.2167)).toBeNull()
    expect(sanitizeAnnualizedReturnPercent(26.5912)).toBeCloseTo(26.5912)
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
  it('ignores VCP=1 seeds for 30D and keeps a plausible TNA', () => {
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

    expect(rendimientos.ultimos7Dias).toBeCloseTo(26.5912, 0)
    expect(rendimientos.unMes).toBeCloseTo(annualizeReturnPercent(1014.821, 1001.981, 28)!, 3)
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

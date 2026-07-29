import { describe, expect, it } from 'vitest'
import {
  buildUvaDolarPoderCompraSeries,
  formatUvaDolarRatio,
  resolveDatedValueAtOrBefore,
} from './uva-dolar-poder-compra'

describe('resolveDatedValueAtOrBefore', () => {
  const sorted = [
    { fecha: '2024-01-01', valor: 100 },
    { fecha: '2024-01-05', valor: 110 },
    { fecha: '2024-01-10', valor: 120 },
  ]

  it('returns exact match', () => {
    expect(resolveDatedValueAtOrBefore(sorted, '2024-01-05')).toBe(110)
  })

  it('returns last value on or before target', () => {
    expect(resolveDatedValueAtOrBefore(sorted, '2024-01-07')).toBe(110)
  })

  it('returns null if target is before first date', () => {
    expect(resolveDatedValueAtOrBefore(sorted, '2023-12-01')).toBeNull()
  })
})

describe('buildUvaDolarPoderCompraSeries', () => {
  it('computes UVAs per dollar as dolar/uva and historical average', () => {
    const series = buildUvaDolarPoderCompraSeries(
      [
        { fecha: '2024-01-01', valor: 100 },
        { fecha: '2024-01-02', valor: 200 },
        { fecha: '2024-01-03', valor: 100 },
      ],
      [
        { fecha: '2024-01-01', valor: 100 },
        { fecha: '2024-01-02', valor: 200 },
        { fecha: '2024-01-03', valor: 50 },
      ],
    )

    expect(series.points.map((p) => p.ratio)).toEqual([1, 1, 0.5])
    expect(series.promedioHistorico).toBeCloseTo((1 + 1 + 0.5) / 3, 10)
    expect(series.maximo?.fecha).toBe('2024-01-01')
    expect(series.ultimo?.ratio).toBe(0.5)
    expect(series.senal).toBe('endeudarse')
  })

  it('forward-fills missing dollar dates', () => {
    const series = buildUvaDolarPoderCompraSeries(
      [
        { fecha: '2024-01-01', valor: 100 },
        { fecha: '2024-01-02', valor: 100 },
      ],
      [{ fecha: '2024-01-01', valor: 150 }],
    )

    expect(series.points).toHaveLength(2)
    expect(series.points[1]?.dolarVenta).toBe(150)
    expect(series.points[1]?.ratio).toBe(1.5)
  })

  it('marks cancelar when last ratio is clearly above average', () => {
    const series = buildUvaDolarPoderCompraSeries(
      [
        { fecha: '2024-01-01', valor: 100 },
        { fecha: '2024-01-02', valor: 100 },
        { fecha: '2024-01-03', valor: 50 },
      ],
      [
        { fecha: '2024-01-01', valor: 100 },
        { fecha: '2024-01-02', valor: 100 },
        { fecha: '2024-01-03', valor: 200 },
      ],
    )

    expect(series.senal).toBe('cancelar')
    expect(series.ultimo?.ratio).toBe(4)
  })

  it('returns empty series when inputs lack overlap', () => {
    const series = buildUvaDolarPoderCompraSeries(
      [{ fecha: '2024-01-01', valor: 100 }],
      [{ fecha: '2025-01-01', valor: 100 }],
    )
    expect(series.points).toEqual([])
    expect(series.senal).toBe('neutro')
  })
})

describe('formatUvaDolarRatio', () => {
  it('formats with es-AR decimals', () => {
    expect(formatUvaDolarRatio(1.07)).toBe('1,07')
    expect(formatUvaDolarRatio(0.74)).toBe('0,74')
  })
})

import { describe, it, expect } from 'vitest'
import {
  resolveUvaValueAtOrBefore,
  subtractCalendarDaysYmd,
  addCalendarDaysYmd,
  calendarDaysBetweenUtc,
  sortUvaByDateAsc,
  factorInteresAdicionalCompuestoDiario,
  factorTotalContrafactualUva,
  factorInteresSimpleAnual,
  tnaNominalAnualDesdeFactorPeriodo,
  buildPrecancelableUvaTimelineSeries,
  montoVencimientoUva,
  montoPrecancelacionSimple,
  montoPrecancelacionCotejadoBajoVencimiento,
  UVA_HISTORY_DAYS_PER_YEAR,
} from './plazo-fijo-uva-pago-periodico'

describe('resolveUvaValueAtOrBefore', () => {
  const sorted = [
    { fecha: '2024-01-01', valor: 100 },
    { fecha: '2024-01-05', valor: 110 },
    { fecha: '2024-01-10', valor: 120 },
  ]

  it('returns exact match', () => {
    expect(resolveUvaValueAtOrBefore(sorted, '2024-01-05')).toBe(110)
  })

  it('returns last value on or before target', () => {
    expect(resolveUvaValueAtOrBefore(sorted, '2024-01-07')).toBe(110)
  })

  it('returns null if target is before first date', () => {
    expect(resolveUvaValueAtOrBefore(sorted, '2023-12-01')).toBeNull()
  })
})

describe('subtractCalendarDaysYmd / addCalendarDaysYmd / calendarDaysBetweenUtc', () => {
  it('subtracts calendar days in UTC-safe way', () => {
    expect(subtractCalendarDaysYmd('2024-03-10', 9)).toBe('2024-03-01')
  })

  it('adds calendar days', () => {
    expect(addCalendarDaysYmd('2025-01-01', 30)).toBe('2025-01-31')
  })

  it('counts days between', () => {
    expect(calendarDaysBetweenUtc('2025-01-01', '2025-01-01')).toBe(0)
    expect(calendarDaysBetweenUtc('2025-01-01', '2025-01-31')).toBe(30)
  })
})

describe('factorInteresAdicionalCompuestoDiario', () => {
  it('matches simulator convention (365, compound)', () => {
    const tna = 0.1
    const d = 30
    const expected = Math.pow(1 + tna / UVA_HISTORY_DAYS_PER_YEAR, d)
    expect(factorInteresAdicionalCompuestoDiario(tna, d)).toBeCloseTo(expected, 10)
  })
})

describe('montoVencimientoUva / montoPrecancelacionSimple', () => {
  it('matches reference-style simple TNA precancelación (30 días, 30% TNA, $1000)', () => {
    const p = 1000
    const tnaPrec = 0.3
    const d = 30
    const expected = p + (p * tnaPrec * d) / 365
    expect(montoPrecancelacionSimple(p, d, tnaPrec)).toBeCloseTo(expected, 2)
    expect(montoPrecancelacionSimple(p, d, tnaPrec)).toBeCloseTo(1024.66, 1)
  })

  it('UVA path day 0 equals capital', () => {
    const uva = 1301.85
    expect(montoVencimientoUva(1000, uva, uva, 0, 0.01)).toBeCloseTo(1000, 5)
  })
})

describe('buildPrecancelableUvaTimelineSeries', () => {
  it('produces one point per day from start to end', () => {
    const rows = sortUvaByDateAsc([
      { fecha: '2025-01-01', valor: 1301.85 },
      { fecha: '2025-01-02', valor: 1305 },
      { fecha: '2025-01-03', valor: 1310 },
    ])
    const pts = buildPrecancelableUvaTimelineSeries({
      uvaSortedAsc: rows,
      montoInicial: 1000,
      fechaInicioYmd: '2025-01-01',
      fechaFinYmd: '2025-01-03',
      tnaAdicionalAnualFraccion: 0.01,
      tnaPrecancelacionAnualFraccion: 0.3,
      stepDias: 1,
    })
    expect(pts.length).toBeGreaterThanOrEqual(3)
    expect(pts[0]?.fechaYmd).toBe('2025-01-01')
    expect(pts[0]?.diasDesdeInicio).toBe(0)
    expect(pts[0]?.montoFinalUva).toBeCloseTo(1000, 2)
  })

  it('returns empty for empty UVA', () => {
    expect(
      buildPrecancelableUvaTimelineSeries({
        uvaSortedAsc: [],
        montoInicial: 1_000_000,
        fechaInicioYmd: '2025-01-01',
        fechaFinYmd: '2025-06-01',
        tnaAdicionalAnualFraccion: 0.05,
        tnaPrecancelacionAnualFraccion: null,
      }),
    ).toEqual([])
  })
})

describe('factorTotalContrafactualUva', () => {
  it('combines UVA ratio and compound adicional', () => {
    const f = factorTotalContrafactualUva(1000, 1100, 0, 90)
    expect(f).toBeCloseTo(1.1, 5)
  })
})

describe('tnaNominalAnualDesdeFactorPeriodo', () => {
  it('annualizes a neutral factor', () => {
    expect(tnaNominalAnualDesdeFactorPeriodo(1, 365)).toBeCloseTo(0, 10)
  })
})

describe('factorInteresSimpleAnual', () => {
  it('matches 1% over 91 days factor', () => {
    expect(factorInteresSimpleAnual(0.01, 91)).toBeCloseTo(1 + (0.01 * 91) / 365, 10)
  })
})

describe('montoPrecancelacionCotejadoBajoVencimiento', () => {
  it('keeps precancel when below vencimiento', () => {
    expect(montoPrecancelacionCotejadoBajoVencimiento(1_100_000, 1_000_000, 500_000, 0.3)).toBe(
      1_000_000,
    )
  })

  it('when bruto exceeds vencimiento, caps with min(R, M×factor(TNA_prec)) and never below capital', () => {
    const M = 1_000_000
    const capital = 800_000
    const tnaP = 0.3
    const factorM = Math.max(0.94, 0.999 - 0.02 * Math.min(tnaP, 1))
    const expected = Math.max(capital, Math.min(1_200_000, M * factorM))
    expect(montoPrecancelacionCotejadoBajoVencimiento(M, 1_200_000, capital, tnaP)).toBeCloseTo(
      expected,
      2,
    )
    expect(montoPrecancelacionCotejadoBajoVencimiento(M, 1_200_000, capital, tnaP)).toBeLessThan(M)
  })

  it('different TNA prec. give different caps when R > M', () => {
    const M = 1_000_000
    const capital = 100_000
    const low = montoPrecancelacionCotejadoBajoVencimiento(M, 1_500_000, capital, 0.1)
    const high = montoPrecancelacionCotejadoBajoVencimiento(M, 1_500_000, capital, 0.85)
    expect(low).toBeGreaterThan(high!)
    expect(low).toBeLessThan(M)
    expect(high).toBeLessThan(M)
  })
})

import { describe, expect, it } from 'vitest'
import {
  buildPlazoColumns,
  comparePlazoKeys,
  findMatchingTasa,
  getDisplayPlazoKey,
  getMaxTnaForPlazoKey,
  getPlazoColumnLabel,
  getPlazoKey,
  groupRatesByPlazoKey,
  isExcludedPlazoTasa,
  mergeRootTnaFor30d,
  resolvePlazoFijoRateAtDays,
  resolvePlazoFijoRateForHorizon,
  resolvePlazoFijoRatesByStandardPlazo,
  tasaMatchesDays,
} from './plazo-fijo-rates'

describe('getPlazoKey', () => {
  it('uses fixed days when min equals max', () => {
    expect(getPlazoKey({ plazoMinDias: 60, plazoMaxDias: 60 })).toBe('60')
  })

  it('uses range when min differs from max', () => {
    expect(getPlazoKey({ plazoMinDias: 30, plazoMaxDias: 44 })).toBe('30-44')
  })

  it('uses open range when max is null', () => {
    expect(getPlazoKey({ plazoMinDias: 180, plazoMaxDias: null })).toBe('180-+')
  })
})

describe('getDisplayPlazoKey', () => {
  it('maps Voii 30–44 días to the 30d column', () => {
    expect(getDisplayPlazoKey({ plazoMinDias: 30, plazoMaxDias: 44 })).toBe('30')
  })

  it('maps 60–89 días to the 60d column', () => {
    expect(getDisplayPlazoKey({ plazoMinDias: 60, plazoMaxDias: 89 })).toBe('60')
  })

  it('drops Voii 45–59 días', () => {
    expect(getDisplayPlazoKey({ plazoMinDias: 45, plazoMaxDias: 59 })).toBeNull()
  })

  it('drops tramos fuera de 30/60/90/365 días', () => {
    expect(getDisplayPlazoKey({ plazoMinDias: 120, plazoMaxDias: 179 })).toBeNull()
    expect(getDisplayPlazoKey({ plazoMinDias: 180, plazoMaxDias: null })).toBeNull()
  })
})

describe('isExcludedPlazoTasa', () => {
  it('flags only the 45–59 tramo', () => {
    expect(isExcludedPlazoTasa({ plazoMinDias: 45, plazoMaxDias: 59 })).toBe(true)
    expect(isExcludedPlazoTasa({ plazoMinDias: 60, plazoMaxDias: 89 })).toBe(false)
  })
})

describe('getMaxTnaForPlazoKey', () => {
  it('returns the highest tier for a plazo column', () => {
    expect(
      getMaxTnaForPlazoKey(
        {
          '30': [
            { tna: 22.5, label: 'Hasta $1M' },
            { tna: 23.5, label: 'Desde $1M' },
          ],
        },
        '30',
      ),
    ).toBe(23.5)
  })

  it('uses the highest 30d tier for sorting (Voii)', () => {
    const ratesByPlazo = mergeRootTnaFor30d(
      groupRatesByPlazoKey([
        {
          montoMinimo: null,
          montoMaximo: 999_999,
          plazoMinDias: 30,
          plazoMaxDias: 44,
          tna: 0.225,
        },
        {
          montoMinimo: 1_000_000,
          montoMaximo: null,
          plazoMinDias: 30,
          plazoMaxDias: 44,
          tna: 0.235,
        },
      ]),
      0.225,
    )

    expect(getMaxTnaForPlazoKey(ratesByPlazo, '30')).toBe(23.5)
  })
})

describe('mergeRootTnaFor30d', () => {
  it('adds root TNA when tasas has no 30d entry (Reba)', () => {
    const merged = mergeRootTnaFor30d(
      groupRatesByPlazoKey([
        { montoMinimo: null, montoMaximo: null, plazoMinDias: 60, plazoMaxDias: 60, tna: 0.21 },
        { montoMinimo: null, montoMaximo: null, plazoMinDias: 90, plazoMaxDias: 90, tna: 0.2 },
      ]),
      0.23,
    )

    expect(merged['30']).toEqual([{ tna: 23 }])
    expect(merged['60']).toHaveLength(1)
  })

  it('priorizes root over flat tasas at 30d and keeps amount tiers (Voii)', () => {
    const merged = mergeRootTnaFor30d(
      groupRatesByPlazoKey([
        {
          montoMinimo: null,
          montoMaximo: 999_999,
          plazoMinDias: 30,
          plazoMaxDias: 44,
          tna: 0.225,
        },
        {
          montoMinimo: 1_000_000,
          montoMaximo: null,
          plazoMinDias: 30,
          plazoMaxDias: 44,
          tna: 0.235,
        },
      ]),
      0.225,
    )

    expect(merged['30']).toHaveLength(2)
    expect(merged['30']![0]!.tna).toBe(23.5)
    expect(merged['30']![0]!.label).toMatch(/Desde.*1.*M/i)
    expect(merged['30']![1]!.tna).toBe(22.5)
    expect(merged['30']![1]!.label).toMatch(/Hasta.*1.*M/i)
  })
})

describe('getPlazoColumnLabel', () => {
  it('formats fixed days', () => {
    expect(getPlazoColumnLabel('90')).toBe('90 días')
  })

  it('formats bounded ranges', () => {
    expect(getPlazoColumnLabel('30-44')).toBe('30–44 días')
  })
})

describe('comparePlazoKeys', () => {
  it('sorts by minimum days then maximum', () => {
    expect(comparePlazoKeys('30', '60')).toBeLessThan(0)
    expect(comparePlazoKeys('60', '30-44')).toBeGreaterThan(0)
  })
})

describe('tasaMatchesDays', () => {
  const tasa = {
    montoMinimo: null,
    montoMaximo: null,
    plazoMinDias: 60,
    plazoMaxDias: 89,
    tna: 0.2,
  }

  it('matches days inside range', () => {
    expect(tasaMatchesDays(tasa, 75)).toBe(true)
  })

  it('rejects days outside range', () => {
    expect(tasaMatchesDays(tasa, 30)).toBe(false)
  })

  it('respects amount bounds', () => {
    const tiered = { ...tasa, montoMinimo: 1_000_000, montoMaximo: null }
    expect(tasaMatchesDays(tiered, 75, 500_000)).toBe(false)
    expect(tasaMatchesDays(tiered, 75, 2_000_000)).toBe(true)
  })
})

describe('findMatchingTasa', () => {
  const tasas = [
    {
      montoMinimo: null,
      montoMaximo: 999_999,
      plazoMinDias: 30,
      plazoMaxDias: 44,
      tna: 0.225,
    },
    {
      montoMinimo: 1_000_000,
      montoMaximo: null,
      plazoMinDias: 30,
      plazoMaxDias: 44,
      tna: 0.235,
    },
  ]

  it('picks the tier that matches amount', () => {
    expect(findMatchingTasa(tasas, 35, 500_000)?.tna).toBe(0.225)
    expect(findMatchingTasa(tasas, 35, 1_500_000)?.tna).toBe(0.235)
  })

  it('skips excluded tramos when matching', () => {
    const tasasWithGap = [
      ...tasas,
      {
        montoMinimo: null,
        montoMaximo: null,
        plazoMinDias: 45,
        plazoMaxDias: 59,
        tna: 0.22,
      },
    ]

    expect(findMatchingTasa(tasasWithGap, 50)).toBeUndefined()
  })
})

describe('buildPlazoColumns', () => {
  it('returns sorted unique columns', () => {
    const columns = buildPlazoColumns([
      { montoMinimo: null, montoMaximo: null, plazoMinDias: 90, plazoMaxDias: 90, tna: 0.2 },
      { montoMinimo: null, montoMaximo: null, plazoMinDias: 60, plazoMaxDias: 60, tna: 0.19 },
      { montoMinimo: null, montoMaximo: null, plazoMinDias: 365, plazoMaxDias: 365, tna: 0.23 },
    ])

    expect(columns.map((c) => c.key)).toEqual(['60', '90', '365'])
  })
})

describe('groupRatesByPlazoKey', () => {
  it('groups multiple tiers under the same plazo key', () => {
    const grouped = groupRatesByPlazoKey([
      {
        montoMinimo: null,
        montoMaximo: 999_999,
        plazoMinDias: 30,
        plazoMaxDias: 44,
        tna: 0.225,
      },
      {
        montoMinimo: 1_000_000,
        montoMaximo: null,
        plazoMinDias: 30,
        plazoMaxDias: 44,
        tna: 0.235,
      },
    ])

    expect(grouped['30']).toHaveLength(2)
    expect(grouped['30']![0]!.tna).toBe(23.5)
    expect(grouped['30']![1]!.tna).toBe(22.5)
    expect(grouped['30']![1]!.label).toMatch(/Hasta.*1.*M/i)
    expect(grouped['30']![0]!.label).toMatch(/Desde.*1.*M/i)
  })

  it('ignores the 45–59 tramo', () => {
    const grouped = groupRatesByPlazoKey([
      {
        montoMinimo: null,
        montoMaximo: null,
        plazoMinDias: 45,
        plazoMaxDias: 59,
        tna: 0.22,
      },
      {
        montoMinimo: null,
        montoMaximo: null,
        plazoMinDias: 60,
        plazoMaxDias: 89,
        tna: 0.215,
      },
    ])

    expect(grouped['45-59']).toBeUndefined()
    expect(grouped['60']).toHaveLength(1)
    expect(grouped['60']![0]!.tna).toBe(21.5)
  })
})

describe('resolvePlazoFijoRateForHorizon', () => {
  const row = {
    rootTna: 24,
    tasas: [
      {
        montoMinimo: null,
        montoMaximo: null,
        plazoMinDias: 30,
        plazoMaxDias: 44,
        tna: 0.24,
      },
      {
        montoMinimo: null,
        montoMaximo: null,
        plazoMinDias: 60,
        plazoMaxDias: 89,
        tna: 0.26,
      },
      {
        montoMinimo: null,
        montoMaximo: null,
        plazoMinDias: 90,
        plazoMaxDias: 119,
        tna: 0.28,
      },
      {
        montoMinimo: null,
        montoMaximo: null,
        plazoMinDias: 365,
        plazoMaxDias: 365,
        tna: 0.3,
      },
    ],
  }

  it('no compara bajo 30 días', () => {
    expect(resolvePlazoFijoRateForHorizon(row, 1)).toBeNull()
    expect(resolvePlazoFijoRateForHorizon(row, 8)).toBeNull()
    expect(resolvePlazoFijoRateForHorizon(row, 29)).toBeNull()
  })

  it('usa 30d entre 30 y 59 días', () => {
    expect(resolvePlazoFijoRateForHorizon(row, 30)).toEqual({ tna: 24, plazoKey: '30' })
    expect(resolvePlazoFijoRateForHorizon(row, 45)).toEqual({ tna: 24, plazoKey: '30' })
    expect(resolvePlazoFijoRateForHorizon(row, 59)).toEqual({ tna: 24, plazoKey: '30' })
  })

  it('usa 60d entre 60 y 89 días', () => {
    expect(resolvePlazoFijoRateForHorizon(row, 60)).toEqual({ tna: 26, plazoKey: '60' })
    expect(resolvePlazoFijoRateForHorizon(row, 75)).toEqual({ tna: 26, plazoKey: '60' })
  })

  it('usa 90d entre 90 y 364 días', () => {
    const at90 = resolvePlazoFijoRateForHorizon(row, 90)
    expect(at90?.plazoKey).toBe('90')
    expect(at90?.tna).toBeCloseTo(28, 10)
    const at200 = resolvePlazoFijoRateForHorizon(row, 200)
    expect(at200?.plazoKey).toBe('90')
    expect(at200?.tna).toBeCloseTo(28, 10)
  })

  it('usa 365d desde 365 días', () => {
    expect(resolvePlazoFijoRateForHorizon(row, 365)).toEqual({ tna: 30, plazoKey: '365' })
    expect(resolvePlazoFijoRateForHorizon(row, 1361)).toEqual({ tna: 30, plazoKey: '365' })
  })

  it('cae al tramo más corto disponible si falta el largo', () => {
    const only30 = {
      rootTna: 22,
      tasas: [
        {
          montoMinimo: null,
          montoMaximo: null,
          plazoMinDias: 30,
          plazoMaxDias: 30,
          tna: 0.22,
        },
      ],
    }
    expect(resolvePlazoFijoRateForHorizon(only30, 100)).toEqual({ tna: 22, plazoKey: '30' })
  })
})

describe('resolvePlazoFijoRatesByStandardPlazo', () => {
  it('arma TNA por columna estándar', () => {
    const row = {
      rootTna: 24,
      tasas: [
        {
          montoMinimo: null,
          montoMaximo: null,
          plazoMinDias: 30,
          plazoMaxDias: 44,
          tna: 0.24,
        },
        {
          montoMinimo: null,
          montoMaximo: null,
          plazoMinDias: 60,
          plazoMaxDias: 89,
          tna: 0.26,
        },
      ],
    }

    expect(resolvePlazoFijoRatesByStandardPlazo(row)).toEqual({
      '30': 24,
      '60': 26,
      '90': null,
      '365': null,
    })
  })
})

describe('resolvePlazoFijoRateAtDays', () => {
  it('respeta tramos por monto', () => {
    const row = {
      tasas: [
        {
          montoMinimo: null,
          montoMaximo: 999_999,
          plazoMinDias: 30,
          plazoMaxDias: 44,
          tna: 0.22,
        },
        {
          montoMinimo: 1_000_000,
          montoMaximo: null,
          plazoMinDias: 30,
          plazoMaxDias: 44,
          tna: 0.25,
        },
      ],
    }

    expect(resolvePlazoFijoRateAtDays(row, 30, 500_000)?.tna).toBe(22)
    expect(resolvePlazoFijoRateAtDays(row, 30, 1_000_000)?.tna).toBe(25)
  })
})

import { describe, expect, it } from 'vitest'
import type { FundCatalogRow } from '../composables/useFondosCatalog'
import {
  buildCompareFundOptions,
  getFundCompareKey,
  getFundCompareTo,
  getFundsCompareTo,
  parseFondosQuery,
  parseFondosQueryParam,
  pickTopFundsByPatrimonio,
  resolveCompareFunds,
  serializeFondosQuery,
  serializeFondosQueryParam,
} from './fci-fund-compare'

function row(partial: Partial<FundCatalogRow> & Pick<FundCatalogRow, 'fondo'>): FundCatalogRow {
  return {
    fondoId: null,
    claseId: null,
    typeLabel: 'Money Market',
    tipoRenta: 'Mercado de Dinero',
    horizonte: 'Corto Plazo',
    administradora: 'Adcap',
    depositaria: null,
    tna: null,
    tea: null,
    retorno1d: null,
    retorno30d: null,
    retornoYtd: null,
    vcp: null,
    patrimonio: null,
    inversionMinima: 1,
    moneda: 'ARS',
    monedaInversion: 'ARS',
    plazoLiquidacionDias: 0,
    region: null,
    fecha: '2026-09-01',
    ...partial,
  }
}

describe('pickTopFundsByPatrimonio', () => {
  it('returns top N funds grouped by class with summed patrimonio', () => {
    const result = pickTopFundsByPatrimonio(
      [
        row({ fondo: 'Grande - Clase A', patrimonio: 1000, tna: 0.3 }),
        row({ fondo: 'Grande - Clase B', patrimonio: 500, tna: 0.28 }),
        row({ fondo: 'Mediano - Clase A', patrimonio: 800, tna: 0.25 }),
        row({ fondo: 'Chico - Clase A', patrimonio: 100, tna: 0.2 }),
      ],
      { count: 2, onlyActive: false },
    )

    expect(result).toHaveLength(2)
    expect(result[0]?.displayName).toBe('Grande')
    expect(result[0]?.patrimonioTotal).toBe(1500)
    expect(result[0]?.rank).toBe(1)
    expect(result[0]?.compareKey).toBe('grande')
    expect(result[1]?.baseName).toBe('Mediano')
    expect(result[1]?.rank).toBe(2)
  })

  it('ranks USD funds using MEP conversion to ARS when mixing currencies', () => {
    const result = pickTopFundsByPatrimonio(
      [
        row({
          fondo: 'Pesos - Clase A',
          patrimonio: 1_000_000,
          monedaInversion: 'ARS',
        }),
        row({
          fondo: 'Dolares - Clase A',
          patrimonio: 2_000,
          moneda: 'USD',
          monedaInversion: 'USD',
        }),
      ],
      { count: 2, usdArsRate: 1400, onlyActive: false },
    )

    expect(result[0]?.baseName).toBe('Dolares')
    expect(result[0]?.patrimonioEnArs).toBe(2_800_000)
    expect(result[1]?.baseName).toBe('Pesos')
  })

  it('filters by currency when comparing within ARS or USD', () => {
    const ars = pickTopFundsByPatrimonio(
      [
        row({ fondo: 'Pesos - Clase A', patrimonio: 100, monedaInversion: 'ARS' }),
        row({
          fondo: 'Dolares - Clase A',
          patrimonio: 9_000_000,
          moneda: 'USD',
          monedaInversion: 'USD',
        }),
      ],
      { count: 3, onlyActive: false, currency: 'ARS' },
    )
    const usd = pickTopFundsByPatrimonio(
      [
        row({ fondo: 'Pesos - Clase A', patrimonio: 9_000_000, monedaInversion: 'ARS' }),
        row({
          fondo: 'Dolares - Clase A',
          patrimonio: 100,
          moneda: 'USD',
          monedaInversion: 'USD',
        }),
      ],
      { count: 3, onlyActive: false, currency: 'USD' },
    )

    expect(ars.map((f) => f.baseName)).toEqual(['Pesos'])
    expect(usd.map((f) => f.baseName)).toEqual(['Dolares'])
  })

  it('excludes stale reports when onlyActive is true', () => {
    const result = pickTopFundsByPatrimonio(
      [
        row({
          fondo: 'Viejo - Clase A',
          patrimonio: 9_000_000,
          fecha: '2025-01-01',
        }),
        row({
          fondo: 'Activo - Clase A',
          patrimonio: 100,
          fecha: '2026-09-01',
        }),
      ],
      { count: 3, onlyActive: true, now: new Date('2026-09-06T12:00:00') },
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.baseName).toBe('Activo')
  })
})

describe('resolveCompareFunds', () => {
  const catalog = [
    row({ fondo: 'Grande - Clase A', patrimonio: 1000, tna: 0.3 }),
    row({ fondo: 'Mediano - Clase A', patrimonio: 800, tna: 0.25 }),
    row({ fondo: 'Chico - Clase A', patrimonio: 100, tna: 0.2 }),
  ]

  it('uses top by patrimonio when selection is null (default)', () => {
    const result = resolveCompareFunds(catalog, null, { onlyActive: false, defaultCount: 2 })
    expect(result.isDefault).toBe(true)
    expect(result.isEmpty).toBe(false)
    expect(result.keys).toEqual(['grande', 'mediano'])
    expect(result.funds.map((f) => f.baseName)).toEqual(['Grande', 'Mediano'])
  })

  it('keeps an explicit empty selection', () => {
    const result = resolveCompareFunds(catalog, [], { onlyActive: false, defaultCount: 2 })
    expect(result.isDefault).toBe(false)
    expect(result.isEmpty).toBe(true)
    expect(result.keys).toEqual([])
    expect(result.funds).toEqual([])
  })

  it('resolves custom selection order and keys', () => {
    const result = resolveCompareFunds(catalog, ['chico', 'grande'], { onlyActive: false })
    expect(result.isDefault).toBe(false)
    expect(result.funds.map((f) => f.baseName)).toEqual(['Chico', 'Grande'])
    expect(result.funds.map((f) => f.rank)).toEqual([1, 2])
    expect(result.funds[0]?.patrimonioRank).toBe(3)
  })

  it('accepts primary class slug as alias', () => {
    const result = resolveCompareFunds(catalog, ['mediano-clase-a'], { onlyActive: false })
    expect(result.funds[0]?.baseName).toBe('Mediano')
    expect(result.keys).toEqual(['mediano'])
  })

  it('ignores selected keys from the other currency and can end empty', () => {
    const mixed = [
      ...catalog,
      row({
        fondo: 'Dolares - Clase A',
        patrimonio: 5000,
        moneda: 'USD',
        monedaInversion: 'USD',
      }),
    ]
    const result = resolveCompareFunds(mixed, ['dolares'], {
      onlyActive: false,
      currency: 'ARS',
    })
    expect(result.isEmpty).toBe(true)
    expect(result.funds).toEqual([])
  })
})

describe('fondos query helpers', () => {
  it('parses and serializes comma-separated keys', () => {
    expect(parseFondosQuery('a, b,c')).toEqual(['a', 'b', 'c'])
    expect(serializeFondosQuery(['a', 'b'])).toBe('a,b')
  })

  it('parses null as default and "-" as explicit empty', () => {
    expect(parseFondosQueryParam(undefined)).toBeNull()
    expect(parseFondosQueryParam('-')).toEqual([])
    expect(serializeFondosQueryParam([], false)).toBe('-')
    expect(serializeFondosQueryParam(['a'], true)).toBeUndefined()
  })

  it('builds select options with labels', () => {
    const funds = pickTopFundsByPatrimonio(
      [row({ fondo: 'Fima Premium - Clase A', patrimonio: 100 })],
      { onlyActive: false },
    )
    const options = buildCompareFundOptions(funds)
    expect(options[0]).toMatchObject({
      value: getFundCompareKey(funds[0]!),
      label: 'Fima Premium',
      typeLabel: 'Money Market',
    })
  })

  it('builds compare route with fund preselected and currency', () => {
    expect(getFundCompareTo('Delta Pesos - Clase X', 'ARS')).toEqual({
      path: '/fondos/comparar',
      query: { fondos: 'delta-pesos' },
    })
    expect(getFundCompareTo('Balanz Dolares - Clase A', 'USD')).toEqual({
      path: '/fondos/comparar',
      query: { fondos: 'balanz-dolares', moneda: 'USD' },
    })
  })

  it('rejects compare route when selected funds mix currencies', () => {
    const result = getFundsCompareTo([
      {
        fondo: 'Balanz Money Market - Clase A',
        baseName: 'Balanz Money Market',
        groupKey: 'balanz-money-market',
        moneda: 'ARS',
        monedaInversion: 'ARS',
      },
      {
        fondo: 'Fima Premium - Clase A',
        baseName: 'Fima Premium',
        groupKey: 'fima-premium',
        moneda: 'ARS',
        monedaInversion: 'ARS',
      },
      {
        fondo: 'Balanz Dolares - Clase A',
        baseName: 'Balanz Dolares',
        groupKey: 'balanz-dolares',
        moneda: 'USD',
        monedaInversion: 'USD',
      },
    ])

    expect(result).toMatchObject({
      path: '/fondos/comparar',
      query: {},
      keys: [],
      uniqueCount: 3,
      mixedCurrency: true,
      truncated: false,
    })
  })

  it('builds compare route from same-currency selected catalog rows', () => {
    const result = getFundsCompareTo([
      {
        fondo: 'Balanz Money Market - Clase A',
        baseName: 'Balanz Money Market',
        groupKey: 'balanz-money-market',
        moneda: 'ARS',
        monedaInversion: 'ARS',
      },
      {
        fondo: 'Fima Premium - Clase A',
        baseName: 'Fima Premium',
        groupKey: 'fima-premium',
        moneda: 'ARS',
        monedaInversion: 'ARS',
      },
    ])

    expect(result).toMatchObject({
      path: '/fondos/comparar',
      query: { fondos: 'balanz-money-market,fima-premium' },
      currency: 'ARS',
      keys: ['balanz-money-market', 'fima-premium'],
      uniqueCount: 2,
      mixedCurrency: false,
      truncated: false,
    })
  })
})

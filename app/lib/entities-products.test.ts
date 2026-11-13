import { describe, expect, it } from 'vitest'
import {
  buildEntitiesFromSources,
  mapComisionesBrokers,
  mapCuentas,
  mapPlazosFijos,
} from './entities-products'

describe('mapCuentas', () => {
  it('resolves account variants, formats the TNA and links the history page', () => {
    const { products, unmatched } = mapCuentas([
      { fondo: 'UALA PLUS 1', tna: 0.2 },
      { fondo: 'NARANJA X', tna: 0.325 },
      { fondo: 'CUENTA DESCONOCIDA', tna: 0.3 },
      { fondo: 'BRUBANK', tna: 0 },
    ])

    expect(products).toEqual([
      {
        entitySlug: 'uala',
        category: 'cuentas-remuneradas',
        categoryLabel: 'Cuentas remuneradas',
        product: 'Ualá Plus 1',
        metric: 'TNA 20%',
        to: '/cuentas-billeteras/uala-plus-1',
      },
      {
        entitySlug: 'naranja-x',
        category: 'cuentas-remuneradas',
        categoryLabel: 'Cuentas remuneradas',
        product: 'Naranja X',
        metric: 'TNA 32,5%',
        to: '/cuentas-billeteras/naranja-x',
      },
    ])
    expect(unmatched).toEqual(['CUENTA DESCONOCIDA'])
  })
})

describe('mapPlazosFijos', () => {
  it('maps BCRA legal names and falls back to the best term rate', () => {
    const { products } = mapPlazosFijos([
      { entidad: 'BANCO DE LA NACION ARGENTINA', tnaClientes: 0.1925, tasas: [] },
      { entidad: 'BANCO MACRO S.A.', tnaClientes: 0, tasas: [{ tna: 0.18 }, { tna: 0.21 }] },
    ])

    expect(products.map(({ entitySlug, metric }) => ({ entitySlug, metric }))).toEqual([
      { entitySlug: 'banco-nacion', metric: 'TNA 19,25%' },
      { entitySlug: 'banco-macro', metric: 'TNA hasta 21%' },
    ])
  })
})

describe('mapComisionesBrokers', () => {
  it('prefers the commercial name and keeps the lowest fee per product', () => {
    const { products, unmatched } = mapComisionesBrokers({
      comisiones: [
        { entidad: 'macro', nombreComercial: 'Macro Securities', producto: 'acciones', tasa: 0.01 },
        {
          entidad: 'macro',
          nombreComercial: 'Macro Securities',
          producto: 'acciones',
          tasa: 0.005,
        },
        { entidad: 'iol', nombreComercial: 'InvertirOnline', producto: 'cedears', tasa: 0.005 },
        { entidad: 'nuevo', nombreComercial: 'Broker Nuevo', producto: 'bonos', tasa: 0.01 },
      ],
    })

    expect(
      products.map(({ entitySlug, product, metric, to }) => ({ entitySlug, product, metric, to })),
    ).toEqual([
      {
        entitySlug: 'macro-securities',
        product: 'Acciones',
        metric: 'Comisión desde 0,5%',
        to: '/comisiones-brokers/acciones',
      },
      {
        entitySlug: 'iol',
        product: 'CEDEARs',
        metric: 'Comisión 0,5%',
        to: '/comisiones-brokers/cedears',
      },
    ])
    expect(unmatched).toEqual(['Broker Nuevo / nuevo'])
  })
})

describe('buildEntitiesFromSources', () => {
  it('groups products per entity, skips failed or malformed sources and sorts by name', () => {
    const { entities, unmatched } = buildEntitiesFromSources({
      cuentas: [
        { fondo: 'UALA', tna: 0.19 },
        { fondo: 'BELO', tna: 0.19 },
      ],
      criptopesos: [{ entidad: 'BELO', token: 'ARGt', tna: 0.19 }],
      remesas: 'not an object',
    })

    expect(entities.map((entity) => [entity.slug, entity.products.length])).toEqual([
      ['belo', 2],
      ['uala', 1],
    ])
    expect(unmatched).toEqual([])
  })
})

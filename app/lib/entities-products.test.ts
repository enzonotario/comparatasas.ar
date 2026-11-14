import { describe, expect, it } from 'vitest'
import {
  buildEntitiesFromSources,
  formatCategoryBest,
  getCategoryBest,
  mapComisionesBrokers,
  mapCuentas,
  mapPlazosFijos,
  mapRemesas,
  parseRemesaCost,
  type EntityProduct,
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
        value: 0.2,
        to: '/cuentas-billeteras/uala-plus-1',
      },
      {
        entitySlug: 'naranja-x',
        category: 'cuentas-remuneradas',
        categoryLabel: 'Cuentas remuneradas',
        product: 'Naranja X',
        metric: 'TNA 32,5%',
        value: 0.325,
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

    expect(
      products.map(({ entitySlug, metric, value }) => ({ entitySlug, metric, value })),
    ).toEqual([
      { entitySlug: 'banco-nacion', metric: 'TNA 19,25%', value: 0.1925 },
      { entitySlug: 'banco-macro', metric: 'TNA hasta 21%', value: 0.21 },
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
      products.map(({ entitySlug, product, metric, value, to }) => ({
        entitySlug,
        product,
        metric,
        value,
        to,
      })),
    ).toEqual([
      {
        entitySlug: 'macro-securities',
        product: 'Acciones',
        metric: 'Comisión desde 0,5%',
        value: 0.005,
        to: '/comisiones-brokers/acciones',
      },
      {
        entitySlug: 'iol',
        product: 'CEDEARs',
        metric: 'Comisión 0,5%',
        value: 0.005,
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

describe('remesas cost', () => {
  it('parses zero and percentage costs, leaves fixed fees without a value', () => {
    expect(parseRemesaCost('0')).toBe(0)
    expect(parseRemesaCost('1.5%')).toBe(0.015)
    expect(parseRemesaCost('1%')).toBe(0.01)
    expect(parseRemesaCost('3 USD')).toBeUndefined()
    expect(parseRemesaCost('3 USD (ACH) / 20 USD (Wire)')).toBeUndefined()
    expect(parseRemesaCost(null)).toBeUndefined()
  })

  it('keeps the text metric and sets the numeric value', () => {
    const { products } = mapRemesas({
      remesas: [
        { compania: 'wise', costoRecibirPagos: '0' },
        { compania: 'arq', costoRecibirPagos: '3 USD' },
      ],
    })
    expect(
      products.map(({ entitySlug, metric, value }) => ({ entitySlug, metric, value })),
    ).toEqual([
      { entitySlug: 'wise', metric: 'Recibir pagos: sin costo', value: 0 },
      { entitySlug: 'arq', metric: 'Recibir pagos: 3 USD', value: undefined },
    ])
  })
})

describe('getCategoryBest', () => {
  const product = (category: EntityProduct['category'], value?: number): EntityProduct => ({
    entitySlug: 'x',
    category,
    categoryLabel: '',
    product: 'p',
    value,
    to: `/${category}/${value ?? 'none'}`,
  })

  it('takes the highest value for rates earned and links its product', () => {
    const products = [product('cuentas-remuneradas', 0.2), product('cuentas-remuneradas', 0.24)]
    expect(getCategoryBest(products, 'cuentas-remuneradas')).toEqual({
      value: 0.24,
      count: 2,
      to: '/cuentas-remuneradas/0.24',
    })
  })

  it('takes the lowest value for costs, including zero', () => {
    const products = [
      product('comisiones-cobro', 0.029),
      product('comisiones-cobro', 0.008),
      product('fal', 0),
      product('fal', 0.01),
    ]
    expect(getCategoryBest(products, 'comisiones-cobro')).toEqual({
      value: 0.008,
      count: 2,
      to: '/comisiones-cobro/0.008',
    })
    expect(getCategoryBest(products, 'fal')).toEqual({ value: 0, count: 2, to: '/fal/0' })
  })

  it('ignores products without a value and distinguishes no product from no value', () => {
    const products = [product('fondos'), product('fondos', 0.18), product('remesas')]
    expect(getCategoryBest(products, 'fondos')).toEqual({
      value: 0.18,
      count: 2,
      to: '/fondos/0.18',
    })
    expect(getCategoryBest(products, 'remesas')).toEqual({
      value: undefined,
      count: 1,
      to: '/remesas/none',
    })
    expect(getCategoryBest(products, 'usd')).toBeUndefined()
  })

  it('formats the cell compactly', () => {
    expect(formatCategoryBest({ value: 0.325, count: 1, to: '/' })).toBe('32,5%')
    expect(formatCategoryBest({ value: 0, count: 1, to: '/' })).toBe('0%')
    expect(formatCategoryBest({ count: 2, to: '/' })).toBe('Sí')
    expect(formatCategoryBest(undefined)).toBe('—')
  })
})

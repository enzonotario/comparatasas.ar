import { describe, expect, it } from 'vitest'
import {
  calcularTasaNetaCaucion,
  filterComisionesCauciones,
  formatTasaPublicada,
  matchesOperacionFilter,
  pickBestComisionPorEntidad,
  tasaComparableAnual,
  type ComisionCaucionBrokerApi,
} from './comision-caucion-broker'

const sample: ComisionCaucionBrokerApi[] = [
  {
    entidad: 'iol',
    nombreComercial: 'InvertirOnline',
    producto: 'cauciones',
    operacion: 'colocadora',
    moneda: 'ARS',
    canal: 'web',
    plan: 'gold',
    tasa: 0.0015,
    tasaBase: 'mensual',
    tasaAnualEquivalente: 0.018,
    tasaEsTope: false,
    incluyeIva: false,
    ivaAdicional: true,
    prorrateoDias: 90,
    comisionMinima: null,
    derechoMercado: 0.00045,
    enlace: null,
  },
  {
    entidad: 'iol',
    nombreComercial: 'InvertirOnline',
    producto: 'cauciones',
    operacion: 'colocadora',
    moneda: 'ARS',
    canal: 'web',
    plan: 'black',
    tasa: 0.0015,
    tasaBase: 'mensual',
    tasaAnualEquivalente: 0.018,
    tasaEsTope: false,
    incluyeIva: false,
    ivaAdicional: true,
    prorrateoDias: 90,
    comisionMinima: null,
    derechoMercado: 0.00045,
    enlace: null,
  },
  {
    entidad: 'balanz',
    nombreComercial: 'Balanz',
    producto: 'cauciones',
    operacion: 'ambas',
    moneda: 'ARS',
    canal: 'web',
    plan: null,
    tasa: 0.005,
    tasaBase: 'anual',
    tasaAnualEquivalente: 0.005,
    tasaEsTope: true,
    incluyeIva: false,
    ivaAdicional: false,
    prorrateoDias: 90,
    comisionMinima: null,
    derechoMercado: null,
    enlace: null,
  },
  {
    entidad: 'ppi',
    nombreComercial: 'PPI',
    producto: 'acciones',
    operacion: 'ambas',
    moneda: 'ARS',
    canal: 'web',
    plan: null,
    tasa: 0.006,
    tasaBase: null,
    tasaAnualEquivalente: null,
    tasaEsTope: false,
    incluyeIva: false,
    ivaAdicional: true,
    prorrateoDias: null,
    comisionMinima: null,
    derechoMercado: null,
    enlace: null,
  },
]

describe('tasaComparableAnual', () => {
  it('prioriza tasaAnualEquivalente y deriva mensual', () => {
    expect(tasaComparableAnual(sample[0]!)).toBe(0.018)
    expect(
      tasaComparableAnual({
        ...sample[0]!,
        tasaAnualEquivalente: null,
        tasa: 0.001,
        tasaBase: 'mensual',
      }),
    ).toBeCloseTo(0.012)
  })
})

describe('matchesOperacionFilter', () => {
  it('incluye ambas para colocadora y tomadora', () => {
    expect(matchesOperacionFilter('ambas', 'colocadora')).toBe(true)
    expect(matchesOperacionFilter('colocadora', 'colocadora')).toBe(true)
    expect(matchesOperacionFilter('tomadora', 'colocadora')).toBe(false)
  })
})

describe('pickBestComisionPorEntidad', () => {
  it('deja una fila por entidad ordenada por tasa anual', () => {
    const rows = pickBestComisionPorEntidad(
      sample.filter((row) => row.producto === 'cauciones'),
    )
    expect(rows.map((row) => row.entidad)).toEqual(['balanz', 'iol'])
    expect(rows.find((row) => row.entidad === 'iol')?.plan).toBe('gold')
  })
})

describe('filterComisionesCauciones', () => {
  it('filtra producto, moneda y rol', () => {
    const rows = filterComisionesCauciones(sample, {
      moneda: 'ARS',
      operacion: 'colocadora',
    })
    expect(rows.every((row) => row.producto === 'cauciones')).toBe(true)
    expect(rows.some((row) => row.entidad === 'balanz')).toBe(true)
  })
})

describe('formatTasaPublicada', () => {
  it('formatea mensual y tope', () => {
    expect(formatTasaPublicada(sample[0]!)).toBe('0,15% mensual')
    expect(formatTasaPublicada(sample[1]!)).toBe('0,15% mensual')
    expect(formatTasaPublicada(sample[2]!)).toBe('Hasta 0,50% anual')
  })
})

describe('calcularTasaNetaCaucion', () => {
  const iol = sample[0]!

  it('descuenta comisión e IVA para colocadora', () => {
    const neta = calcularTasaNetaCaucion(18, 7, iol, 'colocadora')
    expect(neta).not.toBeNull()
    expect(neta!).toBeLessThan(18)
    expect(neta!).toBeGreaterThan(0)
  })

  it('suma costos para tomadora', () => {
    const colocadora = calcularTasaNetaCaucion(18, 7, iol, 'colocadora')!
    const tomadora = calcularTasaNetaCaucion(18, 7, iol, 'tomadora')!
    expect(tomadora).toBeGreaterThan(colocadora)
  })

  it('sin comisión devuelve tasa de mercado', () => {
    expect(calcularTasaNetaCaucion(18, 7, null, 'colocadora')).toBe(18)
  })

  it('IOL 1d no queda negativa por derecho BYMA prorrateado', () => {
    const neta = calcularTasaNetaCaucion(12, 1, iol, 'colocadora')
    expect(neta).not.toBeNull()
    expect(neta!).toBeGreaterThan(0)
    expect(neta!).toBeLessThan(12)
  })

  it('Fiwind 1d prorratea derecho BYMA default 90d', () => {
    const fiwind: ComisionCaucionBrokerApi = {
      entidad: 'fiwind',
      nombreComercial: 'Fiwind',
      producto: 'cauciones',
      operacion: 'ambas',
      moneda: 'ARS',
      canal: 'web',
      plan: null,
      tasa: 0.02,
      tasaBase: 'anual',
      tasaAnualEquivalente: 0.02,
      tasaEsTope: true,
      incluyeIva: false,
      ivaAdicional: true,
      prorrateoDias: null,
      comisionMinima: null,
      derechoMercado: 0.00045,
      enlace: null,
    }
    const neta = calcularTasaNetaCaucion(12, 1, fiwind, 'colocadora')
    expect(neta).not.toBeNull()
    expect(neta!).toBeGreaterThan(0)
  })
})

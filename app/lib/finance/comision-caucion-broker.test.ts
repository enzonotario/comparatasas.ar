import { describe, expect, it } from 'vitest'
import {
  calcularTasaNetaCaucion,
  calcularTasaNetaLecap,
  filterComisionesBrokers,
  filterComisionesCauciones,
  formatMembresiaMensual,
  formatProductoLabel,
  formatTasaAnualComparable,
  formatTasaPublicada,
  matchesOperacionFilter,
  pickBestComisionPorEntidad,
  sortKeyComisionBroker,
  tasaComparableAnual,
  type ComisionBrokerApi,
} from './comision-caucion-broker'

const sample: ComisionBrokerApi[] = [
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
    const rows = pickBestComisionPorEntidad(sample.filter((row) => row.producto === 'cauciones'))
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

describe('formatMembresiaMensual', () => {
  it('formatea membresía ARS con IVA y omite si no hay', () => {
    expect(formatMembresiaMensual(sample[0]!)).toBeNull()
    expect(
      formatMembresiaMensual({
        moneda: 'ARS',
        membresiaMensual: 5000,
        membresiaIvaAdicional: true,
      }),
    ).toMatch(/\$\s?5\.?000\/mes \+ IVA/)
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
    const fiwind: ComisionBrokerApi = {
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

describe('calcularTasaNetaLecap', () => {
  const letras: ComisionBrokerApi = {
    entidad: 'iol',
    nombreComercial: 'InvertirOnline',
    producto: 'letras',
    operacion: 'compra',
    moneda: 'ARS',
    canal: 'web',
    plan: 'gold',
    tasa: 0.006,
    tasaBase: 'tna',
    tasaAnualEquivalente: 0.006,
    tasaEsTope: false,
    incluyeIva: false,
    ivaAdicional: true,
    prorrateoDias: null,
    comisionMinima: null,
    derechoMercado: 0.0001,
    enlace: null,
  }

  it('descuenta comisión de compra sobre TNA decimal', () => {
    const neta = calcularTasaNetaLecap(0.45, 90, letras)
    expect(neta).not.toBeNull()
    expect(neta!).toBeLessThan(0.45)
    expect(neta!).toBeGreaterThan(0)
  })

  it('sin comisión devuelve TNA de mercado', () => {
    expect(calcularTasaNetaLecap(0.45, 90, null)).toBe(0.45)
  })
})

describe('filterComisionesBrokers', () => {
  it('filtra producto y moneda sin dedupe', () => {
    const rows = filterComisionesBrokers(sample, {
      producto: 'cauciones',
      moneda: 'ARS',
    })
    expect(rows.every((row) => row.producto === 'cauciones')).toBe(true)
    expect(rows.filter((row) => row.entidad === 'iol')).toHaveLength(2)
  })

  it('prioriza tasaAnualEquivalente en el sort key', () => {
    const conTae = sample[0]!
    const sinTae = sample[3]!
    expect(sortKeyComisionBroker(conTae)).toBe(0.018)
    expect(sortKeyComisionBroker(sinTae)).toBe(0.006)
  })
})

describe('formatProductoLabel / formatTasaAnualComparable', () => {
  it('etiqueta productos conocidos', () => {
    expect(formatProductoLabel('acciones')).toBe('Acciones')
    expect(formatProductoLabel('obligaciones_negociables')).toBe('Obligaciones negociables')
  })

  it('no inventa equiv. anual sin base ni TAE', () => {
    expect(formatTasaAnualComparable(sample[3]!)).toBe('—')
    expect(formatTasaAnualComparable(sample[0]!)).toContain('anual equiv.')
  })
})

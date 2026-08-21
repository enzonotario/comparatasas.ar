import { describe, expect, it } from 'vitest'
import { classifyHolding } from './fci-holding-classify'
import { getManagerKind, shortManagerName } from './fci-manager-kind'
import { buildFciMarketUniverse } from './fci-market-overview'
import type { FciFundDetail } from '../composables/useFciFundDetails'

function fund(partial: Partial<FciFundDetail> & Pick<FciFundDetail, 'nombre'>): FciFundDetail {
  return {
    fondoId: '1',
    claseId: '1',
    fecha: '2026-08-14',
    tipoRenta: 'Mercado de Dinero',
    tipoDD: null,
    region: null,
    benchmark: null,
    horizonte: null,
    duracion: null,
    moneda: 'Peso Argentino',
    codigoCNV: null,
    administradora: 'Galicia Asset Management S.A.U.',
    depositaria: null,
    patrimonio: 1000,
    inversionMinima: null,
    monedaInversion: 'Peso Argentino',
    plazoLiquidacionDias: null,
    rendimientos: {
      valorCuotaparte: 1,
      variacionDiariaPct: 0.05,
      ultimos7Dias: 0.3,
      unMes: 1.4,
      noventaDias: null,
      cientoOchentaDias: null,
      enElAnio: 12,
      doceMeses: null,
    },
    composicionCartera: [],
    calificaciones: [],
    honorarios: null,
    sociedades: [],
    ...partial,
  }
}

describe('classifyHolding', () => {
  it('classifies common CNV holding names', () => {
    expect(classifyHolding('Pzo Fi $ Bco Nacion')).toBe('plazosFijos')
    expect(classifyHolding('Caucion Colocadora $ Merval')).toBe('cauciones')
    expect(classifyHolding('Cta Cte $ Rem Bco Patagonia')).toBe('cuentas')
    expect(classifyHolding('Lecap S13N6')).toBe('letras')
    expect(classifyHolding('Bono Boncer TZXD6')).toBe('titulosPublicos')
    expect(classifyHolding('ON Tecpetrol C12')).toBe('ons')
    expect(classifyHolding('Cedear Vista Oil Gas')).toBe('cedears')
    expect(classifyHolding('Resto de Activos')).toBe('otros')
  })
})

describe('manager kind', () => {
  it('detects bank-affiliated gestoras and shortens labels', () => {
    expect(getManagerKind('Galicia Asset Management S.A.U.')).toBe('banco')
    expect(getManagerKind('Santander Asset Management G.F.C.I.S.A.')).toBe('banco')
    expect(getManagerKind('Cocos Asset Management S.A.')).toBe('independiente')
    expect(getManagerKind('Mercado Pago Asset Managemet S.A.')).toBe('independiente')
    expect(shortManagerName('Galicia Asset Management S.A.U.')).toBe('Galicia')
    expect(shortManagerName('Mercado Pago Asset Managemet S.A.')).toBe('Mercado Pago')
  })
})

describe('buildFciMarketUniverse', () => {
  it('aggregates AUM, classes and bank split', () => {
    const universe = buildFciMarketUniverse([
      fund({
        fondoId: '345',
        nombre: 'Fima Premium - Clase A',
        patrimonio: 100,
        administradora: 'Galicia Asset Management S.A.U.',
        composicionCartera: [{ nombre: 'Pzo Fi $ Bco Nacion', porcentaje: 50 }],
      }),
      fund({
        fondoId: '345',
        nombre: 'Fima Premium - Clase B',
        patrimonio: 300,
        administradora: 'Galicia Asset Management S.A.U.',
        composicionCartera: [{ nombre: 'Pzo Fi $ Bco Nacion', porcentaje: 50 }],
      }),
      fund({
        fondoId: '99',
        nombre: 'Cocos Ahorro - Clase A',
        patrimonio: 100,
        administradora: 'Cocos Asset Management S.A.',
        tipoRenta: 'Renta Fija',
        rendimientos: {
          valorCuotaparte: 1,
          variacionDiariaPct: 0.1,
          ultimos7Dias: null,
          unMes: 2,
          noventaDias: null,
          cientoOchentaDias: null,
          enElAnio: 8,
          doceMeses: null,
        },
        composicionCartera: [{ nombre: 'Bono Boncer TZXD6', porcentaje: 100 }],
      }),
    ])

    expect(universe.clases).toBe(3)
    expect(universe.fondos).toBe(2)
    expect(universe.gestoras).toBe(2)
    expect(universe.patrimonio).toBe(500)
    expect(universe.bankSplit.bancos).toBe(400)
    expect(universe.bankSplit.independientes).toBe(100)
    expect(universe.byType[0]?.label).toBe('Money Market')
    expect(universe.byManager[0]?.label).toBe('Galicia')
    expect(universe.byFund[0]?.fondo).toBe('Fima Premium')
    expect(universe.byFund[0]?.primaryFondo).toBe('Fima Premium - Clase B')
    expect(universe.byFund[0]?.value).toBe(400)
    expect(universe.topHoldings[0]?.label).toBe('Pzo Fi $ Bco Nacion')
    expect(universe.topHoldings[0]?.value).toBe(200)
    expect(universe.holdingsByKind.find((item) => item.key === 'plazosFijos')?.value).toBe(200)
    expect(universe.holdingsByKind.find((item) => item.key === 'titulosPublicos')?.value).toBe(100)
  })

  it('filters by currency', () => {
    const funds = [
      fund({ nombre: 'Pesos', patrimonio: 200, monedaInversion: 'Peso Argentino' }),
      fund({
        nombre: 'Dolares',
        patrimonio: 50,
        moneda: 'Dolar Estadounidense',
        monedaInversion: 'Dolar Estadounidense',
      }),
    ]

    expect(buildFciMarketUniverse(funds, 'ARS').patrimonio).toBe(200)
    expect(buildFciMarketUniverse(funds, 'USD').patrimonio).toBe(50)
    expect(buildFciMarketUniverse(funds, 'all').patrimonio).toBe(250)
  })
})

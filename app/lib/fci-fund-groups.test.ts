import { describe, expect, it } from 'vitest'
import type { FundCatalogRow } from '../composables/useFondosCatalog'
import { findSiblingFundClasses, groupFundCatalogRows } from './fci-fund-groups'

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
    fecha: null,
    ...partial,
  }
}

describe('groupFundCatalogRows', () => {
  it('groups classes and sums patrimonio', () => {
    const grouped = groupFundCatalogRows([
      row({ fondo: 'Adcap Ahorro Pesos Fondo de Dinero - Clase A', patrimonio: 100, tna: 0.2 }),
      row({ fondo: 'Adcap Ahorro Pesos Fondo de Dinero - Clase B', patrimonio: 50, tna: 0.19 }),
      row({ fondo: 'Otro Fondo - Clase A', patrimonio: 10, tna: 0.1 }),
    ])

    expect(grouped).toHaveLength(2)
    const adcap = grouped.find((g) => g.displayName === 'Adcap Ahorro Pesos Fondo de Dinero')
    expect(adcap?.isGroup).toBe(true)
    expect(adcap?.classCount).toBe(2)
    expect(adcap?.patrimonioTotal).toBe(150)
    expect(adcap?.children).toHaveLength(2)
    expect(adcap?.primaryFondo).toBe('Adcap Ahorro Pesos Fondo de Dinero - Clase A')
  })

  it('uses the latest reported date across classes', () => {
    const grouped = groupFundCatalogRows([
      row({
        fondo: 'Adcap Ahorro Pesos Fondo de Dinero - Clase A',
        fecha: '2026-08-10',
      }),
      row({
        fondo: 'Adcap Ahorro Pesos Fondo de Dinero - Clase B',
        fecha: '2026-08-14',
      }),
    ])

    expect(grouped[0]?.fecha).toBe('2026-08-14')
  })

  it('finds siblings by fondoId and also by groupKey', () => {
    const result = findSiblingFundClasses(
      [
        row({
          fondo: 'Mercado Fondo - Clase A',
          fondoId: '798',
          claseId: '1',
          patrimonio: 100,
        }),
        row({
          fondo: 'Mercado Fondo - Clase B',
          fondoId: '798',
          claseId: '2',
          patrimonio: 20,
        }),
        row({
          fondo: 'Otro - Clase A',
          fondoId: '1',
          claseId: '9',
          patrimonio: 999,
        }),
      ],
      'Mercado Fondo - Clase A',
      { fondoId: '798' },
    )

    expect(result.siblings).toHaveLength(2)
    expect(result.patrimonioTotal).toBe(120)
  })

  it('includes same base-name classes even when CNV fondoId differs (Mills-style)', () => {
    const result = findSiblingFundClasses(
      [
        row({
          fondo: 'Mills Renta Fija Pesos - Clase XDA1',
          fondoId: '1830',
          claseId: '6290',
          patrimonio: 100,
        }),
        row({
          fondo: 'Mills Renta Fija Pesos - Clase XDA2',
          fondoId: '1873',
          claseId: '6640',
          patrimonio: 0,
        }),
        row({
          fondo: 'Mills Renta Fija Pesos - Clase XDB1',
          fondoId: '1830',
          claseId: '6291',
          patrimonio: 200,
        }),
        row({
          fondo: 'Mills Renta Fija Pesos - Clase XDB2',
          fondoId: '1830',
          claseId: '6292',
          patrimonio: 0,
        }),
      ],
      'Mills Renta Fija Pesos - Clase XDB1',
      { fondoId: '1830' },
    )

    expect(result.siblings.map((s) => s.classLabel)).toEqual([
      'Clase XDA1',
      'Clase XDA2',
      'Clase XDB1',
      'Clase XDB2',
    ])
    expect(result.patrimonioTotal).toBe(300)
  })
})

import { describe, expect, it } from 'vitest'
import type { FundCatalogRow } from '../composables/useFondosCatalog'
import { summarizeFundsByEntity } from './fci-fund-entity-views'

function row(partial: Partial<FundCatalogRow> & Pick<FundCatalogRow, 'fondo'>): FundCatalogRow {
  return {
    fondoId: null,
    claseId: null,
    typeLabel: 'Renta Fija',
    tipoRenta: 'Renta Fija',
    horizonte: null,
    administradora: null,
    depositaria: null,
    tna: null,
    tea: null,
    retorno1d: null,
    retorno30d: null,
    retornoYtd: null,
    vcp: null,
    patrimonio: null,
    inversionMinima: null,
    monedaInversion: null,
    plazoLiquidacionDias: null,
    region: null,
    fecha: null,
    ...partial,
  }
}

describe('summarizeFundsByEntity', () => {
  it('aggregates fondos, clases and patrimonio by administradora', () => {
    const funds = [
      row({
        fondo: 'Fima Premium - Clase A',
        administradora: 'Galicia',
        patrimonio: 100,
        tna: 0.1,
        tipoFilterKey: 'rentaFija',
      }),
      row({
        fondo: 'Fima Premium - Clase B',
        administradora: 'Galicia',
        patrimonio: 50,
        tna: 0.2,
        tipoFilterKey: 'rentaFija',
      }),
      row({
        fondo: 'Otro Fondo',
        administradora: 'Santander',
        patrimonio: 200,
        tna: 0.05,
        tipoFilterKey: 'mercadoDinero',
      }),
    ]

    const result = summarizeFundsByEntity(funds, 'administradora')

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      name: 'Santander',
      fondos: 1,
      clases: 1,
      patrimonio: 200,
      tipos: 1,
    })
    expect(result[1]).toMatchObject({
      name: 'Galicia',
      fondos: 1,
      clases: 2,
      patrimonio: 150,
      tipos: 1,
    })
    expect(result[1].avgTna).toBeCloseTo(0.15)
    expect(result[1].children).toHaveLength(1)
    expect(result[1].children[0]?.displayName).toBe('Fima Premium')
    expect(result[1].children[0]?.children).toHaveLength(2)
  })
})

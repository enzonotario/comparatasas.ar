import { describe, expect, it } from 'vitest'
import { listFundTipoOptions, type FundCatalogRow } from './fci-catalog-rows'

function row(partial: Partial<FundCatalogRow>): FundCatalogRow {
  return { fondo: 'X', typeLabel: '—', ...partial } as FundCatalogRow
}

describe('listFundTipoOptions', () => {
  it('lists distinct types sorted by label and skips rows without a filter key', () => {
    expect(
      listFundTipoOptions([
        row({ tipoFilterKey: 'rentaVariable', typeLabel: 'Renta Variable' }),
        row({ tipoFilterKey: 'mercadoDinero', typeLabel: 'Money Market' }),
        row({ tipoFilterKey: 'rentaVariable', typeLabel: 'Renta Variable' }),
        row({ tipoFilterKey: undefined, typeLabel: 'Sin tipo' }),
      ]),
    ).toEqual([
      { value: 'mercadoDinero', label: 'Money Market' },
      { value: 'rentaVariable', label: 'Renta Variable' },
    ])
  })
})

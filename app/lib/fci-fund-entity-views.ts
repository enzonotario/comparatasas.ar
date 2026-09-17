import { parseFundClassName } from './fci-fund-class'
import { groupFundCatalogRows, type FundCatalogGroupRow } from './fci-fund-groups'
import type { FundCatalogRow } from '../composables/useFondosCatalog'
import { isUsdCurrency, toArsPatrimonio } from './fci-fund-formatters'

export type CatalogVista = 'fondos' | 'administradoras' | 'depositarias'

export interface FundEntitySummary {
  name: string
  clases: number
  fondos: number
  /** Patrimonio total en ARS (USD convertido con dólar bolsa / MEP cuando hay tipo de cambio). */
  patrimonio: number | null
  /** true si el total incluye al menos un fondo USD convertido a ARS. */
  patrimonioEnArs: boolean
  avgTna: number | null
  tipos: number
  children: FundCatalogGroupRow[]
}

export function isFundEntitySummary(value: unknown): value is FundEntitySummary {
  return (
    !!value &&
    typeof value === 'object' &&
    'name' in value &&
    'fondos' in value &&
    'avgTna' in value &&
    'children' in value &&
    !('displayName' in value) &&
    !('primaryFondo' in value)
  )
}

function sumNullable(values: Array<number | null | undefined>) {
  let total = 0
  let hasValue = false
  for (const value of values) {
    if (value == null || !Number.isFinite(value)) continue
    total += value
    hasValue = true
  }
  return hasValue ? total : null
}

function averageNullable(values: Array<number | null | undefined>) {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value))
  if (!finite.length) return null
  return finite.reduce((sum, value) => sum + value, 0) / finite.length
}

function fundCurrency(fund: FundCatalogRow) {
  return fund.monedaInversion || fund.moneda
}

/**
 * Agrega fondos por administradora/depositaria.
 * Los patrimonios en USD se convierten a ARS con `usdArsRate` (venta MEP) para poder sumar y ordenar.
 */
export function summarizeFundsByEntity(
  funds: FundCatalogRow[],
  field: 'administradora' | 'depositaria',
  usdArsRate?: number | null,
): FundEntitySummary[] {
  const groups = new Map<
    string,
    {
      rows: FundCatalogRow[]
      fondoKeys: Set<string>
      patrimonios: Array<number | null>
      convertedUsd: boolean
      tnas: Array<number | null>
      tipos: Set<string>
    }
  >()

  for (const fund of funds) {
    const name = fund[field]?.trim()
    if (!name) continue

    let group = groups.get(name)
    if (!group) {
      group = {
        rows: [],
        fondoKeys: new Set(),
        patrimonios: [],
        convertedUsd: false,
        tnas: [],
        tipos: new Set(),
      }
      groups.set(name, group)
    }

    group.rows.push(fund)
    group.fondoKeys.add(parseFundClassName(fund.fondo).groupKey || fund.fondo)

    const currency = fundCurrency(fund)
    if (isUsdCurrency(currency)) {
      const converted = toArsPatrimonio(fund.patrimonio, currency, usdArsRate)
      if (converted != null) {
        group.convertedUsd = true
        group.patrimonios.push(converted)
      }
      // Sin tipo de cambio, omitimos USD del total para no mezclar monedas.
    } else {
      group.patrimonios.push(fund.patrimonio)
    }

    group.tnas.push(fund.tna)
    if (fund.tipoFilterKey) group.tipos.add(fund.tipoFilterKey)
  }

  return Array.from(groups.entries())
    .map(([name, group]) => ({
      name,
      clases: group.rows.length,
      fondos: group.fondoKeys.size,
      patrimonio: sumNullable(group.patrimonios),
      patrimonioEnArs: group.convertedUsd,
      avgTna: averageNullable(group.tnas),
      tipos: group.tipos.size,
      children: groupFundCatalogRows(group.rows),
    }))
    .sort((a, b) => {
      const patrimonioA = a.patrimonio ?? Number.NEGATIVE_INFINITY
      const patrimonioB = b.patrimonio ?? Number.NEGATIVE_INFINITY
      if (patrimonioA !== patrimonioB) return patrimonioB - patrimonioA
      return a.name.localeCompare(b.name, 'es')
    })
}

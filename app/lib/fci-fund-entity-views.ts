import { parseFundClassName } from './fci-fund-class'
import { groupFundCatalogRows, type FundCatalogGroupRow } from './fci-fund-groups'
import type { FundCatalogRow } from '../composables/useFondosCatalog'

export type CatalogVista = 'fondos' | 'administradoras' | 'depositarias'

export interface FundEntitySummary {
  name: string
  clases: number
  fondos: number
  patrimonio: number | null
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

export function summarizeFundsByEntity(
  funds: FundCatalogRow[],
  field: 'administradora' | 'depositaria',
): FundEntitySummary[] {
  const groups = new Map<
    string,
    {
      rows: FundCatalogRow[]
      fondoKeys: Set<string>
      patrimonios: Array<number | null>
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
        tnas: [],
        tipos: new Set(),
      }
      groups.set(name, group)
    }

    group.rows.push(fund)
    group.fondoKeys.add(parseFundClassName(fund.fondo).groupKey || fund.fondo)
    group.patrimonios.push(fund.patrimonio)
    group.tnas.push(fund.tna)
    if (fund.tipoFilterKey) group.tipos.add(fund.tipoFilterKey)
  }

  return Array.from(groups.entries())
    .map(([name, group]) => ({
      name,
      clases: group.rows.length,
      fondos: group.fondoKeys.size,
      patrimonio: sumNullable(group.patrimonios),
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

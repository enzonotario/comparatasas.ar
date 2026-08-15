import type { FundCatalogRow } from '../composables/useFondosCatalog'
import { compareClassLabels, parseFundClassName } from './fci-fund-class'

export interface FundCatalogGroupRow extends FundCatalogRow {
  /** Display name: base name for groups, full name for flat/class rows */
  displayName: string
  baseName: string
  classLabel: string | null
  groupKey: string
  isGroup: boolean
  classCount: number
  patrimonioTotal: number | null
  /** Primary class full name used when navigating from a group row */
  primaryFondo: string
  children?: FundCatalogGroupRow[]
}

function pickPrimaryClass(classes: FundCatalogRow[]): FundCatalogRow {
  const withTna = classes
    .filter((row) => row.tna != null && Number.isFinite(row.tna))
    .sort((a, b) => (b.patrimonio ?? -1) - (a.patrimonio ?? -1))

  if (withTna[0]) return withTna[0]

  return [...classes].sort((a, b) => (b.patrimonio ?? -1) - (a.patrimonio ?? -1))[0]!
}

function sumPatrimonio(classes: FundCatalogRow[]): number | null {
  let total = 0
  let hasValue = false

  for (const row of classes) {
    if (row.patrimonio == null || !Number.isFinite(row.patrimonio)) continue
    total += row.patrimonio
    hasValue = true
  }

  return hasValue ? total : null
}

function toClassRow(row: FundCatalogRow): FundCatalogGroupRow {
  const parsed = parseFundClassName(row.fondo)

  return {
    ...row,
    displayName: row.fondo,
    baseName: parsed.baseName,
    classLabel: parsed.classLabel,
    groupKey: parsed.groupKey,
    isGroup: false,
    classCount: 1,
    patrimonioTotal: row.patrimonio,
    primaryFondo: row.fondo,
  }
}

/**
 * Groups filtered fund classes by base name (`{nombre} - Clase X`).
 * Single-class funds stay as flat rows; multi-class funds become expandable groups.
 */
export function groupFundCatalogRows(rows: FundCatalogRow[]): FundCatalogGroupRow[] {
  const groups = new Map<string, FundCatalogRow[]>()

  for (const row of rows) {
    const parsed = parseFundClassName(row.fondo)
    const key = parsed.groupKey || row.fondo
    const bucket = groups.get(key)
    if (bucket) bucket.push(row)
    else groups.set(key, [row])
  }

  const result: FundCatalogGroupRow[] = []

  for (const [, classes] of groups) {
    const sortedClasses = [...classes].sort((a, b) => {
      const aClass = parseFundClassName(a.fondo).classLabel
      const bClass = parseFundClassName(b.fondo).classLabel
      return compareClassLabels(aClass, bClass)
    })

    if (sortedClasses.length === 1) {
      result.push(toClassRow(sortedClasses[0]!))
      continue
    }

    const primary = pickPrimaryClass(sortedClasses)
    const parsedPrimary = parseFundClassName(primary.fondo)
    const patrimonioTotal = sumPatrimonio(sortedClasses)

    result.push({
      ...primary,
      fondo: primary.fondo,
      displayName: parsedPrimary.baseName,
      baseName: parsedPrimary.baseName,
      classLabel: null,
      groupKey: parsedPrimary.groupKey,
      isGroup: true,
      classCount: sortedClasses.length,
      patrimonio: patrimonioTotal,
      patrimonioTotal,
      primaryFondo: primary.fondo,
      tna: primary.tna,
      tea: primary.tea,
      vcp: primary.vcp,
      children: sortedClasses.map((row) => {
        const child = toClassRow(row)
        // In tree view, show the class label as the main name for clarity
        return {
          ...child,
          displayName: child.classLabel || child.fondo,
        }
      }),
    })
  }

  return result
}

export function toFlatFundCatalogRows(rows: FundCatalogRow[]): FundCatalogGroupRow[] {
  return rows.map((row) => toClassRow(row))
}

export function findSiblingFundClasses(
  allFunds: FundCatalogRow[],
  fundName: string,
  options?: { fondoId?: string | null },
): {
  baseName: string
  classLabel: string | null
  siblings: FundCatalogGroupRow[]
  patrimonioTotal: number | null
} {
  const parsed = parseFundClassName(fundName)
  const fondoId = options?.fondoId?.trim() || null

  const byFondoId =
    fondoId != null ? allFunds.filter((row) => row.fondoId != null && row.fondoId === fondoId) : []

  const matched =
    byFondoId.length > 0
      ? byFondoId
      : allFunds.filter((row) => parseFundClassName(row.fondo).groupKey === parsed.groupKey)

  const siblings = matched
    .sort((a, b) =>
      compareClassLabels(
        parseFundClassName(a.fondo).classLabel,
        parseFundClassName(b.fondo).classLabel,
      ),
    )
    .map((row) => toClassRow(row))

  return {
    baseName: parsed.baseName,
    classLabel: parsed.classLabel,
    siblings,
    patrimonioTotal: sumPatrimonio(siblings),
  }
}

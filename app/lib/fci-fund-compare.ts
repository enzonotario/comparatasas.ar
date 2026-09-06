import type { FundCatalogRow } from '../composables/useFondosCatalog'
import { isFundReportActive } from './fci-fund-active'
import {
  formatCompactPatrimonio,
  isUsdCurrency,
  normalizeCurrencyCode,
  toArsPatrimonio,
} from './fci-fund-formatters'
import { groupFundCatalogRows, type FundCatalogGroupRow } from './fci-fund-groups'
import { normalizeFundSlug } from './funds-detail'

export const FCI_COMPARE_DEFAULT_COUNT = 3
export const FCI_COMPARE_MAX_COUNT = 6
export const FCI_COMPARE_DEFAULT_CURRENCY: FciCompareCurrency = 'ARS'

export type FciCompareCurrency = 'ARS' | 'USD'

export interface FciCompareFund extends FundCatalogGroupRow {
  /** Clave estable para selección / query (?fondos=). */
  compareKey: string
  /** Patrimonio comparable en ARS (USD → MEP). */
  patrimonioEnArs: number | null
  /** Posición 1-based en el ranking por patrimonio (catálogo filtrado). */
  patrimonioRank: number
  /** Posición 1-based en la selección actual. */
  rank: number
}

export interface FciCompareFundOption {
  value: string
  label: string
  typeLabel: string
  administradora: string
  patrimonioLabel: string
  /** Para ordenar opciones: mayor patrimonio primero. */
  patrimonioSort: number
}

export function isFciCompareCurrency(value: unknown): value is FciCompareCurrency {
  return value === 'ARS' || value === 'USD'
}

function catalogRowCurrency(row: FundCatalogGroupRow | FundCatalogRow) {
  return row.monedaInversion || row.moneda
}

function catalogRowPatrimonioValue(row: FundCatalogGroupRow) {
  return row.isGroup ? row.patrimonioTotal : row.patrimonio
}

function matchesCompareCurrency(
  row: FundCatalogRow | FundCatalogGroupRow,
  currency: FciCompareCurrency,
) {
  return normalizeCurrencyCode(catalogRowCurrency(row)) === currency
}

function patrimonioSortValue(
  row: FundCatalogGroupRow,
  usdArsRate: number | null | undefined,
  currency?: FciCompareCurrency | null,
): number {
  const value = catalogRowPatrimonioValue(row)
  if (value == null || !Number.isFinite(value)) return -1

  // Dentro de una moneda, el AUM es comparable sin conversión.
  if (currency) return value

  const rowCurrency = catalogRowCurrency(row)
  if (isUsdCurrency(rowCurrency)) {
    return toArsPatrimonio(value, rowCurrency, usdArsRate) ?? -1
  }

  return value
}

export function getFundCompareKey(
  row: Pick<FundCatalogGroupRow, 'baseName' | 'groupKey' | 'fondo'>,
) {
  return normalizeFundSlug(row.baseName || row.groupKey || row.fondo)
}

function toCompareFund(
  row: FundCatalogGroupRow,
  patrimonioRank: number,
  usdArsRate: number | null | undefined,
  selectionRank = patrimonioRank,
): FciCompareFund {
  const currency = catalogRowCurrency(row)
  const patrimonio = catalogRowPatrimonioValue(row)
  return {
    ...row,
    compareKey: getFundCompareKey(row),
    patrimonioEnArs: toArsPatrimonio(patrimonio, currency, usdArsRate),
    patrimonioRank,
    rank: selectionRank,
  }
}

function activeGroupedFunds(
  rows: FundCatalogRow[],
  {
    usdArsRate = null,
    onlyActive = true,
    now = new Date(),
    currency = null,
  }: {
    usdArsRate?: number | null
    onlyActive?: boolean
    now?: Date
    currency?: FciCompareCurrency | null
  } = {},
): FciCompareFund[] {
  let source = onlyActive ? rows.filter((row) => isFundReportActive(row.fecha, { now })) : rows

  if (currency) {
    source = source.filter((row) => matchesCompareCurrency(row, currency))
  }

  return [...groupFundCatalogRows(source)]
    .sort(
      (a, b) =>
        patrimonioSortValue(b, usdArsRate, currency) - patrimonioSortValue(a, usdArsRate, currency),
    )
    .map((row, index) => toCompareFund(row, index + 1, usdArsRate))
}

/**
 * Lista de fondos comparables ordenados por patrimonio (clases sumadas).
 * Con `currency`, filtra ARS o USD y rankea en esa moneda.
 */
export function listComparableFunds(
  rows: FundCatalogRow[],
  options: {
    usdArsRate?: number | null
    onlyActive?: boolean
    now?: Date
    currency?: FciCompareCurrency | null
  } = {},
): FciCompareFund[] {
  return activeGroupedFunds(rows, options)
}

export function buildCompareFundOptions(funds: FciCompareFund[]): FciCompareFundOption[] {
  return funds.map((fund) => {
    const currency = catalogRowCurrency(fund)
    const patrimonio = catalogRowPatrimonioValue(fund)
    return {
      value: fund.compareKey,
      label: fund.baseName || fund.displayName,
      typeLabel: fund.typeLabel || '—',
      administradora: fund.administradora || '—',
      patrimonioLabel: formatCompactPatrimonio(patrimonio, currency),
      patrimonioSort: fund.patrimonioEnArs ?? patrimonioSortValue(fund, null, null),
    }
  })
}

/**
 * Selecciona los N fondos con mayor patrimonio (clases sumadas por fondo).
 */
export function pickTopFundsByPatrimonio(
  rows: FundCatalogRow[],
  {
    count = FCI_COMPARE_DEFAULT_COUNT,
    usdArsRate = null,
    onlyActive = true,
    now = new Date(),
    currency = null,
  }: {
    count?: number
    usdArsRate?: number | null
    onlyActive?: boolean
    now?: Date
    currency?: FciCompareCurrency | null
  } = {},
): FciCompareFund[] {
  return listComparableFunds(rows, { usdArsRate, onlyActive, now, currency })
    .slice(0, Math.max(0, count))
    .map((fund, index) => ({
      ...fund,
      rank: index + 1,
    }))
}

export function parseFondosQuery(value: string | null | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function serializeFondosQuery(keys: string[]): string {
  return keys.join(',')
}

function sameKeyList(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  return a.every((key, index) => key === b[index])
}

/**
 * Resuelve la selección del comparador.
 * - `selectedKeys === null`: usa el top por patrimonio (default inicial).
 * - `selectedKeys === []`: selección vacía explícita (el usuario limpió todo).
 * - lista con keys: resuelve esos fondos dentro de la moneda.
 */
export function resolveCompareFunds(
  rows: FundCatalogRow[],
  selectedKeys: string[] | null,
  {
    usdArsRate = null,
    onlyActive = true,
    now = new Date(),
    maxCount = FCI_COMPARE_MAX_COUNT,
    defaultCount = FCI_COMPARE_DEFAULT_COUNT,
    currency = FCI_COMPARE_DEFAULT_CURRENCY,
  }: {
    usdArsRate?: number | null
    onlyActive?: boolean
    now?: Date
    maxCount?: number
    defaultCount?: number
    currency?: FciCompareCurrency
  } = {},
): { funds: FciCompareFund[]; keys: string[]; isDefault: boolean; isEmpty: boolean } {
  const catalog = listComparableFunds(rows, { usdArsRate, onlyActive, now, currency })
  const defaultFunds = catalog.slice(0, Math.max(0, defaultCount))
  const defaultKeys = defaultFunds.map((fund) => fund.compareKey)

  if (selectedKeys == null) {
    return {
      funds: defaultFunds.map((fund, index) => ({ ...fund, rank: index + 1 })),
      keys: defaultKeys,
      isDefault: true,
      isEmpty: defaultKeys.length === 0,
    }
  }

  const requested = [...new Set(selectedKeys.map((key) => key.trim()).filter(Boolean))].slice(
    0,
    Math.max(0, maxCount),
  )

  if (!requested.length) {
    return {
      funds: [],
      keys: [],
      isDefault: false,
      isEmpty: true,
    }
  }

  const byCompareKey = new Map(catalog.map((fund) => [fund.compareKey, fund]))
  const byPrimarySlug = new Map(catalog.map((fund) => [normalizeFundSlug(fund.primaryFondo), fund]))

  const resolved: FciCompareFund[] = []
  const seen = new Set<string>()

  for (const key of requested) {
    const fund = byCompareKey.get(key) ?? byPrimarySlug.get(key)
    if (!fund || seen.has(fund.compareKey)) continue
    seen.add(fund.compareKey)
    resolved.push({
      ...fund,
      rank: resolved.length + 1,
    })
  }

  if (!resolved.length) {
    return {
      funds: [],
      keys: [],
      isDefault: false,
      isEmpty: true,
    }
  }

  const keys = resolved.map((fund) => fund.compareKey)
  return {
    funds: resolved,
    keys,
    isDefault: sameKeyList(keys, defaultKeys),
    isEmpty: false,
  }
}

/** Sentinel en ?fondos= para una selección vacía explícita (no el default). */
export const FCI_COMPARE_EMPTY_QUERY = '-'

export function parseFondosQueryParam(value: string | null | undefined): string[] | null {
  if (value == null) return null
  if (value === FCI_COMPARE_EMPTY_QUERY || value.trim() === '') return []
  return parseFondosQuery(value)
}

export function serializeFondosQueryParam(keys: string[], isDefault: boolean): string | undefined {
  if (isDefault) return undefined
  if (!keys.length) return FCI_COMPARE_EMPTY_QUERY
  return serializeFondosQuery(keys)
}

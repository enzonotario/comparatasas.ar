export function normalizeFundSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getFundDetailPath(nameOrSlug: string): string {
  const slug = normalizeFundSlug(nameOrSlug)
  return `/fondos/${slug}`
}

export type FundDetailTab = 'resumen' | 'historico'

export type FundHistoryPeriod = '1m' | '3m' | '6m' | '1y' | 'ytd' | 'all'

export const DEFAULT_FUND_HISTORY_PERIOD: FundHistoryPeriod = '1y'

export const FUND_HISTORY_PERIODS: FundHistoryPeriod[] = ['1m', '3m', '6m', '1y', 'ytd', 'all']

export function isFundHistoryPeriod(value: unknown): value is FundHistoryPeriod {
  return (
    value === '1m' ||
    value === '3m' ||
    value === '6m' ||
    value === '1y' ||
    value === 'ytd' ||
    value === 'all'
  )
}

export type FundDetailToOptions = {
  tab?: string | null
  periodo?: string | null
}

/** Path or route location that preserves tab/periodo across class changes. */
export function getFundDetailTo(
  nameOrSlug: string,
  options?: FundDetailToOptions,
): string | { path: string; query: Record<string, string> } {
  const path = getFundDetailPath(nameOrSlug)
  const query: Record<string, string> = {}

  if (options?.tab === 'historico') {
    query.tab = 'historico'
  }

  if (
    isFundHistoryPeriod(options?.periodo) &&
    options.periodo !== DEFAULT_FUND_HISTORY_PERIOD
  ) {
    query.periodo = options.periodo
  }

  if (Object.keys(query).length === 0) return path
  return { path, query }
}

/** Lee tab/periodo actuales de la query para armar links entre clases. */
export function getFundDetailToOptionsFromQuery(query: Record<string, unknown> | {
  tab?: unknown
  periodo?: unknown
}): FundDetailToOptions {
  return {
    tab: typeof query.tab === 'string' ? query.tab : undefined,
    periodo: typeof query.periodo === 'string' ? query.periodo : undefined,
  }
}

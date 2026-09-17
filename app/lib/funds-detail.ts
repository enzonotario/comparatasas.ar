/**
 * Slug público de FCI alineado con Argentina Datos / CAFCI:
 * espacios → `-`, el resto de no-alfanuméricos se elimina (p. ej. `27.743` → `27743`).
 */
export function normalizeFundSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
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

function parseLocalHistoryDate(fecha: string) {
  return new Date(`${fecha}T00:00:00`)
}

/** Fecha de corte inclusiva para filtrar el histórico por período. */
export function getFundHistoryPeriodCutoff(latest: Date, period: FundHistoryPeriod): Date | null {
  if (period === 'all') return null

  if (period === 'ytd') {
    return new Date(latest.getFullYear(), 0, 1)
  }

  const cutoff = new Date(latest)

  switch (period) {
    case '1m':
      cutoff.setMonth(cutoff.getMonth() - 1)
      break
    case '3m':
      cutoff.setMonth(cutoff.getMonth() - 3)
      break
    case '6m':
      cutoff.setMonth(cutoff.getMonth() - 6)
      break
    case '1y':
      cutoff.setFullYear(cutoff.getFullYear() - 1)
      break
  }

  return cutoff
}

/**
 * Filtra puntos históricos al período pedido (orden cronológico).
 * Usa la última fecha de la serie como ancla.
 */
export function filterFundHistoryByPeriod<T extends { fecha: string }>(
  points: T[],
  period: FundHistoryPeriod,
): T[] {
  if (!points.length || period === 'all') return points

  const latestFecha = points[points.length - 1]?.fecha
  if (!latestFecha) return points

  const latest = parseLocalHistoryDate(latestFecha)
  if (Number.isNaN(latest.getTime())) return points

  const cutoff = getFundHistoryPeriodCutoff(latest, period)
  if (!cutoff) return points

  return points.filter((point) => {
    const date = parseLocalHistoryDate(point.fecha)
    return !Number.isNaN(date.getTime()) && date >= cutoff
  })
}

export function fundHistoryPeriodLabel(period: FundHistoryPeriod) {
  switch (period) {
    case '1m':
      return 'último mes'
    case '3m':
      return 'últimos 3 meses'
    case '6m':
      return 'últimos 6 meses'
    case '1y':
      return 'último año'
    case 'ytd':
      return 'año en curso'
    case 'all':
      return 'todo el histórico'
  }
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
  const base = getFundDetailPath(nameOrSlug)
  const path = options?.tab === 'historico' ? `${base}/historico` : base
  const query: Record<string, string> = {}

  if (isFundHistoryPeriod(options?.periodo) && options.periodo !== DEFAULT_FUND_HISTORY_PERIOD) {
    query.periodo = options.periodo
  }

  if (Object.keys(query).length === 0) return path
  return { path, query }
}

/** Prefer this for sibling class links when the full route is available. */
export function getFundDetailToOptionsFromRoute(route: {
  path: string
  query: Record<string, unknown>
}): FundDetailToOptions {
  const path = route.path.replace(/\/$/, '')
  const isHistorico = /\/historico$/.test(path)
  return {
    tab: isHistorico ? 'historico' : undefined,
    periodo: typeof route.query.periodo === 'string' ? route.query.periodo : undefined,
  }
}

/** Lee tab/periodo actuales de la query para armar links entre clases. */
export function getFundDetailToOptionsFromQuery(
  query:
    | Record<string, unknown>
    | {
        tab?: unknown
        periodo?: unknown
      },
): FundDetailToOptions {
  return {
    tab: typeof query.tab === 'string' ? query.tab : undefined,
    periodo: typeof query.periodo === 'string' ? query.periodo : undefined,
  }
}

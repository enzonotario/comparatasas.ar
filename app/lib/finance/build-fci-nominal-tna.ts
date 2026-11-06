import type { FciFundDetail, FciFundHistoryItem } from '../../composables/useFciFundDetails'
import { parseFundClassName } from '../fci-fund-class'
import type { StaticNominalTnaEntry, StaticNominalTnaFile } from '../fci-static-nominal-tna'
import { normalizeFundSlug } from '../funds-detail'
import { comparatasasFondos } from '../mappings/funds'
import { nominalTnaRatesFromEstimate, resolveFundNominalTnaEstimate } from './fci-nominal-tna'

// Pure module (no Vue/Nuxt auto-imports): used by the Nitro cached function
// `getFciNominalTna` and testable with a mocked fetch.

export const FCI_API_BASE = 'https://api.argentinadatos.com/v1/finanzas/fci'
export const NOMINAL_TNA_SOURCE = 'argentinadatos-history'

/** Low on purpose: each history response is parsed in full (up to ~1 MB). */
const DEFAULT_CONCURRENCY = 3
/** Only ~2 weeks of VCP are needed for 7D TNA; margin for holidays/lookback tolerance. */
export const HISTORY_LOOKBACK_DAYS = 21
/** Above this share of failed history fetches the upstream is treated as down. */
const MAX_HISTORY_FAILURE_RATIO = 0.5
const DAY_MS = 24 * 60 * 60 * 1000

type CatalogFund = Pick<FciFundDetail, 'nombre' | 'fecha' | 'rendimientos'>
type CatalogLike = { fondos?: CatalogFund[] | null }
type RawHistoryItem = { fecha: string; valorCuotaparte: number | null }
type SlimHistoryPoint = RawHistoryItem

/** Resolves parsed JSON, or `null` for a non-OK response. May throw on network errors. */
export type FetchJson = <T>(url: string) => Promise<T | null>

export interface BuildFciNominalTnaOptions {
  fetchJson: FetchJson
  /** Overrides the catalog fetch (lets the server share one in-flight parse). */
  loadCatalog?: () => Promise<CatalogLike | null>
  concurrency?: number
  now?: () => Date
  logger?: Pick<Console, 'warn'>
}

type Target = CatalogFund & { slug: string }

export async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0
  async function run() {
    while (next < items.length) {
      const item = items[next]!
      next += 1
      await worker(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run))
}

/** Keeps only the VCP points inside the lookback window ending at `asOf`. */
export function trimHistory(historico: RawHistoryItem[], asOf: string | null): SlimHistoryPoint[] {
  if (!asOf) return []
  const cutoffMs = Date.parse(`${asOf}T00:00:00.000Z`) - HISTORY_LOOKBACK_DAYS * DAY_MS
  const trimmed: SlimHistoryPoint[] = []
  for (const item of historico) {
    const time = Date.parse(`${item.fecha}T00:00:00.000Z`)
    if (Number.isFinite(time) && time >= cutoffMs && item.fecha <= asOf) {
      // Copy only the two fields so the full upstream item can be collected.
      trimmed.push({ fecha: item.fecha, valorCuotaparte: item.valorCuotaparte })
    }
  }
  return trimmed
}

/** Curated funds plus every sibling class of the same fund family. */
export function selectNominalTnaTargets(fondos: CatalogFund[]): Target[] {
  const curated = new Set<string>(comparatasasFondos)
  const curatedGroupKeys = new Set<string>()
  for (const fund of fondos) {
    if (curated.has(normalizeFundSlug(fund.nombre))) {
      curatedGroupKeys.add(parseFundClassName(fund.nombre).groupKey)
    }
  }
  curatedGroupKeys.delete('')

  const targets: Target[] = []
  for (const fund of fondos) {
    const slug = normalizeFundSlug(fund.nombre)
    if (curated.has(slug) || curatedGroupKeys.has(parseFundClassName(fund.nombre).groupKey)) {
      targets.push({
        slug,
        nombre: fund.nombre,
        fecha: fund.fecha,
        rendimientos: fund.rendimientos,
      })
    }
  }
  return targets
}

// Separate scope so the (large) parsed catalog is unreachable once targets exist.
async function loadTargets(options: BuildFciNominalTnaOptions): Promise<Target[]> {
  const catalog = options.loadCatalog
    ? await options.loadCatalog()
    : await options.fetchJson<CatalogLike>(`${FCI_API_BASE}/fondos`)
  if (!catalog?.fondos?.length) {
    throw new Error('[fci-tna] Could not read the ArgentinaDatos FCI catalog')
  }
  return selectNominalTnaTargets(catalog.fondos)
}

// Fetches one history and returns only the trimmed points (raw payload is dropped here).
async function fetchTrimmedHistory(
  fetchJson: FetchJson,
  target: Target,
): Promise<SlimHistoryPoint[] | null> {
  const history = await fetchJson<{ historico?: RawHistoryItem[] }>(
    `${FCI_API_BASE}/fondos/${target.slug}/historico`,
  )
  if (!history) return null
  return trimHistory(history.historico ?? [], target.fecha)
}

function toHistoryItems(target: Target, points: SlimHistoryPoint[]): FciFundHistoryItem[] {
  return points.map((point) => ({
    slug: target.slug,
    fondoId: null,
    claseId: null,
    nombre: target.nombre,
    fecha: point.fecha,
    categoria: null,
    categoriaKey: null,
    horizonte: null,
    valorCuotaparte: point.valorCuotaparte,
    patrimonio: null,
    retornoDiario: null,
    retornoAcumulado: null,
    flujoEstimado: null,
    origen: 'runtime',
  }))
}

function estimateEntry(target: Target, points: SlimHistoryPoint[]): StaticNominalTnaEntry | null {
  const estimate = resolveFundNominalTnaEstimate(
    { fecha: target.fecha, rendimientos: target.rendimientos },
    {
      fondoId: '',
      claseId: '',
      nombre: target.nombre,
      fechaActualizacion: target.fecha || '',
      historico: toHistoryItems(target, points),
    },
  )
  if (!estimate) return null

  const rates = nominalTnaRatesFromEstimate(estimate)
  if (rates.tna == null || rates.tea == null) return null

  return {
    tna: rates.tna,
    tea: rates.tea,
    retorno30d: target.rendimientos?.unMes ?? null,
    estimate,
  }
}

/**
 * Nominal TNA/TEA estimates for curated funds and their sibling classes, from
 * the upstream catalog plus a trimmed VCP history per fund.
 *
 * Throws when the catalog is unavailable or most history fetches fail, so
 * callers can keep a previous value instead of caching a degraded one.
 */
export async function buildFciNominalTnaFile(
  options: BuildFciNominalTnaOptions,
): Promise<StaticNominalTnaFile> {
  const { fetchJson, logger = console } = options
  const targets = await loadTargets(options)
  const bySlug: Record<string, StaticNominalTnaEntry> = {}
  let failedHistories = 0

  await mapPool(targets, options.concurrency ?? DEFAULT_CONCURRENCY, async (target) => {
    let points: SlimHistoryPoint[] | null = null
    try {
      points = await fetchTrimmedHistory(fetchJson, target)
    } catch (error) {
      logger.warn(`[fci-tna] History fetch failed for ${target.slug}:`, error)
    }
    if (points == null) failedHistories += 1

    try {
      const entry = estimateEntry(target, points ?? [])
      if (entry) bySlug[target.slug] = entry
    } catch (error) {
      logger.warn(`[fci-tna] Estimate failed for ${target.slug}:`, error)
    }
  })

  if (targets.length > 0 && failedHistories > targets.length * MAX_HISTORY_FAILURE_RATIO) {
    throw new Error(
      `[fci-tna] ${failedHistories}/${targets.length} history fetches failed; upstream looks unavailable`,
    )
  }

  const count = Object.keys(bySlug).length
  if (targets.length > 0 && count === 0) {
    throw new Error('[fci-tna] No nominal TNA estimate could be computed')
  }

  return {
    generatedAt: (options.now?.() ?? new Date()).toISOString(),
    source: NOMINAL_TNA_SOURCE,
    count,
    bySlug,
  }
}

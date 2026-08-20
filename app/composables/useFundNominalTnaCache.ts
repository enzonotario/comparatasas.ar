import {
  fetchFciFundDetail,
  fetchFciFundHistory,
  type FciFundDetail,
} from '~/composables/useFciFundDetails'
import type { FundCatalogRow } from '~/composables/useFondosCatalog'
import {
  nominalTnaRatesFromEstimate,
  resolveFundNominalTnaEstimate,
} from '~/lib/finance/fci-nominal-tna'
import type { NominalTnaEstimate } from '~/lib/finance/fci-comparatasas-returns'
import { normalizeFundSlug } from '~/lib/funds-detail'

const estimateCache = new Map<string, NominalTnaEstimate | null>()
const inflight = new Map<string, Promise<NominalTnaEstimate | null>>()
const enrichedVersion = ref(0)

function bumpEnrichedVersion() {
  enrichedVersion.value += 1
}

export async function fetchFundNominalTnaEstimate(slug: string): Promise<NominalTnaEstimate | null> {
  const normalized = normalizeFundSlug(slug)
  if (!normalized) return null

  if (estimateCache.has(normalized)) {
    return estimateCache.get(normalized) ?? null
  }

  const pending = inflight.get(normalized)
  if (pending) return pending

  const request = (async () => {
    try {
      const [fund, history] = await Promise.all([
        fetchFciFundDetail(normalized),
        fetchFciFundHistory(normalized).catch(() => null),
      ])

      const estimate = resolveFundNominalTnaEstimate(fund, history)
      estimateCache.set(normalized, estimate)
      return estimate
    } catch {
      estimateCache.set(normalized, null)
      return null
    } finally {
      inflight.delete(normalized)
    }
  })()

  inflight.set(normalized, request)
  const estimate = await request
  bumpEnrichedVersion()
  return estimate
}

export async function fetchFundNominalTnaEstimates(slugs: string[]) {
  const unique = [...new Set(slugs.map((slug) => normalizeFundSlug(slug)).filter(Boolean))]
  if (!unique.length) return {} as Record<string, NominalTnaEstimate | null>

  await Promise.allSettled(unique.map((slug) => fetchFundNominalTnaEstimate(slug)))

  return Object.fromEntries(unique.map((slug) => [slug, estimateCache.get(slug) ?? null]))
}

export function seedFundNominalTnaEstimate(
  slug: string,
  fund: FciFundDetail,
  history?: Awaited<ReturnType<typeof fetchFciFundHistory>> | null,
) {
  const normalized = normalizeFundSlug(slug)
  if (!normalized) return null

  const estimate = resolveFundNominalTnaEstimate(fund, history)
  estimateCache.set(normalized, estimate)
  bumpEnrichedVersion()
  return estimate
}

export function getCachedFundNominalTnaEstimate(slug: string) {
  return estimateCache.get(normalizeFundSlug(slug)) ?? null
}

export function getCachedFundNominalTnaPercent(slug: string) {
  return getCachedFundNominalTnaEstimate(slug)?.value ?? null
}

export function resolveFundNominalTnaFromDetail(fund: FciFundDetail) {
  const slug = normalizeFundSlug(fund.nombre)
  const cached = getCachedFundNominalTnaEstimate(slug)
  if (cached) return cached

  return resolveFundNominalTnaEstimate(fund, null)
}

export function applyCachedNominalTnaToCatalogRow(row: FundCatalogRow): FundCatalogRow {
  const estimate = getCachedFundNominalTnaEstimate(row.fondo)
  if (!estimate) return row

  const rates = nominalTnaRatesFromEstimate(estimate)
  return {
    ...row,
    tna: rates.tna,
    tea: rates.tea,
  }
}

export function useEnrichedCatalogFunds(catalogRows: Ref<FundCatalogRow[]>) {
  return computed(() => {
    enrichedVersion.value
    return catalogRows.value.map((row) => applyCachedNominalTnaToCatalogRow(row))
  })
}

export function useFundNominalTnaEnrichment() {
  async function enrichSlugs(slugs: string[]) {
    await fetchFundNominalTnaEstimates(slugs)
  }

  function tnaForFondo(fondo: string, fallback: number | null | undefined) {
    const rates = nominalTnaRatesFromEstimate(getCachedFundNominalTnaEstimate(fondo))
    return rates.tna ?? fallback ?? null
  }

  return {
    enrichSlugs,
    tnaForFondo,
  }
}

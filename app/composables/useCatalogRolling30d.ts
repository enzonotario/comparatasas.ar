import { normalizeFundSlug } from '~/lib/funds-detail'
import { computeRendimientosFromHistory } from '~/lib/finance/fci-history-returns'
import { fetchFciFundHistory } from '~/composables/useFciFundDetails'
import type { FundCatalogRow } from '~/composables/useFondosCatalog'

type RollingCacheEntry = {
  value: number | null
  status: 'ready' | 'loading' | 'error'
}

const CONCURRENCY = 4
/** Evita martillar /historico en el catálogo completo (~4800 fondos). */
export const CATALOG_ROLLING_30D_MAX_FUNDS = 120

/**
 * Sobreescribe `retorno30d` con ~30D rolling (mismo criterio que el detalle).
 * Pensado para búsquedas / filtros chicos mientras la API aún sirve `unMes` CNV.
 */
export function useCatalogRolling30d() {
  const cache = useState<Record<string, RollingCacheEntry>>('fci-catalog-rolling-30d', () => ({}))

  async function enrichFunds(rows: FundCatalogRow[]) {
    const pending = rows
      .map((row) => ({ row, slug: normalizeFundSlug(row.fondo) }))
      .filter(({ slug }) => {
        if (!slug) return false
        const entry = cache.value[slug]
        return entry?.status !== 'ready' && entry?.status !== 'loading'
      })

    if (!pending.length) return

    let index = 0

    async function worker() {
      while (index < pending.length) {
        const current = pending[index++]
        if (!current) break

        const { slug, row } = current
        cache.value = {
          ...cache.value,
          [slug]: { value: null, status: 'loading' },
        }

        try {
          const history = await fetchFciFundHistory(slug)
          const points = history.historico ?? []
          const latest = points.length ? points[points.length - 1] : null

          const rendimientos = computeRendimientosFromHistory({
            fecha: latest?.fecha ?? row.fecha,
            valorCuotaparte: latest?.valorCuotaparte ?? row.vcp,
            variacionDiariaPct: row.retorno1d,
            variacionUnMesPct: row.retorno30d,
            variacionEnElAnioPct: row.retornoYtd,
            history: points.map((item) => ({
              fecha: item.fecha,
              valorCuotaparte: item.valorCuotaparte,
            })),
          })

          cache.value = {
            ...cache.value,
            [slug]: { value: rendimientos.unMes, status: 'ready' },
          }
        } catch {
          cache.value = {
            ...cache.value,
            [slug]: { value: row.retorno30d, status: 'error' },
          }
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () => worker()),
    )
  }

  function applyRolling30d(rows: FundCatalogRow[]): FundCatalogRow[] {
    return rows.map((row) => {
      const entry = cache.value[normalizeFundSlug(row.fondo)]
      if (!entry || entry.status !== 'ready' || entry.value == null) {
        return row
      }
      if (row.retorno30d === entry.value) {
        return row
      }
      return { ...row, retorno30d: entry.value }
    })
  }

  return {
    cache,
    enrichFunds,
    applyRolling30d,
  }
}

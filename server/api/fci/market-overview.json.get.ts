import { buildFciMarketSnapshot } from '../../../app/lib/fci-market-overview'
import type { FciFundsDetailsResponse } from '../../../app/composables/useFciFundDetails'

const UPSTREAM_CATALOG_URL = 'https://api.argentinadatos.com/v1/finanzas/fci/fondos'

// Aggregated market snapshot computed from the full upstream catalog once per
// cache window. Cache key ignores the query string on purpose.
export default defineCachedEventHandler(
  async () => buildFciMarketSnapshot(await $fetch<FciFundsDetailsResponse>(UPSTREAM_CATALOG_URL)),
  {
    name: 'fci-market-overview',
    maxAge: 60 * 60,
    swr: true,
    getKey: () => 'v1',
  },
)

import type { FciFundsDetailsResponse } from '../../app/composables/useFciFundDetails'
import { FCI_API_BASE } from '../../app/lib/finance/build-fci-nominal-tna'

const UPSTREAM_CATALOG_URL = `${FCI_API_BASE}/fondos`

let inFlight: Promise<FciFundsDetailsResponse> | null = null

// The upstream catalog is ~31 MB of JSON. Concurrent callers (catalog rows,
// nominal TNA, market overview) share one download/parse. The promise is only
// kept while pending so the parsed object can be collected afterwards.
export function fetchFciUpstreamCatalog(): Promise<FciFundsDetailsResponse> {
  if (!inFlight) {
    inFlight = $fetch<FciFundsDetailsResponse>(UPSTREAM_CATALOG_URL, { timeout: 60_000 }).finally(
      () => {
        inFlight = null
      },
    )
  }
  return inFlight
}

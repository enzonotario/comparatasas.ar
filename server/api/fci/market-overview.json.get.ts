import { buildFciMarketSnapshot } from '../../../app/lib/fci-market-overview'

// Aggregated market snapshot computed from the full upstream catalog once per
// cache window. Cache key ignores the query string on purpose.
export default defineCachedEventHandler(
  async () => buildFciMarketSnapshot(await fetchFciUpstreamCatalog()),
  {
    name: 'fci-market-overview',
    maxAge: 60 * 60,
    swr: true,
    getKey: () => 'v1',
  },
)

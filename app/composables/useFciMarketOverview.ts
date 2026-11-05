import type { FciMarketSnapshot } from '~/lib/fci-market-overview'

export function useFciMarketOverview() {
  const {
    data: snapshot,
    pending: loading,
    error,
    refresh,
  } = useAsyncData('fci-market-overview', async () => {
    // Server-side cached route; avoids parsing the full upstream catalog per render.
    return await $fetch<FciMarketSnapshot>('/api/fci/market-overview.json')
  })

  return {
    snapshot,
    loading,
    error,
    refresh,
  }
}

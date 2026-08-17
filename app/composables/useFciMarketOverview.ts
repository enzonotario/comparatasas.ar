import { buildFciMarketSnapshot } from '~/lib/fci-market-overview'
import { fetchFciFundsCatalog } from '~/composables/useFciFundDetails'

export function useFciMarketOverview() {
  const {
    data: snapshot,
    pending: loading,
    error,
    refresh,
  } = useAsyncData('fci-market-overview', async () => {
    return buildFciMarketSnapshot(await fetchFciFundsCatalog())
  })

  return {
    snapshot,
    loading,
    error,
    refresh,
  }
}

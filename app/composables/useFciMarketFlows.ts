import {
  buildMarketFlowSnapshot,
  parseFciSerieItem,
  type FciSerieKey,
  type MarketFlowSnapshot,
  type MarketHistorySnapshot,
  FCI_SERIES_KEYS,
} from '~/lib/fci-market-flows'

const SERIES_BASE = 'https://api.argentinadatos.com/v1/finanzas/fci'

type RawSerieItem = {
  fondo?: string
  horizonte?: string | null
  fecha?: string | null
  vcp?: number | null
  ccp?: number | null
  patrimonio?: number | null
}

async function fetchSerieItems(key: FciSerieKey, which: 'ultimo' | 'penultimo') {
  try {
    const raw = await $fetch<RawSerieItem[]>(`${SERIES_BASE}/${key}/${which}`)
    return (Array.isArray(raw) ? raw : [])
      .map((item) => parseFciSerieItem(item))
      .filter((item): item is NonNullable<typeof item> => item != null)
  } catch {
    return []
  }
}

async function fetchMarketHistory() {
  try {
    return await $fetch<MarketHistorySnapshot>(`${SERIES_BASE}/mercado/historico`)
  } catch {
    return null
  }
}

export function useFciMarketFlows() {
  const {
    data,
    pending: loading,
    error,
    refresh,
  } = useAsyncData('fci-market-flows', async () => {
    const [history, ...pairs] = await Promise.all([
      fetchMarketHistory(),
      ...FCI_SERIES_KEYS.map(async (key) => {
        const [ultimo, penultimo] = await Promise.all([
          fetchSerieItems(key, 'ultimo'),
          fetchSerieItems(key, 'penultimo'),
        ])
        return [key, { ultimo, penultimo }] as const
      }),
    ])

    const series = Object.fromEntries(pairs) as Parameters<typeof buildMarketFlowSnapshot>[0]
    const flows = buildMarketFlowSnapshot(series)
    const puntos = history?.puntos?.filter((point) => point.conPatrimonio > 0) ?? []

    return {
      flows,
      history: puntos.length
        ? { fechaActualizacion: history?.fechaActualizacion ?? null, puntos }
        : null,
    }
  })

  return {
    flows: computed<MarketFlowSnapshot | null>(() => data.value?.flows ?? null),
    history: computed<MarketHistorySnapshot | null>(() => data.value?.history ?? null),
    loading,
    error,
    refresh,
  }
}

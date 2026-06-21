import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { fetchFciFundDetail, fetchFciFundHistory } from '~/composables/useFciFundDetails'

async function fetchFundDetailSafe(slug: string) {
  try {
    return await fetchFciFundDetail(slug)
  } catch (error: unknown) {
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : undefined

    if (statusCode === 404) {
      return null
    }

    throw error
  }
}

async function fetchFundHistorySafe(slug: string) {
  try {
    return await fetchFciFundHistory(slug)
  } catch {
    return null
  }
}

export async function useFciFundDetailPage(slugSource: MaybeRefOrGetter<string>) {
  const slug = computed(() => String(toValue(slugSource) || ''))

  const { data, status, error } = await useAsyncData(
    () => `fci-fund-detail:${slug.value}`,
    async () => fetchFundDetailSafe(slug.value),
  )

  const {
    data: historyData,
    status: historyStatus,
    error: historyError,
    refresh: loadHistory,
  } = await useAsyncData(
    () => `fci-fund-history:${slug.value}`,
    async () => {
      if (!data.value) return null
      return await fetchFundHistorySafe(slug.value)
    },
    {
      default: () => null,
    },
  )

  const fundDetail = computed(() => data.value ?? null)
  const fundHistory = computed(() => historyData.value ?? null)

  async function ensureHistoryLoaded() {
    if (fundHistory.value || historyStatus.value === 'pending') return
    await loadHistory()
  }

  return {
    slug,
    fundDetail,
    fundHistory,
    status,
    error,
    historyStatus,
    historyError,
    loadHistory,
    ensureHistoryLoaded,
  }
}

import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { fetchFciFundDetail, fetchFciFundHistory } from '~/composables/useFciFundDetails'

export async function useFciFundDetailPage(slugSource: MaybeRefOrGetter<string>) {
  const slug = computed(() => String(toValue(slugSource) || ''))

  const {
    data: historyData,
    status: historyStatus,
    error: historyError,
    execute: loadHistory,
  } = useLazyAsyncData(
    () => `fci-fund-history:${slug.value}`,
    async () => fetchFciFundHistory(slug.value),
    {
      immediate: false,
      server: false,
      default: () => null,
    },
  )

  const { data, status, error } = await useAsyncData(
    () => `fci-fund-detail:${slug.value}`,
    async () => fetchFciFundDetail(slug.value),
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

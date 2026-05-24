<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import FciFundHeaderCard from '~/components/funds/detail/FciFundHeaderCard.vue'
import FciFundHistoryTab from '~/components/funds/detail/FciFundHistoryTab.vue'
import FciFundSummaryTab from '~/components/funds/detail/FciFundSummaryTab.vue'

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.nombre || ''))

function goBack() {
  if (window.history.length > 1 && document.referrer) {
    try {
      const referrerHost = new URL(document.referrer).hostname
      if (referrerHost === window.location.hostname) {
        router.back()
        return
      }
    } catch {}
  }
  router.push('/fondos')
}
const selectedDetailTab = ref('resumen')

const detailTabs: TabsItem[] = [
  {
    label: 'Resumen',
    value: 'resumen',
    slot: 'resumen' as const,
  },
  {
    label: 'Histórico',
    value: 'historico',
    slot: 'historico' as const,
  },
]

const { fundDetail, fundHistory, status, error, historyStatus, historyError, ensureHistoryLoaded } =
  await useFciFundDetailPage(slug)

if (error.value?.statusCode === 404) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Fondo no encontrado',
  })
}

const {
  historyRows,
  latestHistoryPoint,
  oldestHistoryPoint,
  compositionRows,
  maxCompositionPercentage,
  feeRows,
  returnsRows,
  returnsColumns,
  historyColumns,
} = useFciFundPresentation(fundDetail, fundHistory)

watch(
  selectedDetailTab,
  async (tab) => {
    if (tab !== 'historico') return
    await ensureHistoryLoaded()
  },
  { immediate: true },
)

definePageMeta({
  pageTitle: 'Detalle de FCI',
  pageDescription: 'Información detallada de un fondo común de inversión.',
})

useSeoMeta({
  title: () =>
    fundDetail.value ? `${fundDetail.value.nombre} - Fondo común de inversión` : 'Detalle de FCI',
  description: () =>
    fundDetail.value
      ? `Detalle, composición, rendimientos e histórico de ${fundDetail.value.nombre}.`
      : 'Información detallada de un fondo común de inversión.',
  ogTitle: () =>
    fundDetail.value
      ? `${fundDetail.value.nombre} - Compara Tasas`
      : 'Detalle de FCI - Compara Tasas',
  ogDescription: () =>
    fundDetail.value
      ? `Consultá rendimientos, composición, honorarios e histórico de ${fundDetail.value.nombre}.`
      : 'Información detallada de un fondo común de inversión.',
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" @click="goBack">
        Volver a fondos
      </UButton>
      <UBadge color="neutral" variant="outline">FCI</UBadge>
    </div>

    <FundsLoading v-if="status === 'pending' && !fundDetail" />

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      title="No se pudo cargar el detalle del fondo"
      description="Probá nuevamente en unos instantes o volvé al listado de fondos."
    />

    <FciFundHeaderCard
      v-else-if="fundDetail"
      :fund-detail="fundDetail"
      :history-updated-at="fundHistory?.fechaActualizacion"
    >
      <UTabs
        v-model="selectedDetailTab"
        :items="detailTabs"
        color="neutral"
        variant="link"
        class="w-full"
      >
        <template #resumen>
          <FciFundSummaryTab
            :fund-detail="fundDetail"
            :returns-rows="returnsRows"
            :returns-columns="returnsColumns"
            :composition-rows="compositionRows"
            :max-composition-percentage="maxCompositionPercentage"
            :fee-rows="feeRows"
          />
        </template>

        <template #historico>
          <FciFundHistoryTab
            :fund-history="fundHistory"
            :history-status="historyStatus"
            :history-error="historyError"
            :history-rows="historyRows"
            :oldest-history-point="oldestHistoryPoint"
            :latest-history-point="latestHistoryPoint"
            :history-columns="historyColumns"
          />
        </template>
      </UTabs>
    </FciFundHeaderCard>
  </div>
</template>

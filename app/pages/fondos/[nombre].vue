<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import FciFundHeaderCard from '~/components/funds/detail/FciFundHeaderCard.vue'
import FciFundHistoryTab from '~/components/funds/detail/FciFundHistoryTab.vue'
import FciFundSummaryTab from '~/components/funds/detail/FciFundSummaryTab.vue'
import { getInstitutionUrl } from '~/lib/mappings/institutions'
import { getFundMappingBySlug } from '~/lib/mappings/funds'

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.nombre || ''))
const fundMapping = computed(() => getFundMappingBySlug(slug.value))
const mappedFundInstitution = computed(
  () =>
    fundMapping.value?.institutions.find(
      (item) => item.fundUrl || item.url || getInstitutionUrl(item.institution),
    ) || null,
)

const mappedFundUrl = computed(() => {
  const institution = mappedFundInstitution.value
  if (!institution) return null

  const url = institution.fundUrl || institution.url || getInstitutionUrl(institution.institution)
  return url || null
})

const cafciUrl = computed(() => {
  if (!fundDetail.value) return null

  return `https://estadisticas.cafci.org.ar/fondos/${fundDetail.value.fondoId}?clase=${fundDetail.value.claseId}`
})

function goBack() {
  if (window.history.length > 1 && document.referrer) {
    try {
      const referrerHost = new URL(document.referrer).hostname
      if (referrerHost === window.location.hostname) {
        router.back()
        return
      }
    } catch (error) {
      console.warn('Invalid referrer while going back from fond detail', error)
    }
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

const mappedFundLabel = computed(() => {
  const institution = mappedFundInstitution.value
  if (!institution) return 'Ver sitio del fondo'

  return institution.displayName ? `Ir a ${institution.displayName}` : 'Ver sitio del fondo'
})

const { fundDetail, fundHistory, status, error, historyStatus, historyError, ensureHistoryLoaded } =
  await useFciFundDetailPage(slug)

const showNotFound = computed(() => !fundDetail.value && status.value === 'success')

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
        Volver
      </UButton>
      <UBadge color="neutral" variant="outline">FCI</UBadge>
      <div class="ml-auto flex items-center gap-2">
        <UButton
          v-if="mappedFundUrl"
          :to="mappedFundUrl"
          external
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          icon="i-lucide-external-link"
          :label="mappedFundLabel"
        />

        <UButton
          v-if="cafciUrl"
          :to="cafciUrl"
          external
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="outline"
          icon="i-lucide-external-link"
          label="Ver en CAFCI"
        />
      </div>
    </div>

    <FundsLoading v-if="status === 'pending' && !fundDetail" />

    <UAlert
      v-else-if="showNotFound"
      color="warning"
      variant="soft"
      title="Fondo no encontrado"
      description="No encontramos información para este fondo. Volvé al listado para explorar otros FCI."
    />

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

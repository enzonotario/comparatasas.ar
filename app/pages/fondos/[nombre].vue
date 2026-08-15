<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import FciFundHeaderCard from '~/components/funds/detail/FciFundHeaderCard.vue'
import FciFundHistoryTab from '~/components/funds/detail/FciFundHistoryTab.vue'
import FciFundSummaryTab from '~/components/funds/detail/FciFundSummaryTab.vue'
import FciFundSiblingClasses from '~/components/funds/detail/FciFundSiblingClasses.vue'
import {
  formatCompactNumber,
  formatDecimal,
  formatPercentAuto,
  normalizeCurrencyCode,
} from '~/lib/fci-fund-formatters'
import { findSiblingFundClasses } from '~/lib/fci-fund-groups'
import { parseFundClassName } from '~/lib/fci-fund-class'
import { getFundDetailPath } from '~/lib/funds-detail'
import { getInstitutionUrl } from '~/lib/mappings/institutions'
import { getFundMappingBySlug, getFundTypeInfo } from '~/lib/mappings/funds'

definePageMeta({
  layout: 'fondos',
  pageTitle: 'Detalle de FCI',
  pageDescription: 'Información detallada de un fondo común de inversión.',
})

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
  useFciFundDetailPage(slug)

const { allFunds } = useFondosCatalog()

const siblingInfo = computed(() => {
  const name = fundDetail.value?.nombre
  if (!name) {
    return {
      baseName: '',
      classLabel: null as string | null,
      siblings: [],
      patrimonioTotal: null as number | null,
    }
  }
  return findSiblingFundClasses(allFunds.value, name, {
    fondoId: fundDetail.value?.fondoId,
  })
})

const classSwitcherItems = computed(() =>
  siblingInfo.value.siblings.map((row) => ({
    label: row.classLabel || row.fondo,
    value: row.fondo,
    to: getFundDetailPath(row.fondo),
    active: row.fondo === fundDetail.value?.nombre,
  })),
)

const parsedFundName = computed(() => parseFundClassName(fundDetail.value?.nombre))

const showNotFound = computed(() => !fundDetail.value && status.value === 'success')

const {
  historyRows,
  historyChronological,
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
  [selectedDetailTab, fundDetail],
  async ([tab]) => {
    if (!fundDetail.value) return
    if (tab === 'historico') {
      await ensureHistoryLoaded()
    }
  },
  { immediate: true },
)

const navbarTitle = computed(() => {
  if (!fundDetail.value) return 'Detalle de FCI'
  if (parsedFundName.value.classLabel) {
    return `${parsedFundName.value.baseName} · ${parsedFundName.value.classLabel}`
  }
  return fundDetail.value.nombre
})

const tipoRentaLabel = computed(() => {
  if (!fundDetail.value) return '—'
  return getFundTypeInfo(fundDetail.value.tipoRenta)?.typeLabel || fundDetail.value.tipoRenta || '—'
})

const kpiItems = computed(() => {
  if (!fundDetail.value) return []

  const unMes = fundDetail.value.rendimientos?.unMes ?? null
  const items = [
    {
      label: 'Patrimonio clase',
      value: formatCompactNumber(fundDetail.value.patrimonio),
      icon: 'i-lucide-landmark',
    },
    {
      label: 'Valor cuotaparte',
      value: formatDecimal(fundDetail.value.rendimientos?.valorCuotaparte),
      icon: 'i-lucide-circle-dollar-sign',
    },
    {
      label: 'Rend. 1 mes',
      value: formatPercentAuto(unMes),
      icon: 'i-lucide-trending-up',
    },
    {
      label: 'Liquidación',
      value:
        fundDetail.value.plazoLiquidacionDias != null
          ? `T+${fundDetail.value.plazoLiquidacionDias}`
          : '—',
      icon: 'i-lucide-timer',
    },
  ]

  if (siblingInfo.value.siblings.length > 1) {
    items.unshift({
      label: 'Patrimonio total',
      value: formatCompactNumber(siblingInfo.value.patrimonioTotal),
      icon: 'i-lucide-layers',
    })
  }

  return items
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
  <UDashboardPanel id="fondos-detail">
    <template #header>
      <UDashboardNavbar :title="navbarTitle">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge color="neutral" variant="outline">FCI</UBadge>
          <UBadge
            v-if="fundDetail?.tipoRenta"
            color="neutral"
            variant="subtle"
            :label="tipoRentaLabel"
          />
          <UBadge
            v-if="fundDetail?.moneda"
            color="neutral"
            variant="subtle"
            :label="normalizeCurrencyCode(fundDetail.moneda)"
          />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            label="Volver"
            class="hidden sm:inline-flex"
            @click="goBack"
          />

          <UButton
            v-if="mappedFundUrl"
            :to="mappedFundUrl"
            external
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            icon="i-lucide-external-link"
            :label="mappedFundLabel"
            class="hidden md:inline-flex"
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
            label="CAFCI"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="fundDetail && siblingInfo.siblings.length > 1">
        <template #left>
          <div class="flex flex-wrap items-center gap-1.5 -ms-1">
            <span class="text-xs text-muted mr-1">Clases</span>
            <UButton
              v-for="item in classSwitcherItems"
              :key="item.value"
              size="xs"
              color="neutral"
              :variant="item.active ? 'solid' : 'outline'"
              :to="item.active ? undefined : item.to"
              :label="item.label"
            />
          </div>
        </template>

        <template #right>
          <div class="text-xs text-muted text-right">
            <span class="font-medium text-highlighted">
              {{ formatCompactNumber(siblingInfo.patrimonioTotal) }}
            </span>
            patrimonio total · {{ siblingInfo.siblings.length }} clases
          </div>
        </template>
      </UDashboardToolbar>

      <UDashboardToolbar v-if="fundDetail">
        <template #left>
          <div class="flex flex-wrap items-center gap-2 -ms-1">
            <div
              v-for="kpi in kpiItems"
              :key="kpi.label"
              class="flex items-center gap-2 rounded-lg border border-default bg-elevated/50 px-2.5 py-1.5"
            >
              <UIcon :name="kpi.icon" class="size-3.5 text-muted shrink-0" />
              <div class="min-w-0">
                <p class="text-[10px] uppercase tracking-wide text-muted leading-none">
                  {{ kpi.label }}
                </p>
                <p class="text-sm font-semibold text-highlighted truncate">{{ kpi.value }}</p>
              </div>
            </div>
          </div>
        </template>

        <template #right>
          <UTabs
            v-model="selectedDetailTab"
            :items="detailTabs"
            :content="false"
            color="neutral"
            size="xs"
            class="w-auto"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
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

      <template v-else-if="fundDetail">
        <FciFundHeaderCard
          :fund-detail="fundDetail"
          :history-updated-at="fundHistory?.fechaActualizacion"
          compact
        />

        <FciFundSiblingClasses
          :base-name="siblingInfo.baseName"
          :current-fondo="fundDetail.nombre"
          :current-patrimonio="fundDetail.patrimonio"
          :siblings="siblingInfo.siblings"
          :patrimonio-total="siblingInfo.patrimonioTotal"
        />

        <div v-show="selectedDetailTab === 'resumen'">
          <FciFundSummaryTab
            :fund-detail="fundDetail"
            :returns-rows="returnsRows"
            :returns-columns="returnsColumns"
            :composition-rows="compositionRows"
            :max-composition-percentage="maxCompositionPercentage"
            :fee-rows="feeRows"
          />
        </div>

        <div v-show="selectedDetailTab === 'historico'">
          <FciFundHistoryTab
            :fund-history="fundHistory"
            :history-status="historyStatus"
            :history-error="historyError"
            :history-rows="historyRows"
            :history-chronological="historyChronological"
            :oldest-history-point="oldestHistoryPoint"
            :latest-history-point="latestHistoryPoint"
            :history-columns="historyColumns"
          />
        </div>
      </template>
    </template>
  </UDashboardPanel>
</template>

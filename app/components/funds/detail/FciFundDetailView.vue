<script setup lang="ts">
import FciFundHeaderCard from '~/components/funds/detail/FciFundHeaderCard.vue'
import FciFundHistoryTab from '~/components/funds/detail/FciFundHistoryTab.vue'
import FciFundSummaryTab from '~/components/funds/detail/FciFundSummaryTab.vue'
import FciFundSiblingClasses from '~/components/funds/detail/FciFundSiblingClasses.vue'
import FciFundDetailNavTabs from '~/components/funds/detail/FciFundDetailNavTabs.vue'
import {
  formatArsEquivalentHint,
  formatCompactPatrimonio,
  formatDecimal,
  formatPercentAuto,
  normalizeCurrencyCode,
} from '~/lib/fci-fund-formatters'
import { findSiblingFundClasses } from '~/lib/fci-fund-groups'
import { parseFundClassName } from '~/lib/fci-fund-class'
import {
  getFundDetailTo,
  getFundDetailToOptionsFromRoute,
  type FundDetailTab,
} from '~/lib/funds-detail'
import { getInstitutionUrl } from '~/lib/mappings/institutions'
import { withOutboundUtm } from '~/lib/outbound-url'
import { getFundMappingBySlug, getFundTypeInfo } from '~/lib/mappings/funds'

const props = defineProps<{ tab: FundDetailTab }>()

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.nombre || ''))
const fundMapping = computed(() => getFundMappingBySlug(slug.value))
const mappedFundInstitution = computed(
  () =>
    fundMapping.value?.institutions.find(
      (item) => item.fundUrl || item.url || getInstitutionUrl(item.institution, 'fondos'),
    ) || null,
)

const mappedFundUrl = computed(() => {
  const institution = mappedFundInstitution.value
  if (!institution) return null

  const url =
    institution.fundUrl || institution.url || getInstitutionUrl(institution.institution, 'fondos')
  return url ? withOutboundUtm(url, 'fondos') : null
})

const cafciUrl = computed(() => {
  if (!fundDetail.value) return null

  return withOutboundUtm(
    `https://estadisticas.cafci.org.ar/fondos/${fundDetail.value.fondoId}?clase=${fundDetail.value.claseId}`,
    'fondos',
  )
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

const mappedFundLabel = computed(() => {
  const institution = mappedFundInstitution.value
  if (!institution) return 'Ver sitio del fondo'

  return institution.displayName ? `Ir a ${institution.displayName}` : 'Ver sitio del fondo'
})

const { fundDetail, fundHistory, status, error, historyStatus, historyError, ensureHistoryLoaded } =
  useFciFundDetailPage(slug)

const { allFunds } = useFondosCatalog()
const { usdArsRate } = useDolarBolsa()

const fundCurrency = computed(
  () => fundDetail.value?.monedaInversion || fundDetail.value?.moneda || null,
)

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

const detailToOptions = computed(() => getFundDetailToOptionsFromRoute(route))

const classSwitcherItems = computed(() =>
  siblingInfo.value.siblings.map((row) => ({
    label: row.classLabel || row.fondo,
    value: row.fondo,
    to: getFundDetailTo(row.fondo, detailToOptions.value),
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
  return30d,
  nominalTnaEstimate,
  returnsColumns,
  historyColumns,
} = useFciFundPresentation(fundDetail, fundHistory)

watch(
  fundDetail,
  async () => {
    if (!fundDetail.value) return
    // Histórico hace falta también en Resumen para 30D/90D/180D rolling (CNV unMes ≠ 30D).
    await ensureHistoryLoaded()
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

function formatPatrimonioKpi(value: number | null | undefined) {
  const primary = formatCompactPatrimonio(value, fundCurrency.value)
  const hint = formatArsEquivalentHint(value, fundCurrency.value, usdArsRate.value)
  return hint ? `${primary} (${hint})` : primary
}

const kpiItems = computed(() => {
  if (!fundDetail.value) return []

  const unMes = return30d.value ?? fundDetail.value.rendimientos?.unMes ?? null
  const items = [
    {
      label: 'Patrimonio clase',
      value: formatPatrimonioKpi(fundDetail.value.patrimonio),
      icon: 'i-lucide-landmark',
    },
    {
      label: 'Valor cuotaparte',
      value: formatDecimal(fundDetail.value.rendimientos?.valorCuotaparte),
      icon: 'i-lucide-circle-dollar-sign',
    },
    {
      label: 'Rend. 30D',
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
      value: formatPatrimonioKpi(siblingInfo.value.patrimonioTotal),
      icon: 'i-lucide-layers',
    })
  }

  return items
})

/** En mobile el patrimonio total ya se ve en clases; dejamos 4 KPIs en grilla 2×2. */
const mobileKpiItems = computed(() =>
  kpiItems.value.filter((item) => item.label !== 'Patrimonio total'),
)

useSeoMeta({
  title: () =>
    fundDetail.value ? `${fundDetail.value.nombre} - Fondo común de inversión` : 'Detalle de FCI',
  description: () =>
    fundDetail.value
      ? props.tab === 'historico'
        ? `Histórico de rendimientos y evolución de ${fundDetail.value.nombre}.`
        : `Detalle, composición, rendimientos e histórico de ${fundDetail.value.nombre}.`
      : 'Información detallada de un fondo común de inversión.',
  ogTitle: () =>
    fundDetail.value
      ? `${fundDetail.value.nombre} - Compara Tasas`
      : 'Detalle de FCI - Compara Tasas',
  ogDescription: () =>
    fundDetail.value
      ? props.tab === 'historico'
        ? `Consultá la evolución histórica de ${fundDetail.value.nombre}.`
        : `Consultá rendimientos, composición, honorarios e histórico de ${fundDetail.value.nombre}.`
      : 'Información detallada de un fondo común de inversión.',
})
</script>

<template>
  <UDashboardPanel
    id="fondos-detail"
    class="max-lg:h-auto max-lg:min-h-0 lg:h-full lg:min-h-0"
    :ui="{
      root: 'max-lg:!min-h-0 max-lg:h-auto lg:h-full lg:min-h-0 lg:!min-h-0',
      body: 'max-lg:!overflow-visible max-lg:!flex-none space-y-4 p-3! sm:p-4! gap-0!',
    }"
  >
    <template #header>
      <UDashboardNavbar
        :title="navbarTitle"
        :ui="{
          root: 'max-lg:sticky max-lg:top-[var(--ui-header-height)] max-lg:z-40 max-lg:bg-default/95 max-lg:backdrop-blur-md',
          title: 'truncate max-w-[42vw] sm:max-w-none',
        }"
      >
        <template #trailing>
          <UBadge color="neutral" variant="outline" class="max-sm:hidden">FCI</UBadge>
          <UBadge
            v-if="fundDetail?.tipoRenta"
            color="neutral"
            variant="subtle"
            class="max-sm:hidden"
            :label="tipoRentaLabel"
          />
          <UBadge
            v-if="fundDetail?.moneda"
            color="neutral"
            variant="subtle"
            class="max-md:hidden"
            :label="normalizeCurrencyCode(fundDetail.moneda)"
          />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            square
            aria-label="Volver"
            class="sm:hidden"
            @click="goBack"
          />
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            label="Volver"
            class="max-sm:hidden"
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
            class="max-md:hidden"
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
            square
            aria-label="CAFCI"
            class="sm:hidden"
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
            class="max-sm:hidden"
          />
        </template>
      </UDashboardNavbar>

      <!-- Desktop: quick class switcher in toolbar -->
      <UDashboardToolbar v-if="fundDetail && siblingInfo.siblings.length > 1" class="max-md:hidden">
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
              {{ formatPatrimonioKpi(siblingInfo.patrimonioTotal) }}
            </span>
            · {{ siblingInfo.siblings.length }} clases
          </div>
        </template>
      </UDashboardToolbar>

      <!-- Mobile: KPI grid + tabs stacked -->
      <div v-if="fundDetail" class="border-b border-default px-3 py-3 space-y-3 md:hidden">
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="kpi in mobileKpiItems"
            :key="kpi.label"
            class="rounded-lg border border-default bg-elevated/40 px-2.5 py-2 min-w-0"
          >
            <div class="flex items-center gap-1.5 mb-0.5">
              <UIcon :name="kpi.icon" class="size-3 text-muted shrink-0" />
              <p class="text-[10px] uppercase tracking-wide text-muted truncate">{{ kpi.label }}</p>
            </div>
            <p class="text-sm font-semibold text-highlighted truncate">{{ kpi.value }}</p>
          </div>
        </div>

        <FciFundDetailNavTabs :tab="tab" :slug="slug" full-width />
      </div>

      <!-- Desktop: KPI strip + tabs -->
      <UDashboardToolbar v-if="fundDetail" class="max-md:hidden">
        <template #left>
          <div class="flex flex-wrap items-center gap-2 -ms-1">
            <div
              v-for="kpi in kpiItems"
              :key="kpi.label"
              class="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
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
          <FciFundDetailNavTabs :tab="tab" :slug="slug" size="xs" />
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

        <div v-if="tab === 'resumen'" class="space-y-4">
          <FciFundSiblingClasses
            :base-name="siblingInfo.baseName"
            :current-fondo="fundDetail.nombre"
            :current-patrimonio="fundDetail.patrimonio"
            :siblings="siblingInfo.siblings"
            :patrimonio-total="siblingInfo.patrimonioTotal"
          />

          <FciFundSummaryTab
            :fund-detail="fundDetail"
            :returns-rows="returnsRows"
            :returns-columns="returnsColumns"
            :nominal-tna-estimate="nominalTnaEstimate"
            :composition-rows="compositionRows"
            :max-composition-percentage="maxCompositionPercentage"
            :fee-rows="feeRows"
          />
        </div>

        <div v-else-if="tab === 'historico'">
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

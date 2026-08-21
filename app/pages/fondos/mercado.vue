<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'
import type { TabsItem } from '@nuxt/ui'
import FciMarketBarChart from '~/components/funds/market/FciMarketBarChart.vue'
import FciMarketDonutChart from '~/components/funds/market/FciMarketDonutChart.vue'
import FciMarketHistoryChart from '~/components/funds/market/FciMarketHistoryChart.vue'
import { CHART_COLORS } from '~/composables/useChartConfig'
import {
  formatCompactNumber,
  formatDate,
  formatPercentAuto,
  metricTone,
} from '~/lib/fci-fund-formatters'
import { getFundDetailPath } from '~/lib/funds-detail'
import type { MarketCurrencyFilter } from '~/lib/fci-market-overview'

definePageMeta({
  layout: 'fondos',
  pageTitle: 'Mercado de FCI',
  pageDescription:
    'Panorama del mercado de fondos comunes de inversión en Argentina: patrimonio, tipos, gestoras y tenencias.',
})

useSeoMeta({
  title: 'Mercado de FCI',
  description:
    'Dashboard del mercado de FCI en Argentina: AUM por tipo, ranking de gestoras y tenencias agregadas.',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://comparatasas.ar/fondos/mercado' }],
})

const TYPE_COLORS: Record<string, string> = {
  mercadoDinero: '#14b8a6',
  rentaFija: '#737373',
  rentaMixta: '#f59e0b',
  rentaVariable: '#f43f5e',
  retornoTotal: '#8b5cf6',
}

const { snapshot, loading, error } = useFciMarketOverview()
const { flows, history } = useFciMarketFlows()

const historyMode = ref<'patrimonio' | 'flujo'>('patrimonio')
const historyTabs = computed<TabsItem[]>(() => [
  { label: 'Patrimonio', value: 'patrimonio' },
  { label: 'Flujo', value: 'flujo' },
])

const currencyQuery = useRouteQuery<MarketCurrencyFilter>('moneda', 'all')
const currencyFilter = computed<MarketCurrencyFilter>({
  get: () => {
    const value = currencyQuery.value
    if (value === 'ARS' || value === 'USD') return value
    return 'all'
  },
  set: (value) => {
    currencyQuery.value = value === 'all' ? 'all' : value
  },
})

const currencyTabs = computed<TabsItem[]>(() => [
  { label: 'Todos', value: 'all' },
  { label: 'ARS', value: 'ARS' },
  { label: 'USD', value: 'USD' },
])

const universe = computed(() => snapshot.value?.universes[currencyFilter.value])

function typeColor(key: string, index: number) {
  return TYPE_COLORS[key] ?? CHART_COLORS[index % CHART_COLORS.length]
}

function formatShare(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function formatTna(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const kpiItems = computed(() => {
  const data = universe.value
  if (!data) return []
  return [
    {
      label: 'Patrimonio',
      value: formatCompactNumber(data.patrimonio),
      hint: currencyFilter.value === 'all' ? 'ARS + USD' : currencyFilter.value,
      icon: 'i-lucide-landmark',
    },
    {
      label: 'Fondos',
      value: new Intl.NumberFormat('es-AR').format(data.fondos),
      hint: `${new Intl.NumberFormat('es-AR').format(data.clases)} clases`,
      icon: 'i-lucide-layers',
    },
    {
      label: 'Gestoras',
      value: new Intl.NumberFormat('es-AR').format(data.gestoras),
      hint: 'Administradoras',
      icon: 'i-lucide-briefcase',
    },
  ]
})

const typeChart = computed(() => {
  const rows = universe.value?.byType ?? []
  return {
    labels: rows.map((row) => row.label),
    values: rows.map((row) => row.value),
    colors: rows.map((row, index) => typeColor(row.key, index)),
  }
})

const managerChart = computed(() => {
  const rows = (universe.value?.byManager ?? []).slice(0, 10)
  return {
    labels: rows.map((row) => row.label),
    values: rows.map((row) => row.value),
  }
})

const holdingKindChart = computed(() => {
  const rows = universe.value?.holdingsByKind ?? []
  return {
    labels: rows.map((row) => row.label),
    values: rows.map((row) => row.value),
    colors: rows.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
  }
})

const topHoldingsChart = computed(() => {
  const rows = universe.value?.topHoldings ?? []
  return {
    labels: rows.map((row) => row.label),
    values: rows.map((row) => row.value),
  }
})

const flowTypeChart = computed(() => {
  const rows = flows.value?.byType ?? []
  return {
    labels: rows.map((row) => row.label),
    values: rows.map((row) => row.flujoEstimado ?? 0),
    colors: rows.map((row) => ((row.flujoEstimado ?? 0) >= 0 ? '#0f766e' : '#e11d48')),
  }
})

const flowKpis = computed(() => {
  const data = flows.value
  if (!data) return []
  const windowHint =
    data.from && data.to ? `${formatDate(data.from)} → ${formatDate(data.to)}` : 'Último vs anterior'
  return [
    {
      label: 'Flujo estimado',
      value: formatCompactNumber(data.flujoEstimado),
      hint: windowHint,
      tone: metricTone(data.flujoEstimado),
      icon: 'i-lucide-arrow-left-right',
    },
    {
      label: 'Δ patrimonio',
      value: formatCompactNumber(data.deltaPatrimonio),
      hint: 'Incluye rendimiento',
      tone: metricTone(data.deltaPatrimonio),
      icon: 'i-lucide-trending-up',
    },
    {
      label: 'Clases pareadas',
      value: new Intl.NumberFormat('es-AR').format(data.matched),
      hint: 'Con VCP y AUM en ambos cierres',
      tone: 'text-highlighted',
      icon: 'i-lucide-git-compare',
    },
  ]
})
</script>

<template>
  <UDashboardPanel
    id="fondos-mercado"
    class="max-lg:h-auto max-lg:min-h-0 lg:h-full lg:min-h-0"
    :ui="{
      root: 'max-lg:!min-h-0 max-lg:h-auto lg:h-full lg:max-h-full lg:!min-h-0 lg:!overflow-hidden lg:!shrink',
    }"
  >
      <UDashboardNavbar
        title="Mercado"
        class="shrink-0"
        :ui="{
          root: 'max-lg:sticky max-lg:top-[var(--ui-header-height)] max-lg:z-40 max-lg:bg-default/95 max-lg:backdrop-blur-md',
        }"
      >
        <template #trailing>
          <UBadge
            v-if="snapshot?.asOf"
            color="neutral"
            variant="subtle"
            :label="`Cierre ${formatDate(snapshot.asOf)}`"
          />
        </template>
        <template #right>
          <UButton
            to="/fondos"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-layout-list"
            label="Catálogo"
            class="max-md:hidden"
          />
          <UTabs
            v-model="currencyFilter"
            :items="currencyTabs"
            :content="false"
            color="neutral"
            size="xs"
            class="w-auto"
          />
        </template>
      </UDashboardNavbar>

    <div
      class="flex min-h-0 flex-1 flex-col gap-4 p-3 sm:p-4 max-lg:flex-none max-lg:overflow-visible lg:overflow-y-auto"
    >
      <FundsLoading v-if="loading && !snapshot" />

      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        title="No se pudo cargar el mercado"
        description="Probá de nuevo en unos instantes."
      />

      <div v-else-if="universe" class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <div
          v-for="kpi in kpiItems"
          :key="kpi.label"
          class="rounded-xl border border-default bg-elevated/40 px-3 py-3 min-w-0"
        >
          <div class="flex items-center gap-1.5 mb-1">
            <UIcon :name="kpi.icon" class="size-3.5 text-muted shrink-0" />
            <p class="text-[10px] uppercase tracking-wide text-muted truncate">{{ kpi.label }}</p>
          </div>
          <p class="text-lg font-semibold text-highlighted truncate">{{ kpi.value }}</p>
          <p class="text-xs text-muted truncate">{{ kpi.hint }}</p>
        </div>
      </div>

      <div v-if="flowKpis.length" class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div
          v-for="kpi in flowKpis"
          :key="kpi.label"
          class="rounded-xl border border-default bg-elevated/40 px-3 py-3 min-w-0"
        >
          <div class="flex items-center gap-1.5 mb-1">
            <UIcon :name="kpi.icon" class="size-3.5 text-muted shrink-0" />
            <p class="text-[10px] uppercase tracking-wide text-muted truncate">{{ kpi.label }}</p>
          </div>
          <p class="text-lg font-semibold truncate" :class="kpi.tone">{{ kpi.value }}</p>
          <p class="text-xs text-muted truncate">{{ kpi.hint }}</p>
        </div>
      </div>

      <UCard v-if="history?.puntos.length">
        <template #header>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold">Evolución del mercado</h2>
              <p class="text-sm text-muted">
                Suma de clases con patrimonio o flujo ese día. La cobertura crece con cada crawl.
              </p>
            </div>
            <UTabs
              v-model="historyMode"
              :items="historyTabs"
              :content="false"
              color="neutral"
              size="xs"
              class="w-auto"
            />
          </div>
        </template>
        <FciMarketHistoryChart :points="history.puntos" :mode="historyMode" />
      </UCard>

      <UCard>
        <template #header>
          <div>
            <h2 class="text-base font-semibold">Patrimonio por tipo</h2>
            <p class="text-sm text-muted">AUM de todas las clases del universo filtrado.</p>
          </div>
        </template>
        <div class="grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr] items-center">
          <FciMarketDonutChart
            :labels="typeChart.labels"
            :values="typeChart.values"
            :colors="typeChart.colors"
            :center-label="formatCompactNumber(universe.patrimonio)"
            center-hint="AUM"
            class="max-md:mx-auto"
          />
          <ul class="space-y-2 min-w-0">
            <li v-for="(row, index) in universe.byType" :key="row.key" class="min-w-0">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="flex items-center gap-2 min-w-0">
                  <span
                    class="size-2 rounded-full shrink-0"
                    :style="{ background: typeColor(row.key, index) }"
                  />
                  <span class="truncate">{{ row.label }}</span>
                </span>
                <span class="tabular-nums text-muted shrink-0">
                  {{ formatShare(row.share) }}
                </span>
              </div>
              <div class="mt-1 h-1.5 rounded-full bg-elevated overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :style="{
                    width: `${Math.max(row.share * 100, 0)}%`,
                    background: typeColor(row.key, index),
                  }"
                />
              </div>
            </li>
          </ul>
        </div>
      </UCard>

      <div v-if="flows" class="grid gap-4 xl:grid-cols-2">
        <UCard>
          <template #header>
            <div>
              <h2 class="text-base font-semibold">Flujo estimado por tipo</h2>
              <p class="text-sm text-muted">
                ΔAUM menos el rendimiento de la cuotaparte. ARS y USD juntos.
              </p>
            </div>
          </template>
          <FciMarketBarChart
            :labels="flowTypeChart.labels"
            :values="flowTypeChart.values"
            :colors="flowTypeChart.colors"
            height-class="h-64 w-full"
          />
        </UCard>

        <UCard>
          <template #header>
            <div>
              <h2 class="text-base font-semibold">Mayores entradas y salidas</h2>
              <p class="text-sm text-muted">Clases con VCP y patrimonio en ambos cierres.</p>
            </div>
          </template>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs uppercase tracking-wide text-muted mb-2">Entradas</p>
              <ul class="divide-y divide-default">
                <li
                  v-for="row in flows.inflows"
                  :key="`in-${row.name}`"
                  class="flex items-center justify-between gap-2 py-2"
                >
                  <NuxtLink
                    :to="getFundDetailPath(row.name)"
                    class="min-w-0 truncate text-sm font-medium text-highlighted hover:underline"
                  >
                    {{ row.name }}
                  </NuxtLink>
                  <span class="tabular-nums text-sm shrink-0 text-emerald-600 dark:text-emerald-400">
                    {{ formatCompactNumber(row.flujoEstimado) }}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted mb-2">Salidas</p>
              <ul class="divide-y divide-default">
                <li
                  v-for="row in flows.outflows"
                  :key="`out-${row.name}`"
                  class="flex items-center justify-between gap-2 py-2"
                >
                  <NuxtLink
                    :to="getFundDetailPath(row.name)"
                    class="min-w-0 truncate text-sm font-medium text-highlighted hover:underline"
                  >
                    {{ row.name }}
                  </NuxtLink>
                  <span class="tabular-nums text-sm shrink-0 text-rose-600 dark:text-rose-400">
                    {{ formatCompactNumber(row.flujoEstimado) }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </UCard>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <UCard>
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold">Top gestoras</h2>
                <p class="text-sm text-muted">Patrimonio administrado, suma de clases.</p>
              </div>
              <UButton
                to="/fondos?vista=administradoras"
                color="neutral"
                variant="ghost"
                size="xs"
                label="Ver tabla"
                trailing-icon="i-lucide-arrow-right"
              />
            </div>
          </template>
          <FciMarketBarChart
            :labels="managerChart.labels"
            :values="managerChart.values"
            height-class="h-[28rem] w-full"
          />
        </UCard>

        <UCard>
          <template #header>
            <div>
              <h2 class="text-base font-semibold">Top fondos</h2>
              <p class="text-sm text-muted">Suma de clases del mismo fondo.</p>
            </div>
          </template>
          <ul class="divide-y divide-default">
            <li
              v-for="(row, index) in universe.byFund"
              :key="row.key"
              class="flex items-center gap-3 py-2.5"
            >
              <span class="w-6 text-xs text-muted tabular-nums">{{ index + 1 }}</span>
              <div class="min-w-0 flex-1">
                <NuxtLink
                  :to="getFundDetailPath(row.primaryFondo)"
                  class="font-medium text-highlighted truncate hover:underline block"
                >
                  {{ row.label }}
                </NuxtLink>
                <p class="text-xs text-muted">{{ row.tipo }} · {{ row.count }} clases</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-medium tabular-nums">{{ formatCompactNumber(row.value) }}</p>
                <p class="text-xs text-muted">{{ formatShare(row.share) }}</p>
              </div>
            </li>
          </ul>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div>
            <h2 class="text-base font-semibold">Rendimientos ponderados por AUM</h2>
            <p class="text-sm text-muted">
              Promedio de cada clase ponderado por patrimonio. La TNA solo se estima en money
              market (variación diaria × 365).
            </p>
          </div>
        </template>
        <div class="overflow-x-auto -mx-1">
          <table class="w-full text-sm min-w-[520px]">
            <thead>
              <tr class="text-left text-muted border-b border-default">
                <th class="py-2 px-1 font-medium">Tipo</th>
                <th class="py-2 px-1 font-medium text-right">AUM</th>
                <th class="py-2 px-1 font-medium text-right">1D</th>
                <th class="py-2 px-1 font-medium text-right">30D</th>
                <th class="py-2 px-1 font-medium text-right">YTD</th>
                <th class="py-2 px-1 font-medium text-right">TNA</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in universe.returnsByType"
                :key="row.key"
                class="border-b border-default last:border-0"
              >
                <td class="py-2.5 px-1 font-medium">{{ row.label }}</td>
                <td class="py-2.5 px-1 text-right tabular-nums">
                  {{ formatCompactNumber(row.patrimonio) }}
                </td>
                <td class="py-2.5 px-1 text-right tabular-nums">
                  {{ formatPercentAuto(row.retorno1d) }}
                </td>
                <td class="py-2.5 px-1 text-right tabular-nums">
                  {{ formatPercentAuto(row.retorno30d) }}
                </td>
                <td class="py-2.5 px-1 text-right tabular-nums">
                  {{ formatPercentAuto(row.retornoYtd) }}
                </td>
                <td class="py-2.5 px-1 text-right tabular-nums">{{ formatTna(row.tna) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <div class="grid gap-4 xl:grid-cols-2">
        <UCard>
          <template #header>
            <div>
              <h2 class="text-base font-semibold">Tenencias por tipo de activo</h2>
              <p class="text-sm text-muted">
                Look-through ponderado por AUM ·
                {{ new Intl.NumberFormat('es-AR').format(universe.withHoldings) }} clases con
                cartera.
              </p>
            </div>
          </template>
          <div class="grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr] items-center">
            <FciMarketDonutChart
              :labels="holdingKindChart.labels"
              :values="holdingKindChart.values"
              :colors="holdingKindChart.colors"
              :center-label="formatCompactNumber(universe.patrimonio)"
              center-hint="Look-through"
            />
            <ul class="space-y-2">
              <li
                v-for="(row, index) in universe.holdingsByKind"
                :key="row.key"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <span class="flex items-center gap-2 min-w-0">
                  <span
                    class="size-2 rounded-full shrink-0"
                    :style="{ background: holdingKindChart.colors[index] }"
                  />
                  <span class="truncate">{{ row.label }}</span>
                </span>
                <span class="tabular-nums text-muted shrink-0">{{ formatShare(row.share) }}</span>
              </li>
            </ul>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div>
              <h2 class="text-base font-semibold">Activos más mantenidos</h2>
              <p class="text-sm text-muted">
                Peso sobre el AUM del universo. Excluye “Resto de activos”.
              </p>
            </div>
          </template>
          <FciMarketBarChart
            :labels="topHoldingsChart.labels"
            :values="topHoldingsChart.values"
            height-class="h-[28rem] w-full"
          />
        </UCard>
      </div>

      <p class="text-xs text-muted pb-2">
        El patrimonio suma clases, no fondos únicos. Las tenencias se agregan desde la composición
        CNV ponderada por AUM. El flujo estimado es Δpatrimonio menos el rendimiento de la
        cuotaparte (último vs anterior por clase). La serie diaria usa los snapshots históricos
        publicados; no cubre todo el universo en fechas viejas.
      </p>
      </div>
    </div>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { TabsItem } from '@nuxt/ui'
import { useRouteQuery } from '@vueuse/router'
import FciCompareEvolutionCharts from '~/components/funds/compare/FciCompareEvolutionCharts.vue'
import { fetchFciFundHistory, type FciFundHistory } from '~/composables/useFciFundDetails'
import {
  buildCompareFundOptions,
  FCI_COMPARE_DEFAULT_COUNT,
  FCI_COMPARE_DEFAULT_CURRENCY,
  FCI_COMPARE_MAX_COUNT,
  isFciCompareCurrency,
  listComparableFunds,
  parseFondosQueryParam,
  resolveCompareFunds,
  serializeFondosQueryParam,
  type FciCompareCurrency,
  type FciCompareFund,
} from '~/lib/fci-fund-compare'
import {
  formatArsEquivalentHint,
  formatCompactPatrimonio,
  formatCurrency,
  formatDate,
  formatPercentAuto,
  isUsdCurrency,
  metricTone,
} from '~/lib/fci-fund-formatters'
import { getFundDetailPath, normalizeFundSlug } from '~/lib/funds-detail'

definePageMeta({
  layout: 'fondos',
  pageTitle: 'Comparar FCI',
  pageDescription:
    'Compará fondos comunes de inversión en Argentina por moneda (ARS o USD): rendimientos, TNA, patrimonio e histórico.',
})

useSeoMeta({
  title: 'Comparar FCI',
  description:
    'Compará fondos comunes de inversión en Argentina separados por moneda (ARS/USD): rendimientos, TNA, inversión mínima, liquidación y evolución histórica.',
  ogTitle: 'Comparar FCI',
  ogDescription:
    'Compará fondos comunes de inversión en Argentina separados por moneda (ARS/USD): rendimientos, TNA, inversión mínima, liquidación y evolución histórica.',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://comparatasas.ar/fondos/comparar' }],
})

const { allFunds, loading, error } = useFondosCatalog()
const { usdArsRate } = useDolarBolsa()

const fondosQuery = useRouteQuery<string | undefined>('fondos', undefined)
const monedaQuery = useRouteQuery<string | undefined>('moneda', undefined)

const currencyFilter = computed<FciCompareCurrency>({
  get: () =>
    isFciCompareCurrency(monedaQuery.value) ? monedaQuery.value : FCI_COMPARE_DEFAULT_CURRENCY,
  set: (value) => {
    const next = isFciCompareCurrency(value) ? value : FCI_COMPARE_DEFAULT_CURRENCY
    monedaQuery.value = next === FCI_COMPARE_DEFAULT_CURRENCY ? undefined : next
    // Al cambiar moneda, reiniciamos la selección al top de ese universo.
    fondosQuery.value = undefined
  },
})

const currencyTabs = computed<TabsItem[]>(() => [
  { label: 'ARS', value: 'ARS' },
  { label: 'USD', value: 'USD' },
])

const comparableFunds = computed(() =>
  listComparableFunds(allFunds.value ?? [], {
    usdArsRate: usdArsRate.value,
    currency: currencyFilter.value,
  }),
)

const fundOptions = computed(() => buildCompareFundOptions(comparableFunds.value))

const resolveOptions = computed(() => ({
  usdArsRate: usdArsRate.value,
  maxCount: FCI_COMPARE_MAX_COUNT,
  defaultCount: FCI_COMPARE_DEFAULT_COUNT,
  currency: currencyFilter.value,
}))

const resolvedSelection = computed(() =>
  resolveCompareFunds(
    allFunds.value ?? [],
    parseFondosQueryParam(fondosQuery.value),
    resolveOptions.value,
  ),
)

const comparedFunds = computed(() => resolvedSelection.value.funds)
const isDefaultSelection = computed(() => resolvedSelection.value.isDefault)
const isEmptySelection = computed(() => resolvedSelection.value.isEmpty)

const selectedKeys = computed({
  get: () => resolvedSelection.value.keys,
  set: (keys: string[]) => {
    const unique = [...new Set(keys.filter(Boolean))].slice(0, FCI_COMPARE_MAX_COUNT)
    const next = resolveCompareFunds(allFunds.value ?? [], unique, resolveOptions.value)
    fondosQuery.value = serializeFondosQueryParam(next.keys, next.isDefault)
  },
})

function resetToDefaultSelection() {
  fondosQuery.value = undefined
}

function removeFundFromComparison(compareKey: string) {
  selectedKeys.value = selectedKeys.value.filter((key) => key !== compareKey)
}

function clearComparison() {
  selectedKeys.value = []
}

const historySlugsKey = computed(() =>
  comparedFunds.value.map((fund) => normalizeFundSlug(fund.primaryFondo)).join('|'),
)

async function fetchFundHistorySafe(slug: string): Promise<FciFundHistory | null> {
  try {
    return await fetchFciFundHistory(slug)
  } catch (error) {
    if (error instanceof FetchError && error.statusCode === 404) return null
    return null
  }
}

const {
  data: historyBySlug,
  status: historyStatus,
  error: historyError,
} = useAsyncData(
  'fci-compare-histories',
  async () => {
    if (import.meta.prerender) return {} as Record<string, FciFundHistory | null>
    const slugs = historySlugsKey.value ? historySlugsKey.value.split('|').filter(Boolean) : []
    if (!slugs.length) return {} as Record<string, FciFundHistory | null>

    const entries = await Promise.all(
      slugs.map(async (slug) => [slug, await fetchFundHistorySafe(slug)] as const),
    )
    return Object.fromEntries(entries) as Record<string, FciFundHistory | null>
  },
  {
    default: () => ({}) as Record<string, FciFundHistory | null>,
    watch: [historySlugsKey],
    immediate: !import.meta.prerender,
  },
)

const chartFunds = computed(() =>
  comparedFunds.value.map((fund) => {
    const slug = normalizeFundSlug(fund.primaryFondo)
    const history = historyBySlug.value?.[slug]
    return {
      key: fund.compareKey,
      label: fund.baseName || fund.displayName,
      points: history?.historico ?? [],
    }
  }),
)

const isHistoryLoading = computed(
  () => historyStatus.value === 'pending' && !Object.keys(historyBySlug.value ?? {}).length,
)

const asOf = computed(() => {
  let latest: string | null = null
  for (const fund of comparedFunds.value) {
    if (!fund.fecha) continue
    if (!latest || fund.fecha > latest) latest = fund.fecha
  }
  return latest
})

type MetricKey =
  | 'tipo'
  | 'administradora'
  | 'patrimonio'
  | 'tna'
  | 'tea'
  | 'retorno1d'
  | 'retorno30d'
  | 'retornoYtd'
  | 'inversionMinima'
  | 'plazo'
  | 'horizonte'

interface CompareMetric {
  key: MetricKey
  label: string
  group: 'perfil' | 'rendimiento' | 'operativa'
  numeric?: boolean
  higherIsBetter?: boolean
  tone?: boolean
}

const metrics: CompareMetric[] = [
  { key: 'tipo', label: 'Tipo', group: 'perfil' },
  { key: 'administradora', label: 'Administradora', group: 'perfil' },
  { key: 'horizonte', label: 'Horizonte', group: 'perfil' },
  {
    key: 'patrimonio',
    label: 'Patrimonio',
    group: 'perfil',
    numeric: true,
    higherIsBetter: true,
  },
  {
    key: 'tna',
    label: 'TNA',
    group: 'rendimiento',
    numeric: true,
    higherIsBetter: true,
    tone: true,
  },
  {
    key: 'tea',
    label: 'TEA',
    group: 'rendimiento',
    numeric: true,
    higherIsBetter: true,
    tone: true,
  },
  {
    key: 'retorno1d',
    label: 'Retorno 1D',
    group: 'rendimiento',
    numeric: true,
    higherIsBetter: true,
    tone: true,
  },
  {
    key: 'retorno30d',
    label: 'Retorno 30D',
    group: 'rendimiento',
    numeric: true,
    higherIsBetter: true,
    tone: true,
  },
  {
    key: 'retornoYtd',
    label: 'Retorno YTD',
    group: 'rendimiento',
    numeric: true,
    higherIsBetter: true,
    tone: true,
  },
  {
    key: 'inversionMinima',
    label: 'Inversión mínima',
    group: 'operativa',
    numeric: true,
    higherIsBetter: false,
  },
  {
    key: 'plazo',
    label: 'Liquidación',
    group: 'operativa',
    numeric: true,
    higherIsBetter: false,
  },
]

const metricGroups = [
  { key: 'perfil' as const, label: 'Perfil' },
  { key: 'rendimiento' as const, label: 'Rendimiento' },
  { key: 'operativa' as const, label: 'Operativa' },
]

function fundCurrency(fund: FciCompareFund) {
  return fund.monedaInversion || fund.moneda
}

function metricRawValue(fund: FciCompareFund, key: MetricKey): number | null {
  switch (key) {
    case 'patrimonio':
      return fund.isGroup ? fund.patrimonioTotal : fund.patrimonio
    case 'tna':
      return fund.tna
    case 'tea':
      return fund.tea
    case 'retorno1d':
      return fund.retorno1d
    case 'retorno30d':
      return fund.retorno30d
    case 'retornoYtd':
      return fund.retornoYtd
    case 'inversionMinima':
      return fund.inversionMinima
    case 'plazo':
      return fund.plazoLiquidacionDias
    default:
      return null
  }
}

function formatRate(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPlazo(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  if (value === 0) return 'T+0'
  return `T+${value}`
}

function formatMetric(fund: FciCompareFund, metric: CompareMetric): string {
  switch (metric.key) {
    case 'tipo':
      return fund.typeLabel || '—'
    case 'administradora':
      return fund.administradora || '—'
    case 'horizonte':
      return fund.horizonte || '—'
    case 'patrimonio': {
      const value = metricRawValue(fund, 'patrimonio')
      const currency = fundCurrency(fund)
      const primary = formatCompactPatrimonio(value, currency)
      const hint = formatArsEquivalentHint(value, currency, usdArsRate.value)
      if (primary === '—') return primary
      return hint ? `${primary} · ${hint}` : primary
    }
    case 'tna':
    case 'tea':
      return formatRate(metricRawValue(fund, metric.key))
    case 'retorno1d':
    case 'retorno30d':
    case 'retornoYtd':
      return formatPercentAuto(metricRawValue(fund, metric.key))
    case 'inversionMinima':
      return formatCurrency(fund.inversionMinima, fundCurrency(fund) || 'ARS')
    case 'plazo':
      return formatPlazo(fund.plazoLiquidacionDias)
    default:
      return '—'
  }
}

function bestIndex(metric: CompareMetric): number | null {
  if (!metric.numeric || metric.higherIsBetter == null) return null

  const values = comparedFunds.value.map((fund) => metricRawValue(fund, metric.key))
  const finite = values
    .map((value, index) => ({ value, index }))
    .filter(
      (item): item is { value: number; index: number } =>
        item.value != null && Number.isFinite(item.value),
    )

  if (finite.length < 2) return null

  let best = finite[0]!
  for (const item of finite.slice(1)) {
    const better = metric.higherIsBetter ? item.value > best.value : item.value < best.value
    if (better) best = item
  }

  const ties = finite.filter((item) => item.value === best.value)
  if (ties.length > 1) return null

  return best.index
}

function cellClass(fund: FciCompareFund, metric: CompareMetric, index: number) {
  const classes = ['tabular-nums']
  if (metric.tone) {
    classes.push(metricTone(metricRawValue(fund, metric.key)))
  }
  if (bestIndex(metric) === index) {
    classes.push('font-semibold text-highlighted')
  }
  return classes.join(' ')
}

function metricsForGroup(group: (typeof metricGroups)[number]['key']) {
  return metrics.filter((metric) => metric.group === group)
}

const tableRows = computed(() => {
  const rows: Array<
    | { kind: 'group'; key: string; label: string }
    | { kind: 'metric'; key: string; metric: CompareMetric }
  > = []

  for (const group of metricGroups) {
    rows.push({ kind: 'group', key: `group-${group.key}`, label: group.label })
    for (const metric of metricsForGroup(group.key)) {
      rows.push({ kind: 'metric', key: metric.key, metric })
    }
  }

  return rows
})

function fundTitle(fund: FciCompareFund) {
  return fund.baseName || fund.displayName
}

function patrimonioLabel(fund: FciCompareFund) {
  return formatMetric(fund, metrics.find((m) => m.key === 'patrimonio')!)
}
</script>

<template>
  <UDashboardPanel
    id="fondos-comparar"
    class="max-lg:h-auto max-lg:min-h-0 lg:h-full lg:min-h-0"
    :ui="{
      root: 'max-lg:!min-h-0 max-lg:h-auto lg:h-full lg:max-h-full lg:!min-h-0 lg:!overflow-hidden lg:!shrink',
    }"
  >
    <UDashboardNavbar
      title="Comparar"
      class="shrink-0"
      :ui="{
        root: 'max-lg:sticky max-lg:top-[var(--ui-header-height)] max-lg:z-40 max-lg:bg-default/95 max-lg:backdrop-blur-md',
      }"
    >
      <template #trailing>
        <UBadge
          v-if="asOf"
          color="neutral"
          variant="subtle"
          :label="`Cierre ${formatDate(asOf)}`"
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
        <UButton
          to="/fondos/mercado"
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-chart-pie"
          label="Mercado"
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
      <FundsPageBanner />

      <FundsLoading v-if="loading && !(allFunds ?? []).length" />

      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        title="No se pudo cargar la comparativa"
        description="Probá de nuevo en unos instantes."
      />

      <template v-else-if="(allFunds ?? []).length">
        <div class="flex shrink-0 flex-col gap-3">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <h2 class="text-lg font-medium">Comparador de FCI · {{ currencyFilter }}</h2>
              <p class="text-sm text-muted mt-1">
                Compará fondos en la misma moneda. Elegí hasta {{ FCI_COMPARE_MAX_COUNT }}; por
                defecto arrancamos con los {{ FCI_COMPARE_DEFAULT_COUNT }} de mayor patrimonio en
                {{ currencyFilter }}. Las tasas corresponden a la clase principal de cada fondo.
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1 self-start">
              <UButton
                v-if="comparedFunds.length"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-x"
                label="Limpiar"
                @click="clearComparison"
              />
              <UButton
                v-if="!isDefaultSelection"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-rotate-ccw"
                label="Top por patrimonio"
                @click="resetToDefaultSelection"
              />
            </div>
          </div>

          <USelectMenu
            v-if="comparableFunds.length"
            v-model="selectedKeys"
            multiple
            value-key="value"
            :items="fundOptions"
            :filter-fields="['label', 'typeLabel', 'administradora']"
            virtualize
            color="neutral"
            icon="i-lucide-search"
            :placeholder="`Buscar fondos ${currencyFilter}…`"
            :search-input="{ placeholder: 'Nombre, tipo o administradora…' }"
            class="w-full"
            :ui="{ content: 'min-w-fit' }"
          >
            <template #item-label="{ item }">
              <div class="flex min-w-0 flex-col gap-0.5 py-0.5">
                <span class="truncate font-medium">{{ item.label }}</span>
                <span class="truncate text-xs text-muted">
                  {{ item.typeLabel }} · {{ item.administradora }} · {{ item.patrimonioLabel }}
                </span>
              </div>
            </template>
          </USelectMenu>

          <p v-if="comparableFunds.length && isDefaultSelection" class="text-xs text-muted">
            Selección inicial: top {{ comparedFunds.length }} por patrimonio en
            {{ currencyFilter }}.
          </p>
        </div>

        <template v-if="comparedFunds.length">
          <!-- Desktop comparison matrix -->
          <div class="hidden sm:block shrink-0 border border-default rounded-lg overflow-x-auto">
            <table class="w-full text-sm min-w-[40rem]">
              <thead>
                <tr class="border-b border-default bg-elevated/40">
                  <th
                    class="py-2.5 px-3 text-left font-medium text-muted w-40 sticky left-0 bg-elevated/40"
                  >
                    Métrica
                  </th>
                  <th
                    v-for="fund in comparedFunds"
                    :key="fund.compareKey"
                    class="py-2.5 px-3 text-left font-medium min-w-[12rem]"
                  >
                    <div class="flex items-start gap-2">
                      <UBadge
                        color="neutral"
                        variant="subtle"
                        size="sm"
                        :label="`#${fund.rank}`"
                        class="shrink-0 mt-0.5"
                      />
                      <div class="min-w-0 flex-1">
                        <NuxtLink
                          :to="getFundDetailPath(fund.primaryFondo)"
                          class="font-medium text-highlighted hover:underline line-clamp-2"
                        >
                          {{ fundTitle(fund) }}
                        </NuxtLink>
                        <p v-if="fund.classCount > 1" class="text-xs text-muted mt-0.5">
                          {{ fund.classCount }} clases
                        </p>
                      </div>
                      <UButton
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        square
                        icon="i-lucide-x"
                        class="shrink-0 -mt-0.5 -me-1"
                        :aria-label="`Quitar ${fundTitle(fund)}`"
                        @click="removeFundFromComparison(fund.compareKey)"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="row in tableRows" :key="row.key">
                  <tr v-if="row.kind === 'group'" class="border-b border-default bg-elevated/20">
                    <td
                      :colspan="comparedFunds.length + 1"
                      class="py-1.5 px-3 text-[10px] uppercase tracking-wide text-muted font-medium"
                    >
                      {{ row.label }}
                    </td>
                  </tr>
                  <tr
                    v-else
                    class="border-b border-default last:border-0 hover:bg-elevated transition-colors"
                  >
                    <td class="py-2.5 px-3 text-muted sticky left-0 bg-default">
                      {{ row.metric.label }}
                    </td>
                    <td
                      v-for="(fund, index) in comparedFunds"
                      :key="`${fund.compareKey}-${row.metric.key}`"
                      class="py-2.5 px-3"
                      :class="cellClass(fund, row.metric, index)"
                    >
                      {{ formatMetric(fund, row.metric) }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Mobile stacked cards -->
          <div class="sm:hidden flex shrink-0 flex-col gap-3">
            <div
              v-for="fund in comparedFunds"
              :key="fund.compareKey"
              class="rounded-lg border border-default px-3 py-3 space-y-3"
            >
              <div class="flex items-start gap-2">
                <UBadge color="neutral" variant="subtle" size="sm" :label="`#${fund.rank}`" />
                <div class="min-w-0 flex-1">
                  <NuxtLink
                    :to="getFundDetailPath(fund.primaryFondo)"
                    class="font-medium text-highlighted hover:underline"
                  >
                    {{ fundTitle(fund) }}
                  </NuxtLink>
                  <p class="text-xs text-muted mt-0.5">
                    {{ fund.typeLabel }}
                    <template v-if="fund.classCount > 1"> · {{ fund.classCount }} clases</template>
                  </p>
                </div>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  icon="i-lucide-x"
                  class="shrink-0"
                  :aria-label="`Quitar ${fundTitle(fund)}`"
                  @click="removeFundFromComparison(fund.compareKey)"
                />
              </div>

              <dl class="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div>
                  <dt class="text-[10px] uppercase tracking-wide text-muted">Patrimonio</dt>
                  <dd class="tabular-nums font-medium">
                    {{ patrimonioLabel(fund) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-[10px] uppercase tracking-wide text-muted">TNA</dt>
                  <dd class="tabular-nums font-medium" :class="metricTone(fund.tna)">
                    {{ formatRate(fund.tna) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-[10px] uppercase tracking-wide text-muted">1D</dt>
                  <dd class="tabular-nums" :class="metricTone(fund.retorno1d)">
                    {{ formatPercentAuto(fund.retorno1d) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-[10px] uppercase tracking-wide text-muted">30D</dt>
                  <dd class="tabular-nums" :class="metricTone(fund.retorno30d)">
                    {{ formatPercentAuto(fund.retorno30d) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-[10px] uppercase tracking-wide text-muted">YTD</dt>
                  <dd class="tabular-nums" :class="metricTone(fund.retornoYtd)">
                    {{ formatPercentAuto(fund.retornoYtd) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-[10px] uppercase tracking-wide text-muted">Liquidación</dt>
                  <dd class="tabular-nums">{{ formatPlazo(fund.plazoLiquidacionDias) }}</dd>
                </div>
                <div class="col-span-2">
                  <dt class="text-[10px] uppercase tracking-wide text-muted">Administradora</dt>
                  <dd class="truncate">{{ fund.administradora || '—' }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div class="shrink-0 space-y-4">
            <UAlert
              v-if="historyError"
              color="warning"
              variant="soft"
              title="No se pudo cargar el histórico"
              description="La tabla de métricas está disponible; los gráficos pueden quedar incompletos."
            />

            <FciCompareEvolutionCharts :funds="chartFunds" :loading="isHistoryLoading" />

            <p class="text-xs text-muted pb-2">
              Solo fondos con reporte CNV reciente. El patrimonio suma todas las clases del mismo
              fondo. El histórico usa la clase principal de cada fondo. Los rendimientos pasados no
              garantizan resultados futuros.
              <template v-if="comparedFunds.some((f) => isUsdCurrency(fundCurrency(f)))">
                Equivalentes ARS usan dólar bolsa (MEP, venta).
              </template>
            </p>
          </div>
        </template>

        <UAlert
          v-else-if="!comparableFunds.length"
          color="neutral"
          variant="soft"
          :title="`Sin fondos en ${currencyFilter}`"
          description="No hay fondos activos en esta moneda para comparar."
        />

        <div v-else-if="isEmptySelection" class="shrink-0 space-y-3">
          <UAlert
            color="neutral"
            variant="soft"
            title="Comparación vacía"
            description="Buscá y agregá fondos arriba, o restaurá el top por patrimonio."
          />
          <UButton
            color="neutral"
            variant="soft"
            size="sm"
            icon="i-lucide-rotate-ccw"
            label="Top por patrimonio"
            @click="resetToDefaultSelection"
          />
        </div>

        <UAlert
          v-else
          color="neutral"
          variant="soft"
          title="Elegí al menos un fondo"
          description="Usá el buscador de arriba para armar la comparativa."
        />
      </template>

      <UAlert
        v-else
        color="neutral"
        variant="soft"
        title="Sin fondos para comparar"
        description="No hay fondos activos con patrimonio disponible en este momento."
      />
    </div>
  </UDashboardPanel>
</template>

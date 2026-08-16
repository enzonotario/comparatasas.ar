<script setup lang="ts">
import type { TableColumn, TabsItem } from '@nuxt/ui'
import type { FciFundHistory, FciFundHistoryItem } from '~/composables/useFciFundDetails'
import FciFundEvolutionCharts from '~/components/funds/detail/FciFundEvolutionCharts.vue'
import { recomputeHistoryReturns } from '~/lib/finance/fci-history-returns'
import { formatCompactNumber, formatDate, formatDecimal } from '~/lib/fci-fund-formatters'

type HistoryPeriod = '1m' | '3m' | '6m' | '1y' | 'ytd' | 'all'

const props = defineProps<{
  fundHistory: FciFundHistory | null
  historyStatus: 'idle' | 'pending' | 'success' | 'error'
  historyError: unknown
  historyRows: FciFundHistoryItem[]
  historyChronological: FciFundHistoryItem[]
  oldestHistoryPoint: FciFundHistoryItem | null
  latestHistoryPoint: FciFundHistoryItem | null
  historyColumns: TableColumn<FciFundHistoryItem>[]
}>()

const selectedPeriod = ref<HistoryPeriod>('1y')

const periodItems: TabsItem[] = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1A', value: '1y' },
  { label: 'YTD', value: 'ytd' },
  { label: 'Todo', value: 'all' },
]

const isHistoryLoading = computed(() => props.historyStatus === 'pending' && !props.fundHistory)

function parseLocalDate(fecha: string) {
  return new Date(`${fecha}T00:00:00`)
}

function getPeriodCutoff(latest: Date, period: HistoryPeriod): Date | null {
  if (period === 'all') return null

  if (period === 'ytd') {
    return new Date(latest.getFullYear(), 0, 1)
  }

  const cutoff = new Date(latest)

  switch (period) {
    case '1m':
      cutoff.setMonth(cutoff.getMonth() - 1)
      break
    case '3m':
      cutoff.setMonth(cutoff.getMonth() - 3)
      break
    case '6m':
      cutoff.setMonth(cutoff.getMonth() - 6)
      break
    case '1y':
      cutoff.setFullYear(cutoff.getFullYear() - 1)
      break
  }

  return cutoff
}

const filteredChronological = computed(() => {
  const points = props.historyChronological
  if (!points.length) return []

  const latestFecha = points[points.length - 1]?.fecha
  if (!latestFecha) return []

  const latest = parseLocalDate(latestFecha)
  if (Number.isNaN(latest.getTime())) return points

  const cutoff = getPeriodCutoff(latest, selectedPeriod.value)
  const windowPoints = !cutoff
    ? points
    : points.filter((point) => {
        const date = parseLocalDate(point.fecha)
        return !Number.isNaN(date.getTime()) && date >= cutoff
      })

  // Recalcular acumulado dentro de la ventana seleccionada.
  return recomputeHistoryReturns(windowPoints)
})

const filteredRows = computed(() => [...filteredChronological.value].reverse())

const filteredOldest = computed(
  () => filteredChronological.value[0] ?? props.oldestHistoryPoint,
)
const filteredLatest = computed(
  () =>
    filteredChronological.value[filteredChronological.value.length - 1] ??
    props.latestHistoryPoint,
)

const periodLabel = computed(() => {
  switch (selectedPeriod.value) {
    case '1m':
      return 'último mes'
    case '3m':
      return 'últimos 3 meses'
    case '6m':
      return 'últimos 6 meses'
    case '1y':
      return 'último año'
    case 'ytd':
      return 'año en curso'
    case 'all':
      return 'todo el histórico'
  }
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="isHistoryLoading" class="grid gap-3 md:grid-cols-3">
      <USkeleton v-for="index in 3" :key="`history-metric-${index}`" class="h-20 rounded-2xl" />
    </div>

    <UAlert
      v-else-if="props.historyError"
      color="error"
      variant="soft"
      title="No se pudo cargar el histórico"
      description="Probá nuevamente en unos instantes."
    />

    <template v-else-if="props.fundHistory">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <p class="text-sm font-medium text-highlighted">Período</p>
          <p class="text-xs text-muted">Mostrando {{ periodLabel }}</p>
        </div>

        <UTabs
          v-model="selectedPeriod"
          :items="periodItems"
          :content="false"
          color="neutral"
          size="xs"
          class="w-full sm:w-auto overflow-x-auto"
          :ui="{
            list: 'inline-flex w-max min-w-full sm:min-w-0',
            trigger: 'px-2.5',
          }"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
          <p class="text-xs uppercase tracking-wide text-neutral-500">Desde</p>
          <p class="mt-1 font-semibold">{{ formatDate(filteredOldest?.fecha) }}</p>
          <p class="mt-1 text-sm text-neutral-500">
            VCP {{ formatDecimal(filteredOldest?.valorCuotaparte) }}
          </p>
        </div>
        <div class="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
          <p class="text-xs uppercase tracking-wide text-neutral-500">Hasta</p>
          <p class="mt-1 font-semibold">{{ formatDate(filteredLatest?.fecha) }}</p>
          <p class="mt-1 text-sm text-neutral-500">
            VCP {{ formatDecimal(filteredLatest?.valorCuotaparte) }}
          </p>
        </div>
        <div class="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
          <p class="text-xs uppercase tracking-wide text-neutral-500">Patrimonio actual</p>
          <p class="mt-1 font-semibold">
            {{ formatCompactNumber(filteredLatest?.patrimonio) }}
          </p>
          <p class="mt-1 text-sm text-neutral-500">
            {{ filteredChronological.length }} observaciones
          </p>
        </div>
      </div>

      <FciFundEvolutionCharts :points="filteredChronological" :loading="isHistoryLoading" />

      <UCard
        :ui="{
          body: '!p-0',
        }"
      >
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold">Tabla histórica</h2>
            <p class="text-xs text-muted">{{ filteredRows.length }} filas · {{ periodLabel }}</p>
          </div>
        </template>
        <UTable
          :data="filteredRows"
          :columns="props.historyColumns"
          sticky="header"
          :ui="{
            base: 'table-fixed',
            th: 'px-3 py-2.5 text-xs',
            td: 'px-3 py-2 text-sm',
          }"
        />
      </UCard>
    </template>

    <p v-else class="text-sm text-neutral-500">No hay histórico disponible para este fondo.</p>
  </div>
</template>

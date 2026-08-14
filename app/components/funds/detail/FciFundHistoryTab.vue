<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FciFundHistory, FciFundHistoryItem } from '~/composables/useFciFundDetails'
import FciFundEvolutionCharts from '~/components/funds/detail/FciFundEvolutionCharts.vue'
import { formatCompactNumber, formatDate, formatDecimal } from '~/lib/fci-fund-formatters'

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

const isHistoryLoading = computed(
  () => props.historyStatus === 'pending' && !props.fundHistory,
)
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="isHistoryLoading"
      class="grid gap-3 md:grid-cols-3"
    >
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
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
          <p class="text-xs uppercase tracking-wide text-neutral-500">Desde</p>
          <p class="mt-1 font-semibold">{{ formatDate(props.oldestHistoryPoint?.fecha) }}</p>
          <p class="mt-1 text-sm text-neutral-500">
            VCP {{ formatDecimal(props.oldestHistoryPoint?.valorCuotaparte) }}
          </p>
        </div>
        <div class="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
          <p class="text-xs uppercase tracking-wide text-neutral-500">Hasta</p>
          <p class="mt-1 font-semibold">{{ formatDate(props.latestHistoryPoint?.fecha) }}</p>
          <p class="mt-1 text-sm text-neutral-500">
            VCP {{ formatDecimal(props.latestHistoryPoint?.valorCuotaparte) }}
          </p>
        </div>
        <div class="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
          <p class="text-xs uppercase tracking-wide text-neutral-500">Patrimonio actual</p>
          <p class="mt-1 font-semibold">
            {{ formatCompactNumber(props.latestHistoryPoint?.patrimonio) }}
          </p>
          <p class="mt-1 text-sm text-neutral-500">
            {{ props.historyChronological.length }} observaciones
          </p>
        </div>
      </div>

      <FciFundEvolutionCharts
        :points="props.historyChronological"
        :loading="isHistoryLoading"
      />

      <UCard
        :ui="{
          body: '!p-0',
        }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Tabla histórica</h2>
        </template>
        <UTable
          :data="props.historyRows"
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

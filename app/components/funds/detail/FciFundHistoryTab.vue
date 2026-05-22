<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FciFundHistory, FciFundHistoryItem } from '~/composables/useFciFundDetails'
import { formatDate } from '~/lib/fci-fund-formatters'

const props = defineProps<{
  fundHistory: FciFundHistory | null
  historyStatus: 'idle' | 'pending' | 'success' | 'error'
  historyError: unknown
  historyRows: FciFundHistoryItem[]
  oldestHistoryPoint: FciFundHistoryItem | null
  latestHistoryPoint: FciFundHistoryItem | null
  historyColumns: TableColumn<FciFundHistoryItem>[]
}>()
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="props.historyStatus === 'pending' && !props.fundHistory"
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
      <UTable :data="props.historyRows" :columns="props.historyColumns" sticky="header" />
    </template>
  </div>
</template>

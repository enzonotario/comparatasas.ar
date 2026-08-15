<script setup lang="ts">
import { getFundDetailPath } from '~/lib/funds-detail'
import { formatCompactNumber, formatCurrency, metricTone } from '~/lib/fci-fund-formatters'
import { compareClassLabels } from '~/lib/fci-fund-class'
import type { FundCatalogGroupRow } from '~/lib/fci-fund-groups'

type SortKey = 'clase' | 'tna' | 'patrimonio' | 'share' | 'inversionMinima'
type SortDir = 'asc' | 'desc'

const props = defineProps<{
  baseName: string
  currentFondo: string
  currentPatrimonio?: number | null
  siblings: FundCatalogGroupRow[]
  patrimonioTotal: number | null
}>()

const sortKey = ref<SortKey>('clase')
const sortDir = ref<SortDir>('asc')

function formatRate(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function shareOfFund(row: FundCatalogGroupRow) {
  if (row.patrimonio == null || props.patrimonioTotal == null || props.patrimonioTotal <= 0) {
    return null
  }
  return (row.patrimonio / props.patrimonioTotal) * 100
}

function formatShare(row: FundCatalogGroupRow) {
  const share = shareOfFund(row)
  return share != null ? `${share.toFixed(1).replace('.', ',')}%` : '—'
}

function sortNullableNumber(a: number | null | undefined, b: number | null | undefined) {
  if (a == null || !Number.isFinite(a)) return 1
  if (b == null || !Number.isFinite(b)) return -1
  return a - b
}

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    return
  }
  sortKey.value = key
  sortDir.value = key === 'clase' ? 'asc' : 'desc'
}

function sortIcon(key: SortKey) {
  if (sortKey.value !== key) return 'i-lucide-arrow-up-down'
  return sortDir.value === 'asc'
    ? 'i-lucide-arrow-up-narrow-wide'
    : 'i-lucide-arrow-down-wide-narrow'
}

const hasMultipleClasses = computed(() => props.siblings.length > 1)

const classShare = computed(() => {
  if (
    props.currentPatrimonio == null ||
    props.patrimonioTotal == null ||
    props.patrimonioTotal <= 0
  ) {
    return null
  }
  return (props.currentPatrimonio / props.patrimonioTotal) * 100
})

const sortedSiblings = computed(() => {
  const rows = [...props.siblings]

  rows.sort((a, b) => {
    const direction = sortDir.value === 'asc' ? 1 : -1
    let cmp = 0
    let aNull = false
    let bNull = false

    switch (sortKey.value) {
      case 'clase':
        cmp = compareClassLabels(a.classLabel || a.fondo, b.classLabel || b.fondo)
        break
      case 'tna':
        aNull = a.tna == null || !Number.isFinite(a.tna)
        bNull = b.tna == null || !Number.isFinite(b.tna)
        if (!aNull && !bNull) cmp = sortNullableNumber(a.tna, b.tna)
        break
      case 'patrimonio':
        aNull = a.patrimonio == null || !Number.isFinite(a.patrimonio)
        bNull = b.patrimonio == null || !Number.isFinite(b.patrimonio)
        if (!aNull && !bNull) cmp = sortNullableNumber(a.patrimonio, b.patrimonio)
        break
      case 'share': {
        const shareA = shareOfFund(a)
        const shareB = shareOfFund(b)
        aNull = shareA == null || !Number.isFinite(shareA)
        bNull = shareB == null || !Number.isFinite(shareB)
        if (!aNull && !bNull) cmp = sortNullableNumber(shareA, shareB)
        break
      }
      case 'inversionMinima':
        aNull = a.inversionMinima == null || !Number.isFinite(a.inversionMinima)
        bNull = b.inversionMinima == null || !Number.isFinite(b.inversionMinima)
        if (!aNull && !bNull) cmp = sortNullableNumber(a.inversionMinima, b.inversionMinima)
        break
    }

    if (aNull || bNull) {
      if (aNull && bNull) return 0
      return aNull ? 1 : -1
    }

    return cmp * direction
  })

  return rows
})
</script>

<template>
  <div
    v-if="siblings.length"
    class="rounded-xl border border-default bg-elevated/40 p-3 sm:p-4 space-y-3"
  >
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-base font-semibold text-highlighted">Clases del fondo</h2>
          <UBadge color="neutral" variant="subtle" size="sm">
            {{ siblings.length }} {{ siblings.length === 1 ? 'clase' : 'clases' }}
          </UBadge>
        </div>
        <p class="text-sm text-muted truncate">{{ baseName }}</p>
      </div>

      <div
        v-if="hasMultipleClasses"
        class="shrink-0 rounded-lg border border-default bg-default px-3 py-2 text-sm"
      >
        <p class="text-[10px] uppercase tracking-wide text-muted">Patrimonio total</p>
        <p class="text-lg font-semibold text-highlighted leading-tight">
          {{ formatCompactNumber(patrimonioTotal) }}
        </p>
        <p v-if="classShare != null" class="text-xs text-muted">
          Esta clase: {{ formatCompactNumber(currentPatrimonio) }} ({{
            classShare.toFixed(1).replace('.', ',')
          }}%)
        </p>
      </div>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <UButton
        v-for="row in siblings"
        :key="row.fondo"
        size="sm"
        color="neutral"
        :variant="row.fondo === currentFondo ? 'solid' : 'outline'"
        :to="row.fondo === currentFondo ? undefined : getFundDetailPath(row.fondo)"
        :label="row.classLabel || row.fondo"
      />
    </div>

    <div v-if="hasMultipleClasses" class="overflow-x-auto -mx-1">
      <table class="w-full text-sm min-w-[520px]">
        <thead>
          <tr class="text-left text-muted border-b border-default">
            <th class="py-1 px-1 font-medium">
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                class="-mx-1"
                :icon="sortIcon('clase')"
                label="Clase"
                @click="toggleSort('clase')"
              />
            </th>
            <th class="py-1 px-1 font-medium text-right">
              <div class="flex justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :icon="sortIcon('tna')"
                  label="TNA"
                  @click="toggleSort('tna')"
                />
              </div>
            </th>
            <th class="py-1 px-1 font-medium text-right">
              <div class="flex justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :icon="sortIcon('patrimonio')"
                  label="Patrimonio"
                  @click="toggleSort('patrimonio')"
                />
              </div>
            </th>
            <th class="py-1 px-1 font-medium text-right">
              <div class="flex justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :icon="sortIcon('share')"
                  label="% del fondo"
                  @click="toggleSort('share')"
                />
              </div>
            </th>
            <th class="py-1 px-1 font-medium text-right">
              <div class="flex justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :icon="sortIcon('inversionMinima')"
                  label="Inversión mín."
                  @click="toggleSort('inversionMinima')"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in sortedSiblings"
            :key="`row-${row.fondo}`"
            class="border-b border-default last:border-0"
            :class="row.fondo === currentFondo ? 'bg-neutral-500/5' : ''"
          >
            <td class="py-2.5 px-1">
              <div class="flex items-center gap-2 min-w-0">
                <NuxtLink
                  v-if="row.fondo !== currentFondo"
                  :to="getFundDetailPath(row.fondo)"
                  class="font-medium text-neutral truncate hover:underline"
                >
                  {{ row.classLabel || row.fondo }}
                </NuxtLink>
                <span v-else class="font-medium text-highlighted truncate">
                  {{ row.classLabel || row.fondo }}
                </span>
                <UBadge
                  v-if="row.fondo === currentFondo"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  label="Actual"
                />
              </div>
            </td>
            <td class="py-2.5 px-1 text-right">
              <span :class="metricTone(row.tna)">{{ formatRate(row.tna) ?? '—' }}</span>
            </td>
            <td class="py-2.5 px-1 text-right font-medium">
              {{ formatCompactNumber(row.patrimonio) }}
            </td>
            <td class="py-2.5 px-1 text-right text-muted">
              {{ formatShare(row) }}
            </td>
            <td class="py-2.5 px-1 text-right text-muted">
              {{ formatCurrency(row.inversionMinima, row.monedaInversion || 'ARS') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="hasMultipleClasses" class="text-xs text-muted">
      El patrimonio total suma todas las clases del mismo fondo. La TNA es propia de cada clase.
    </p>
  </div>
</template>

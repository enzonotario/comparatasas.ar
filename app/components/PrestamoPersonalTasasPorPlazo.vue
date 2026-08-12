<script setup lang="ts">
import type { PrestamoPersonalTasaPorPlazo } from '~/composables/usePrestamosPersonales'
import { pickTasasPorPlazo } from '~/lib/finance/prestamo-personal'

const props = withDefaults(
  defineProps<{
    tasas: PrestamoPersonalTasaPorPlazo[]
    /** Plazo del simulador en meses; resalta el tramo activo. */
    selectedMonths?: number | null
    /** Densidad reducida para celdas de tabla. */
    compact?: boolean
  }>(),
  {
    selectedMonths: null,
    compact: false,
  },
)

const SEGMENT_MIN_WIDTH = computed(() => (props.compact ? '3.75rem' : '4.75rem'))

const sorted = computed(() =>
  [...props.tasas]
    .filter((t) => t.plazoMinMeses != null && t.plazoMaxMeses != null)
    .sort((a, b) => (a.plazoMinMeses ?? 0) - (b.plazoMinMeses ?? 0)),
)

const bounds = computed(() => {
  if (!sorted.value.length) return { min: 0, max: 0 }
  return {
    min: Math.min(...sorted.value.map((t) => t.plazoMinMeses!)),
    max: Math.max(...sorted.value.map((t) => t.plazoMaxMeses!)),
  }
})

const isSimulating = computed(
  () => props.selectedMonths != null && Number.isFinite(props.selectedMonths),
)

const activeTramo = computed(() =>
  isSimulating.value ? pickTasasPorPlazo(sorted.value, props.selectedMonths!) : null,
)

function segmentFlex(tramo: PrestamoPersonalTasaPorPlazo): number {
  return (tramo.plazoMaxMeses ?? 0) - (tramo.plazoMinMeses ?? 0) + 1
}

function formatPct(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toFixed(0)}%`
}

/** Preferir CFT TEA (lo que importa para comparar); fallback a TNA. */
function rateForDisplay(tramo: PrestamoPersonalTasaPorPlazo): number | null {
  if (tramo.cftTea != null && Number.isFinite(tramo.cftTea)) return tramo.cftTea
  if (tramo.tna != null && Number.isFinite(tramo.tna)) return tramo.tna
  return null
}

function rateLabel(tramo: PrestamoPersonalTasaPorPlazo): 'CFT' | 'TNA' | null {
  if (tramo.cftTea != null && Number.isFinite(tramo.cftTea)) return 'CFT'
  if (tramo.tna != null && Number.isFinite(tramo.tna)) return 'TNA'
  return null
}

function formatPlazoCompact(tramo: PrestamoPersonalTasaPorPlazo): string {
  const min = tramo.plazoMinMeses
  const max = tramo.plazoMaxMeses
  if (min == null || max == null) return '—'
  if (min === max) return `${max}m`
  return `${min}–${max}m`
}

function formatPlazoFull(tramo: PrestamoPersonalTasaPorPlazo): string {
  const min = tramo.plazoMinMeses
  const max = tramo.plazoMaxMeses
  if (min == null || max == null) return '—'
  if (min === max) return `${max} meses`
  return `${min}–${max} meses`
}

function isHighlighted(tramo: PrestamoPersonalTasaPorPlazo): boolean {
  if (!isSimulating.value) return true
  return activeTramo.value === tramo
}

function segmentClass(tramo: PrestamoPersonalTasaPorPlazo): string {
  const highlighted = isHighlighted(tramo)
  const dim = isSimulating.value && !highlighted
  const active = highlighted && isSimulating.value

  return [
    active
      ? 'bg-primary-500 text-white border-primary-600 dark:border-primary-300'
      : 'bg-primary-50 text-primary-700 border-primary-200/80 dark:bg-primary-950/40 dark:text-primary-200 dark:border-primary-800',
    dim ? 'opacity-40' : 'opacity-100',
  ].join(' ')
}

function titleFor(tramo: PrestamoPersonalTasaPorPlazo): string {
  const parts = [
    formatPlazoFull(tramo),
    tramo.cftTea != null ? `CFT ${formatPct(tramo.cftTea)}` : null,
    tramo.tna != null ? `TNA ${formatPct(tramo.tna)}` : null,
  ].filter(Boolean)
  return parts.join(' · ')
}
</script>

<template>
  <div v-if="sorted.length" class="w-full space-y-1" @click.stop>
    <div
      v-if="isSimulating && activeTramo"
      class="text-[11px] font-medium tabular-nums leading-none text-primary-600 dark:text-primary-400"
      :class="compact ? 'text-left' : 'text-right'"
    >
      Tramo {{ formatPlazoCompact(activeTramo) }} ·
      {{ rateLabel(activeTramo) }} {{ formatPct(rateForDisplay(activeTramo)) }}
      <span
        v-if="activeTramo.cftTea != null && activeTramo.tna != null"
        class="opacity-75"
      >
        · TNA {{ formatPct(activeTramo.tna) }}
      </span>
    </div>

    <div class="relative w-full">
      <div class="overflow-x-auto overflow-y-hidden overscroll-x-contain">
        <div
          class="relative flex w-full min-w-max gap-1 rounded-lg bg-neutral-100/80 p-1 dark:bg-neutral-800/50"
        >
          <div
            v-for="(tramo, index) in sorted"
            :key="`${tramo.plazoMinMeses}-${tramo.plazoMaxMeses}-${index}`"
            class="relative flex shrink-0 items-center justify-center rounded-md border transition-opacity duration-200"
            :class="[segmentClass(tramo), compact ? 'px-1 py-1' : 'px-1.5 py-1.5']"
            :style="{
              flex: `${segmentFlex(tramo)} 1 0`,
              minWidth: SEGMENT_MIN_WIDTH,
            }"
            :title="titleFor(tramo)"
          >
            <span
              class="font-semibold leading-none tabular-nums whitespace-nowrap"
              :class="compact ? 'text-[10px]' : 'text-[11px]'"
            >
              {{ formatPct(rateForDisplay(tramo)) }}
              <span class="font-medium opacity-75">· {{ formatPlazoCompact(tramo) }}</span>
            </span>
          </div>
        </div>
      </div>

      <div
        class="mt-1 flex justify-between text-[10px] leading-none tabular-nums text-neutral-400 dark:text-neutral-500"
      >
        <span>{{ bounds.min }}m</span>
        <span>{{ bounds.max }}m</span>
      </div>
    </div>

    <p
      v-if="isSimulating && !activeTramo"
      class="text-[11px] leading-snug text-amber-700 dark:text-amber-300"
    >
      Con {{ selectedMonths }}m no hay tramo ({{ bounds.min }}–{{ bounds.max }}m).
    </p>
  </div>
</template>

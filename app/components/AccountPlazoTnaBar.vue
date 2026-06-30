<script setup lang="ts">
import type { AccountPlazoTier } from '~/lib/account-plazo-tiers'
import { getPlazoTierBounds } from '~/lib/account-plazo-tiers'

/** Colores de marca Naranja X (del logo oficial). */
const NX_ORANGE = '#FE5000'
const NX_ORANGE_LIGHT = '#FFF0E8'
const NX_PURPLE = '#50007F'

/** Ancho mínimo por tramo para que "18% · 14–27d" entre en una sola línea. */
const SEGMENT_MIN_WIDTH = '4.25rem'

const props = defineProps<{
  tiers: AccountPlazoTier[]
  selectedDays?: number
}>()

const bounds = computed(() => getPlazoTierBounds(props.tiers))

const maxTna = computed(() => Math.max(...props.tiers.map((t) => t.tna)))

const isSimulating = computed(() => props.selectedDays != null)

const activeTier = computed(() => {
  if (!isSimulating.value) return null
  return (
    props.tiers.find(
      (t) => props.selectedDays! >= t.plazoMinDias && props.selectedDays! <= t.plazoMaxDias,
    ) ?? null
  )
})

function segmentFlex(tier: AccountPlazoTier): number {
  return tier.plazoMaxDias - tier.plazoMinDias + 1
}

function markerLeft(days: number): string {
  const span = bounds.value.maxDias - bounds.value.minDias
  if (span <= 0) return '0%'
  const clamped = Math.min(bounds.value.maxDias, Math.max(bounds.value.minDias, days))
  return `${((clamped - bounds.value.minDias) / span) * 100}%`
}

function formatTna(tna: number): string {
  return `${(tna * 100).toFixed(0)}%`
}

function formatPlazoLabel(tier: AccountPlazoTier): string {
  if (tier.plazoMinDias === tier.plazoMaxDias) return `${tier.plazoMaxDias} días`
  return `${tier.plazoMinDias}–${tier.plazoMaxDias} días`
}

function formatPlazoLabelCompact(tier: AccountPlazoTier): string {
  if (tier.plazoMinDias === tier.plazoMaxDias) return `${tier.plazoMaxDias}d`
  return `${tier.plazoMinDias}–${tier.plazoMaxDias}d`
}

function isPremiumTier(tier: AccountPlazoTier): boolean {
  return tier.tna >= maxTna.value && maxTna.value > Math.min(...props.tiers.map((t) => t.tna))
}

function isTierHighlighted(tier: AccountPlazoTier): boolean {
  if (!isSimulating.value) return true
  return activeTier.value === tier
}

function segmentSurface(tier: AccountPlazoTier): Record<string, string> {
  const premium = isPremiumTier(tier)
  const highlighted = isTierHighlighted(tier)

  if (premium) {
    return {
      backgroundColor: NX_ORANGE,
      color: '#ffffff',
      opacity: highlighted ? '1' : '0.38',
    }
  }

  return {
    backgroundColor: NX_ORANGE_LIGHT,
    color: NX_ORANGE,
    borderColor: 'rgba(254, 80, 0, 0.18)',
    opacity: highlighted ? '1' : '0.42',
  }
}
</script>

<template>
  <div class="w-full space-y-1">
    <div
      v-if="isSimulating && activeTier"
      class="text-right text-[11px] font-medium tabular-nums leading-none"
      :style="{ color: NX_ORANGE }"
    >
      Simulando {{ formatPlazoLabel(activeTier) }} · {{ formatTna(activeTier.tna) }}
    </div>

    <div class="relative w-full overflow-x-auto">
      <div
        class="relative flex w-full min-w-max gap-1 rounded-lg bg-neutral-100/80 p-1 dark:bg-neutral-800/50"
      >
        <div
          v-for="(tier, index) in tiers"
          :key="`${tier.plazoMinDias}-${tier.plazoMaxDias}-${index}`"
          class="relative flex shrink-0 items-center justify-center rounded-md border px-1.5 py-1.5 transition-opacity duration-200"
          :class="[isPremiumTier(tier) ? 'border-transparent' : 'border-solid']"
          :style="{
            flex: `${segmentFlex(tier)} 1 0`,
            minWidth: SEGMENT_MIN_WIDTH,
            ...segmentSurface(tier),
            ...(isSimulating && activeTier === tier
              ? { boxShadow: `inset 0 0 0 1.5px ${NX_PURPLE}` }
              : {}),
          }"
          :title="`${formatPlazoLabel(tier)} · ${formatTna(tier.tna)} TNA`"
        >
          <span class="text-[11px] font-semibold leading-none tabular-nums whitespace-nowrap">
            {{ formatTna(tier.tna) }}
            <span class="font-medium opacity-75">· {{ formatPlazoLabelCompact(tier) }}</span>
          </span>
        </div>

        <div
          v-if="isSimulating && activeTier"
          class="pointer-events-none absolute inset-y-1 z-10 w-px -translate-x-1/2"
          :style="{ left: markerLeft(selectedDays!) }"
        >
          <div
            class="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full"
            :style="{ backgroundColor: NX_PURPLE }"
          />
          <div class="h-full w-px opacity-80" :style="{ backgroundColor: NX_PURPLE }" />
        </div>
      </div>

      <div
        class="mt-1 flex justify-between text-[10px] leading-none tabular-nums text-neutral-400 dark:text-neutral-500"
      >
        <span>{{ bounds.minDias }}d</span>
        <span>{{ bounds.maxDias }}d</span>
      </div>
    </div>

    <p
      v-if="isSimulating && !activeTier"
      class="text-[11px] leading-snug text-amber-700 dark:text-amber-300"
    >
      Con {{ selectedDays }} días no aplica ningún tramo ({{ bounds.minDias }}–{{ bounds.maxDias }}
      días).
    </p>
  </div>
</template>

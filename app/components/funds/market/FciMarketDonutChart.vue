<script setup lang="ts">
import { defineChart } from '@tanstack/charts'
import { pie, polar, radialArc } from '@tanstack/charts/polar'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { CHART_COLORS } from '~/composables/useChartConfig'
import { formatCompactNumber } from '~/lib/fci-fund-formatters'

const props = defineProps<{
  labels: string[]
  values: number[]
  colors?: string[]
  centerLabel?: string
  centerHint?: string
  heightClass?: string
}>()

interface Slice {
  name: string
  amount: number
  color: string
}

const slices = computed<Slice[]>(() =>
  props.labels.flatMap((name, index) => {
    const amount = props.values[index] ?? 0
    if (!Number.isFinite(amount) || amount < 0) return []
    return [
      {
        name,
        amount,
        color: props.colors?.[index] ?? CHART_COLORS[index % CHART_COLORS.length]!,
      },
    ]
  }),
)

function formatShare(fraction: number) {
  return `${new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 1,
  }).format(fraction * 100)}%`
}

const definition = computed(() => {
  const arcs = pie(slices.value, { value: 'amount', gapAngle: 0.02 })

  return defineChart(
    {
      marks: [
        polar({
          radiusRatio: 0.78,
          marks: [
            radialArc(arcs, {
              innerRadius: ({ radius }) => radius * (0.58 / 0.78),
              cornerRadius: 6,
              key: (slice) => slice.source[0]?.name ?? String(slice.index),
              fill: (slice) => slice.source[0]?.color ?? CHART_COLORS[0]!,
            }),
          ],
          scales: {
            angle: null,
            radius: null,
          },
        }),
      ],
      scales: {
        x: null,
        y: null,
      },
    },
    {
      tooltip: {
        use: tooltip,
        content: (points) => {
          const point = points[0]
          if (!point) return { rows: [] }
          const source = point.datum.source[0]
          if (!source) return { rows: [] }
          return {
            title: source.name,
            color: source.color,
            rows: [
              {
                label: formatCompactNumber(point.datum.value),
                value: formatShare(point.datum.fraction),
              },
            ],
          }
        },
      },
    },
  )
})
</script>

<template>
  <div class="relative" :class="heightClass ?? 'h-72 w-full'">
    <ClientOnly>
      <Chart
        :definition="definition"
        aria-label="Distribución"
        class="h-full w-full"
        :style="{ height: '100%' }"
      />
      <template #fallback>
        <div class="h-full w-full rounded-lg bg-elevated/40" />
      </template>
    </ClientOnly>
    <div
      v-if="centerLabel"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
    >
      <p class="text-[10px] uppercase tracking-wide text-muted">{{ centerHint }}</p>
      <p class="text-sm font-semibold text-highlighted">{{ centerLabel }}</p>
    </div>
  </div>
</template>

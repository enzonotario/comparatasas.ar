<script setup lang="ts">
import 'vue-data-ui/style.css'
import type { TableColumn } from '@nuxt/ui'
import type { VueUiDonutConfig, VueUiDonutDatasetItem } from 'vue-data-ui'
import type { FciFundDetail } from '~/composables/useFciFundDetails'
import type { ReturnRow } from '~/composables/useFciFundPresentation'
import { CHART_COLORS, useChartTheme } from '~/composables/useChartConfig'
import { useVueDataUiChart } from '~/composables/useVueDataUiChart'
import { formatCurrency, formatDate, formatPercentAuto } from '~/lib/fci-fund-formatters'

const props = defineProps<{
  fundDetail: FciFundDetail
  returnsRows: ReturnRow[]
  returnsColumns: TableColumn<ReturnRow>[]
  compositionRows: Array<{ nombre: string | null; porcentaje: number | null }>
  maxCompositionPercentage: number
  feeRows: Array<[string, number | null]>
}>()

const { textColor, colorMode } = useChartTheme()
const compositionDonutChart = useVueDataUiChart('VueUiDonut')

const compositionChartSegments = computed(() => {
  return props.compositionRows
    .filter((item) => (item.porcentaje ?? 0) > 0)
    .map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
})

const compositionDonutDataset = computed<VueUiDonutDatasetItem[]>(() => {
  return compositionChartSegments.value.map((segment) => ({
    name: segment.nombre || 'Sin nombre',
    color: segment.color,
    values: [segment.porcentaje ?? 0],
  }))
})

const visibleFeeRows = computed(() => {
  return props.feeRows.filter(([, value]) => {
    return typeof value === 'number' && value > 0
  })
})

const compositionDonutConfig = computed<VueUiDonutConfig>(() => ({
  responsive: true,
  useCssAnimation: true,
  useBlurOnHover: true,
  customPalette: CHART_COLORS,
  style: {
    fontFamily: 'inherit',
    chart: {
      useGradient: true,
      gradientIntensity: 40,
      backgroundColor: colorMode.value === 'dark' ? '#0f0f10' : '#fafafa',
      color: textColor.value,
      layout: {
        curvedMarkers: true,
        labels: {
          dataLabels: {
            show: true,
            oneLine: true,
            hideUnderValue: 2,
            prefix: '',
            suffix: '%',
          },
          value: {
            show: false,
          },
          percentage: {
            show: true,
            color: textColor.value,
            bold: true,
            fontSize: 13,
          },
          name: {
            show: true,
            color: textColor.value,
            bold: false,
            fontSize: 12,
          },
          hollow: {
            total: {
              show: false,
              text: '',
              color: textColor.value,
              fontSize: 14,
              value: {
                show: false,
                color: textColor.value,
                fontSize: 20,
                bold: true,
                suffix: '%',
                rounding: 1,
              },
            },
            average: {
              show: false,
              text: '',
              color: textColor.value,
              fontSize: 14,
              value: {
                show: false,
                color: textColor.value,
                fontSize: 20,
                bold: false,
                suffix: '',
                rounding: 1,
              },
            },
          },
        },
        donut: {
          radiusRatio: 0.2,
          strokeWidth: 20,
          borderWidth: 1,
          borderColor: colorMode.value === 'dark' ? '#18181b' : '#ffffff',
          borderColorAuto: false,
          useShadow: false,
        },
      },
      legend: {
        show: false,
      },
      title: {
        text: '',
      },
      tooltip: {
        show: true,
        backgroundColor: colorMode.value === 'dark' ? '#09090b' : '#ffffff',
        color: textColor.value,
        fontSize: 12,
        showValue: true,
        roundingValue: 1,
        showPercentage: true,
        roundingPercentage: 1,
      },
    },
  },
}))
</script>

<template>
  <div class="space-y-6">
    <div class="grid items-start gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <UCard
        :ui="{
          body: '!p-0',
        }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Rendimientos</h2>
        </template>

        <UTable :data="props.returnsRows" :columns="props.returnsColumns" />
      </UCard>

      <div class="grid items-start gap-6 xl:grid-cols-2">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Operativa, honorarios y comisiones</h2>
          </template>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
              <p class="text-xs uppercase tracking-wide text-neutral-500">Inversión mínima</p>
              <p class="mt-1 text-lg font-semibold">
                {{
                  formatCurrency(
                    props.fundDetail.inversionMinima,
                    props.fundDetail.monedaInversion || 'ARS',
                  )
                }}
              </p>
            </div>

            <div class="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
              <p class="text-xs uppercase tracking-wide text-neutral-500">Liquidación</p>
              <p class="mt-1 text-lg font-semibold">
                {{ props.fundDetail.plazoLiquidacionDias ?? '—' }} días
              </p>
            </div>

            <template v-if="visibleFeeRows.length">
              <div
                v-for="[label, value] in visibleFeeRows"
                :key="label"
                class="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <p class="text-xs uppercase tracking-wide text-neutral-500">{{ label }}</p>
                <p class="mt-1 font-medium">{{ formatPercentAuto(value as number | null) }}</p>
              </div>
            </template>
          </div>
          <p v-if="!visibleFeeRows.length" class="mt-3 text-sm text-neutral-500">
            No hay honorarios detallados disponibles.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Calificaciones</h2>
          </template>

          <div v-if="props.fundDetail.calificaciones.length" class="space-y-3">
            <div
              v-for="rating in props.fundDetail.calificaciones"
              :key="`${rating.calificadora}-${rating.calificacion}-${rating.fecha}`"
              class="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div class="flex flex-wrap items-center gap-2">
                <UBadge v-if="rating.calificacion" color="primary" variant="soft">{{
                  rating.calificacion
                }}</UBadge>
                <span class="font-medium text-neutral-900 dark:text-white">{{
                  rating.calificadora || 'Sin calificadora'
                }}</span>
              </div>
              <p class="mt-1 text-sm text-neutral-500">{{ formatDate(rating.fecha) }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-neutral-500">No hay calificaciones disponibles.</p>
        </UCard>
      </div>
    </div>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Composición de cartera</h2>
      </template>

      <div
        v-if="props.compositionRows.length"
        class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)]"
      >
        <div class="space-y-4">
          <div
            v-for="item in props.compositionRows"
            :key="`${item.nombre}-${item.porcentaje}`"
            class="space-y-2"
          >
            <div class="flex items-end justify-between gap-4 text-sm">
              <span class="min-w-0 truncate font-medium text-neutral-900 dark:text-white">
                {{ item.nombre || 'Sin nombre' }}
              </span>
              <span class="shrink-0 font-semibold text-neutral-700 dark:text-neutral-200">
                {{ formatPercentAuto(item.porcentaje, 1) }}
              </span>
            </div>

            <div class="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900">
              <div
                class="h-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100"
                :style="{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      props.maxCompositionPercentage
                        ? ((item.porcentaje ?? 0) / props.maxCompositionPercentage) * 100
                        : 0,
                    ),
                  )}%`,
                }"
              />
            </div>
          </div>
        </div>

        <div
          class="min-h-[460px] rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/60"
        >
          <ClientOnly>
            <component
              :is="compositionDonutChart"
              v-if="compositionDonutChart && compositionDonutDataset.length"
              :dataset="compositionDonutDataset"
              :config="compositionDonutConfig"
              class="w-full"
            />
          </ClientOnly>
        </div>
      </div>
      <p v-else class="text-sm text-neutral-500">No hay composición detallada disponible.</p>
    </UCard>
  </div>
</template>

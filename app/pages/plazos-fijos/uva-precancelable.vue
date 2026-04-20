<script setup lang="ts">
import PlazosFijosPrecancelableUvaHistoryChart from '~/components/charts/PlazosFijosPrecancelableUvaHistoryChart.vue'
import PlazosFijosTnaBarChart from '~/components/charts/PlazosFijosTnaBarChart.vue'
import { ogUpdatedAtDate } from '~/utils/og-data'

definePageMeta({
  pageTitle: 'Plazo fijo UVA precancelable',
  pageDescription:
    'Comparativa de plazos fijos UVA precancelables: tasa UVA, tasa de precancelación, plazos, montos y canales.',
})

const PF_UVA_PRE_DIAS_MIN = 90
const PF_UVA_PRE_DIAS_MAX = 370
const uvaPrecancelableSimulatorPresets = [
  { value: 90, label: '90d' },
  { value: 180, label: '180d' },
  { value: 270, label: '270d' },
  { value: 370, label: '370d' },
]

const { data: ogItems } = await useAsyncData('og-plazos-uva-precancelable', async () => {
  type Row = {
    entidad: string
    tna: number | null
    tnaPrecancelacion: number | null
  }
  const rows = await $fetch<Row[]>(
    'https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijoPrecancelable',
  )
  return rows
    .map((row) => ({
      name: row.entidad,
      rate:
        row.tnaPrecancelacion == null
          ? `${((row.tna ?? 0) * 100).toFixed(2)}% TNA UVA`
          : `${(row.tnaPrecancelacion * 100).toFixed(2)}% TNA prec.`,
      sortRate: row.tnaPrecancelacion ?? row.tna ?? 0,
    }))
    .filter((row) => row.sortRate > 0)
    .sort((a, b) => b.sortRate - a.sortRate)
    .slice(0, 3)
    .map(({ name, rate }) => ({ name, rate }))
})

defineOgImage('ComparaTasas.takumi', {
  title: 'PF UVA precancelable',
  items: ogItems.value ?? [],
  updatedAt: ogUpdatedAtDate(),
})

useSeoMeta({
  title: 'Plazo fijo UVA precancelable',
  description:
    'Compará bancos con plazo fijo UVA precancelable en Argentina. Tasas UVA, tasas de precancelación, plazos, montos y canales actualizados.',
  ogTitle: 'Plazo fijo UVA precancelable - Compara Tasas',
  ogDescription:
    'Tasas y condiciones de plazos fijos UVA precancelables por entidad bancaria en Argentina.',
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://comparatasas.ar/plazos-fijos/uva-precancelable',
    },
    {
      rel: 'alternate',
      hreflang: 'es-AR',
      href: 'https://comparatasas.ar/plazos-fijos/uva-precancelable',
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: 'https://comparatasas.ar/plazos-fijos/uva-precancelable',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Plazo fijo UVA precancelable - Compara Tasas',
        description: 'Comparativa de plazos fijos UVA precancelables en Argentina.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
})

const {
  plazosFijosPrecancelablesItems,
  loading: loadingPrecancelables,
  error: errorPrecancelables,
} = usePlazosFijosPrecancelables()

const { uvaHistorica, loading: loadingUVA, error: errorUVA, fetch: fetchUVA } = useUVA()

const { amount, calculateResults, isSimulating, days } = useInvestmentSimulator()
const plazosFijosPrecancelablesWithSimulation = calculateResults(plazosFijosPrecancelablesItems)

const selectedInstitution = ref<string | undefined>(undefined)

watch(
  plazosFijosPrecancelablesItems,
  (items) => {
    if (!items.length) return
    const first = items[0]
    if (!first) return
    if (
      selectedInstitution.value === undefined ||
      !items.some((i) => i.institution === selectedInstitution.value)
    ) {
      selectedInstitution.value = first.institution
    }
  },
  { immediate: true },
)

const selectedPrecancelableItem = computed(() => {
  if (!selectedInstitution.value) return null
  return (
    plazosFijosPrecancelablesItems.value.find((i) => i.institution === selectedInstitution.value) ??
    null
  )
})

const institutionSelectItems = computed(() =>
  plazosFijosPrecancelablesItems.value.map((i) => ({
    label: i.institution,
    value: i.institution,
  })),
)

onMounted(async () => {
  if (days.value < PF_UVA_PRE_DIAS_MIN) days.value = 180
  if (days.value > PF_UVA_PRE_DIAS_MAX) days.value = PF_UVA_PRE_DIAS_MAX
  await fetchUVA()
})

function formatPercent(value: number | null): string {
  if (value == null) return 'No informado'
  return `${value.toFixed(2)}%`
}

function formatCurrency(value: number | null): string {
  if (value == null) return 'No informado'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
</script>

<template>
  <div class="space-y-6">
    <InvestmentSimulator
      :default-amount="100000"
      :default-days="180"
      :preset-days="uvaPrecancelableSimulatorPresets"
      :preset-amounts="[
        { value: 100000, label: '$100k' },
        { value: 1000000, label: '$1M' },
        { value: 5000000, label: '$5M' },
      ]"
      :days-min="PF_UVA_PRE_DIAS_MIN"
      :days-max="PF_UVA_PRE_DIAS_MAX"
      interest-info-mode="uvaPagoPeriodico"
      days-field-description="La simulación usa el plazo contractual de la colocación; no calcula rescates anticipados."
    />

    <div class="flex items-center justify-between mb-2">
      <h2 id="plazos-fijos-uva-precancelable" class="text-lg font-medium scroll-mt-16">
        Plazos Fijos
      </h2>
    </div>

    <PlazosFijosNavTabs />

    <div class="space-y-4 mt-6">
      <p class="text-sm text-neutral-600 dark:text-neutral-400 max-w-3xl">
        Plazos fijos en UVA con opción de precancelación. La TNA principal es la tasa adicional
        sobre UVA si mantenés la colocación hasta el plazo pactado; la tasa de precancelación se
        muestra aparte.
      </p>

      <UAlert
        v-if="errorPrecancelables"
        color="error"
        variant="soft"
        title="Error cargando plazos fijos UVA precancelables"
      />

      <FundsLoading v-if="loadingPrecancelables && !plazosFijosPrecancelablesItems.length" />

      <FundsList
        v-else
        :items="plazosFijosPrecancelablesWithSimulation"
        mode="simple"
        :show-simulation="isSimulating"
        :simulator-days="days"
      >
        <template #badges-end="{ item }">
          <UBadge
            v-if="item.tnaPrecancelacion != null"
            color="warning"
            variant="outline"
            class="text-amber-800 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/30"
          >
            Precancelación: {{ formatPercent(item.tnaPrecancelacion) }} TNA
          </UBadge>
          <UBadge
            v-if="item.plazoPrecancelacionDias != null"
            color="neutral"
            variant="outline"
            class="text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-950/30"
          >
            Desde {{ item.plazoPrecancelacionDias }} días
          </UBadge>
        </template>

        <template #details="{ item }">
          <div
            class="grid gap-2 pt-2 text-xs text-neutral-600 dark:text-neutral-400 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <span class="font-medium text-neutral-800 dark:text-neutral-200">TEA UVA:</span>
              {{ formatPercent(item.tea) }}
            </div>
            <div>
              <span class="font-medium text-neutral-800 dark:text-neutral-200">TEA prec.:</span>
              {{ formatPercent(item.teaPrecancelacion) }}
            </div>
            <div>
              <span class="font-medium text-neutral-800 dark:text-neutral-200">Monto min.:</span>
              {{ formatCurrency(item.montoMinimo) }}
            </div>
            <div v-if="item.avisoPrecancelacionDias != null">
              <span class="font-medium text-neutral-800 dark:text-neutral-200">Aviso:</span>
              {{ item.avisoPrecancelacionDias }} días
            </div>
            <div v-if="item.canal" class="sm:col-span-2">
              <span class="font-medium text-neutral-800 dark:text-neutral-200">Canal:</span>
              {{ item.canal }}
            </div>
            <div v-if="item.modalidad">
              <span class="font-medium text-neutral-800 dark:text-neutral-200">Modalidad:</span>
              {{ item.modalidad }}
            </div>
          </div>
        </template>
      </FundsList>

      <div
        v-if="!loadingPrecancelables && !plazosFijosPrecancelablesItems.length"
        class="text-center py-8"
      >
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay plazos fijos UVA precancelables
        </h3>
        <p class="text-muted">No hay datos disponibles en este momento.</p>
      </div>

      <UCard v-if="!loadingPrecancelables && plazosFijosPrecancelablesItems.length > 0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-bar-chart-3"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
            <h3 class="font-semibold text-lg">TNA adicional UVA por entidad</h3>
          </div>
        </template>
        <PlazosFijosTnaBarChart
          :items="plazosFijosPrecancelablesItems"
          parent-group-name="PF UVA precancelable · TNA adicional"
          sort-tna-ascending
          preserve-tna-precision
        />
      </UCard>

      <UCard v-if="!loadingPrecancelables && plazosFijosPrecancelablesItems.length > 0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-line-chart"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
            <h3 class="font-semibold text-lg">Monto final histórico (simulación)</h3>
          </div>
        </template>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4 max-w-3xl">
          Usá el mismo capital y plazo que en los controles de arriba en esta página. El gráfico va
          desde la colocación estimada hasta el último día con UVA. UVA + TNA adicional: capital ×
          (UVA del día / UVA inicial) × (1 + TNA adicional / 365)<sup>d</sup> —la TNA adicional se
          capitaliza día a día (365). Precancelación: interés simple sobre el nominal, capital × (1
          + TNA prec. × d / 365). Si ese monto bruto superara al UVA+TNA del mismo día, la línea
          naranja se dibuja por debajo de la azul con un tope ligado a la TNA de precancelación, sin
          mostrar valores por debajo del capital inicial. Valores orientativos.
        </p>
        <UAlert
          v-if="errorUVA"
          color="error"
          variant="soft"
          title="Error cargando índice UVA"
          class="mb-4"
        />
        <FundsLoading v-else-if="loadingUVA && !uvaHistorica.length" />
        <div v-else class="space-y-4">
          <USelect
            v-model="selectedInstitution"
            :items="institutionSelectItems"
            value-key="value"
            placeholder="Entidad"
            class="w-full max-w-md"
          >
            <template #item-label="{ item: opt }">
              {{ opt.label }}
            </template>
          </USelect>
          <PlazosFijosPrecancelableUvaHistoryChart
            :uva-rows="uvaHistorica"
            :item="selectedPrecancelableItem"
            :monto-simulacion="amount"
            :dias-contrato="days"
            :step-dias="1"
          />
        </div>
      </UCard>
    </div>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto">
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            ¿Qué es un plazo fijo UVA precancelable?
          </h3>
          <p>
            Es una colocación en pesos ajustada por UVA, con una tasa adicional informada por la
            entidad. Si necesitás retirar antes del vencimiento, la precancelación aplica desde el
            plazo mínimo indicado y puede usar una tasa distinta.
          </p>
          <p>
            Antes de contratar, verificá el plazo mínimo, el aviso requerido, los montos disponibles
            y el canal habilitado por cada banco.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

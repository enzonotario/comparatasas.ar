<script setup lang="ts">
import { UBadge, UButton } from '#components'
import LecapYieldCurveChart from '~/components/charts/LecapYieldCurveChart.vue'
import { ogUpdatedAtDate } from '~/utils/og-data'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  pageTitle: 'LECAPs',
  pageDescription:
    'Precios en vivo de LECAPs y BONCAPs (Letras y Bonos de Capitalización) en Argentina.',
})

useSeoMeta({
  title: 'LECAPs y BONCAPs',
  description:
    'Consultá los precios actualizados de las LECAPs y BONCAPs en el mercado secundario argentino.',
  ogTitle: 'LECAPs y BONCAPs - Precios en Vivo',
  ogDescription:
    'Consultá los precios actualizados de las LECAPs y BONCAPs en el mercado secundario argentino.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/lecaps' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/lecaps' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/lecaps' },
  ],
})

const { lecapsItems, loading, error, fetch } = useLecaps()
const { amount, days, calculateCompoundInterest, isSimulating } = useInvestmentSimulator()

// Datos para la imagen OG
const { data: ogData } = await useAsyncData('og-lecaps', async () => {
  // Intentar usar los datos si ya existen (aunque en SSR inicial estarán vacíos)
  if (lecapsItems.value.length > 0) return lecapsItems.value

  // Si no hay datos, forzar un fetch
  await fetch()
  return lecapsItems.value
})

defineOgImage('LecapsCurve.takumi', {
  title: 'LECAPs y BONCAPs',
  lecaps: ogData.value ?? [],
  updatedAt: ogUpdatedAtDate(),
})

const sorting = ref([
  {
    id: 'days',
    desc: false,
  },
])

const lecapsWithSimulation = computed(() => {
  return lecapsItems.value.map((item) => {
    const itemDays = item.days || days.value
    const effectiveDays = Math.max(1, Math.min(days.value, itemDays))
    const rate = item.tir || 0
    const simulationResult = calculateCompoundInterest(amount.value, rate, effectiveDays)

    return {
      ...item,
      simulation: {
        initialAmount: amount.value,
        finalAmount: simulationResult.finalAmount,
        earned: simulationResult.earned,
        requestedDays: days.value,
        effectiveDays,
        itemDays,
        isOutOfHorizon: itemDays > days.value,
      },
    }
  })
})

function getRowToneClass(row: any) {
  const isOutOfHorizon = row?.simulation?.isOutOfHorizon
  return isSimulating.value && isOutOfHorizon ? 'opacity-40 text-muted' : ''
}

function createSortableHeader(label: string, accessorKey: string) {
  return ({ column }: { column: any }) => {
    const isSorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label,
      icon: isSorted
        ? isSorted === 'asc'
          ? 'i-lucide-arrow-up-narrow-wide'
          : 'i-lucide-arrow-down-wide-narrow'
        : 'i-lucide-arrow-up-down',
      class: '-mx-2.5 font-bold',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    })
  }
}

const baseColumns: TableColumn<any>[] = [
  {
    accessorKey: 'symbol',
    header: createSortableHeader('Ticker', 'symbol'),
    cell: ({ row }) =>
      h('div', { class: `flex items-center gap-2 ${getRowToneClass(row.original)}` }, [
        h('span', { class: 'font-bold text-neutral-900 dark:text-white' }, row.getValue('symbol')),
        h(
          UBadge,
          {
            variant: 'soft',
            size: 'xs',
            color: (row.original as any).type === 'BONCAP' ? 'primary' : 'success',
            class: 'font-bold px-1.5 py-0.5',
          },
          () => (row.original as any).type,
        ),
      ]),
  },
  {
    accessorKey: 'price',
    header: createSortableHeader('Precio', 'price'),
    cell: ({ row }) =>
      h(
        'div',
        {
          class: `${getRowToneClass(row.original)} text-primary-600 dark:text-primary-400 font-bold`,
        },
        formatCurrency(row.getValue('price') as number),
      ),
  },
  {
    accessorKey: 'finalPayment',
    header: createSortableHeader('Pago final', 'finalPayment'),
    cell: ({ row }) =>
      h(
        'div',
        { class: getRowToneClass(row.original) },
        formatCurrency(row.getValue('finalPayment') as number),
      ),
  },
  {
    accessorKey: 'days',
    header: createSortableHeader('Días', 'days'),
    cell: ({ row }) => h('div', { class: getRowToneClass(row.original) }, row.getValue('days')),
  },
  {
    accessorKey: 'maturity',
    header: createSortableHeader('Vencimiento', 'maturity'),
    cell: ({ row }) =>
      h(
        'div',
        { class: getRowToneClass(row.original) },
        formatDate(row.getValue('maturity') as string),
      ),
  },
  {
    accessorKey: 'tna',
    header: createSortableHeader('TNA', 'tna'),
    cell: ({ row }) =>
      h(
        'div',
        { class: `${getRowToneClass(row.original)} font-bold` },
        formatPercent(row.getValue('tna') as number),
      ),
  },
  {
    accessorKey: 'tir',
    header: createSortableHeader('TIR', 'tir'),
    cell: ({ row }) =>
      h(
        'div',
        { class: `${getRowToneClass(row.original)} font-bold text-green-600 dark:text-green-400` },
        formatPercent(row.getValue('tir') as number),
      ),
  },
]

const simulationColumns: TableColumn<any>[] = [
  {
    accessorKey: 'simulation.finalAmount',
    header: createSortableHeader('Monto final', 'simulation.finalAmount'),
    cell: ({ row }) => {
      const simulation = (row.original as any).simulation
      return h(
        'div',
        {
          class: `${getRowToneClass(row.original)} font-bold text-primary-600 dark:text-primary-400`,
        },
        formatCurrency(simulation.finalAmount),
      )
    },
  },
  {
    accessorKey: 'simulation.earned',
    header: createSortableHeader('Ganancia', 'simulation.earned'),
    cell: ({ row }) => {
      const simulation = (row.original as any).simulation
      const value = formatCurrency(simulation.earned)
      const baseClass =
        'font-bold ' +
        (simulation.earned >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600')
      return h('div', { class: `${getRowToneClass(row.original)} ${baseClass}` }, value)
    },
  },
]

const columns = computed(() =>
  isSimulating.value ? [...baseColumns, ...simulationColumns] : baseColumns,
)

onMounted(() => {
  fetch()
})

function formatCurrency(value: number): string {
  if (!value) return '-'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  if (!value) return '-'
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string): string {
  if (!value) return '-'
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year!, month! - 1, day)
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date)
}
</script>

<template>
  <UContainer class="w-full mx-auto space-y-6 max-w-6xl">
    <InvestmentSimulator
      :preset-amounts="[
        { value: 500000, label: '$500k' },
        { value: 1000000, label: '$1M' },
        { value: 10000000, label: '$10M' },
      ]"
      :preset-days="[
        { value: 30, label: '30d' },
        { value: 60, label: '60d' },
        { value: 180, label: '180d' },
        { value: 360, label: '360d' },
      ]"
    />

    <div class="flex items-center justify-between mb-2">
      <h2 id="lecaps" class="text-lg font-medium scroll-mt-16 text-neutral-900 dark:text-white">
        LECAPs y BONCAPs
      </h2>
      <div v-if="!loading" class="text-xs text-muted">Fuente: data912</div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Error cargando datos de LECAPs" />

    <FundsLoading v-if="loading && !lecapsItems.length" />

    <div v-else-if="lecapsItems.length" class="space-y-6">
      <div class="border border-default rounded-lg overflow-hidden">
        <UTable
          v-model:sorting="sorting"
          :data="lecapsWithSimulation"
          :columns="columns"
          :loading="loading"
        >
          <template #empty>
            <div class="py-12 text-center">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-12 h-12 text-muted mx-auto mb-4"
              />
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron datos
              </h3>
              <p class="text-muted">No hay LECAPs o BONCAPs disponibles en este momento.</p>
            </div>
          </template>
        </UTable>
      </div>

      <div class="border border-default rounded-lg p-4 bg-white dark:bg-neutral-900">
        <h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
          Curva de Rendimientos (TIR vs Días)
        </h3>
        <LecapYieldCurveChart :lecaps="lecapsItems" />
      </div>
    </div>

    <div v-if="!loading && !lecapsItems.length" class="hidden">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No se encontraron datos
      </h3>
      <p class="text-muted">No hay LECAPs o BONCAPs disponibles en este momento.</p>
    </div>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto text-sm leading-relaxed">
        <div class="space-y-4">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">¿Qué son las LECAPs?</h3>
          <p>
            Las <strong>LECAPs</strong> (Letras de Capitalización) son instrumentos de deuda a corto
            plazo emitidos por el Tesoro Nacional de Argentina. A diferencia de otros bonos, las
            LECAPs capitalizan intereses mensualmente, lo que significa que el interés generado se
            suma al capital para el cálculo del mes siguiente.
          </p>
          <p>
            Son una alternativa popular al plazo fijo para inversores que buscan liquidez inmediata
            (se pueden vender en el mercado secundario en cualquier momento) y tasas que suelen
            estar alineadas o superar a las de los bancos.
          </p>
        </div>
        <div class="space-y-4">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">¿Qué son los BONCAPs?</h3>
          <p>
            Los <strong>BONCAPs</strong> son Bonos de Capitalización, similares a las LECAPs pero
            generalmente con plazos de vencimiento más largos. También capitalizan intereses de
            forma periódica.
          </p>
        </div>
      </div>
    </section>
  </UContainer>
</template>

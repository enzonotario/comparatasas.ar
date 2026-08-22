<script setup lang="ts">
import { UButton } from '#components'
import CaucionYieldCurveChart from '~/components/charts/CaucionYieldCurveChart.vue'
import { type CaucionMoneda, type CaucionRow, useCauciones } from '~/composables/useCauciones'
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatPercentAuto,
} from '~/lib/fci-fund-formatters'
import { ogUpdatedAtDate } from '~/utils/og-data'
import type { TableColumn } from '@nuxt/ui'
import { useRouteQuery } from '@vueuse/router'

definePageMeta({
  pageTitle: 'Cauciones',
  pageDescription:
    'Tasas actuales, min./max. del día y montos de cauciones en pesos y dólares en el mercado argentino.',
})

useSeoMeta({
  title: 'Cauciones ARS y USD',
  description:
    'Consultá tasa actual, tasa min./max. del día, plazos y montos operados de cauciones en ARS y USD.',
  ogTitle: 'Cauciones — ARS y USD',
  ogDescription:
    'Tasa actual, min./max. del día, plazos y volumen de cauciones en pesos y dólares según ArgentinaDatos.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/cauciones' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/cauciones' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/cauciones' },
  ],
})

const monedaQuery = useRouteQuery<CaucionMoneda>('moneda', 'ars')
const moneda = computed<CaucionMoneda>({
  get: () => (monedaQuery.value === 'usd' ? 'usd' : 'ars'),
  set: (value) => {
    monedaQuery.value = value
  },
})

const { items, loading, error, fetch, fechaOperacion, fechaActualizacion } = useCauciones(moneda)
await fetch()

function formatUpdatedAt(value: string | null): string {
  if (!value) return ogUpdatedAtDate()
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value))
}

const formattedUpdatedAt = computed(() => formatUpdatedAt(fechaActualizacion.value))

defineOgImage('ComparaTasas.takumi', {
  title: `Cauciones ${moneda.value.toUpperCase()}`,
  items: [...items.value]
    .sort((a, b) => b.tasaActual - a.tasaActual)
    .slice(0, 3)
    .map((row) => ({
      name: `${row.plazo} días`,
      rate: formatPercentAuto(row.tasaActual),
    })),
  updatedAt: formattedUpdatedAt.value,
})

const sorting = ref([
  {
    id: 'plazo',
    desc: false,
  },
])

const currencyCode = computed(() => (moneda.value === 'usd' ? 'USD' : 'ARS'))

function formatMonto(value: number): string {
  return formatCurrency(value, currencyCode.value)
}

function formatMontoCompact(value: number): string {
  const compact = formatCompactNumber(value)
  return moneda.value === 'usd' ? `${compact} USD` : compact
}

function formatTasaRango(min: number, max: number): string {
  if (min === max) return formatPercentAuto(min)
  return `${formatPercentAuto(min)} – ${formatPercentAuto(max)}`
}

function createSortableHeader(label: string) {
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

const columns: TableColumn<CaucionRow>[] = [
  {
    accessorKey: 'plazo',
    header: createSortableHeader('Plazo'),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'font-bold text-neutral-900 dark:text-white tabular-nums' },
        `${row.getValue('plazo')} días`,
      ),
  },
  {
    accessorKey: 'tasaActual',
    header: createSortableHeader('Tasa actual'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'font-bold tabular-nums text-green-800 dark:text-green-200' },
        formatPercentAuto(row.getValue('tasaActual') as number),
      ),
  },
  {
    accessorKey: 'tasaMinDia',
    header: createSortableHeader('Tasa min. día'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'tabular-nums text-neutral-700 dark:text-neutral-300' },
        formatPercentAuto(row.getValue('tasaMinDia') as number),
      ),
  },
  {
    accessorKey: 'tasaMaxDia',
    header: createSortableHeader('Tasa max. día'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'tabular-nums text-neutral-700 dark:text-neutral-300' },
        formatPercentAuto(row.getValue('tasaMaxDia') as number),
      ),
  },
  {
    accessorKey: 'montoContado',
    header: createSortableHeader('Monto contado'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'tabular-nums text-primary-800 dark:text-primary-200 font-medium' },
        formatMonto(row.getValue('montoContado') as number),
      ),
  },
  {
    accessorKey: 'fechaOperacionDate',
    header: createSortableHeader('Operación'),
    cell: ({ row }) => h('div', {}, formatDate(row.getValue('fechaOperacionDate') as string)),
  },
  {
    accessorKey: 'fechaVencimientoDate',
    header: createSortableHeader('Vencimiento'),
    cell: ({ row }) => h('div', {}, formatDate(row.getValue('fechaVencimientoDate') as string)),
  },
]
</script>

<template>
  <UContainer class="w-full mx-auto space-y-6 max-w-6xl px-0">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
      <div class="min-w-0 space-y-0.5">
        <h2 class="text-lg font-medium scroll-mt-16 text-neutral-900 dark:text-white">Cauciones</h2>
        <p v-if="fechaOperacion || fechaActualizacion" class="text-xs text-muted">
          <template v-if="fechaOperacion">Operación del {{ formatDate(fechaOperacion) }}</template>
          <template v-if="fechaOperacion && fechaActualizacion"> · </template>
          <template v-if="fechaActualizacion">Act. {{ formattedUpdatedAt }}</template>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <UFieldGroup size="sm" class="shrink-0">
          <UButton
            label="ARS"
            color="neutral"
            :variant="moneda === 'ars' ? 'solid' : 'outline'"
            @click="moneda = 'ars'"
          />
          <UButton
            label="USD"
            color="neutral"
            :variant="moneda === 'usd' ? 'solid' : 'outline'"
            @click="moneda = 'usd'"
          />
        </UFieldGroup>
        <div class="text-xs text-muted">
          Fuente:
          <a
            href="https://www.invertironline.com/?ref=comparatasas"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-800 dark:text-primary-200 font-medium"
          >
            IOL
          </a>
          vía
          <a
            href="https://argentinadatos.com/?ref=comparatasas"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-800 dark:text-primary-200 font-medium"
          >
            ArgentinaDatos
          </a>
        </div>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Error cargando cauciones" />

    <FundsLoading v-if="loading && !items.length" />

    <div v-else-if="items.length" class="space-y-6">
      <!-- Mobile: lista -->
      <div class="sm:hidden flex flex-col gap-3">
        <div
          v-for="item in items"
          :key="`${item.plazo}-${item.fechaVencimientoDate}-${item.montoContado}`"
          class="rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 space-y-1">
              <span class="font-bold text-neutral-900 dark:text-white">
                {{ item.plazo }} días
              </span>
              <p class="text-xs text-muted">
                Op. {{ formatDate(item.fechaOperacionDate) }} · Vence
                {{ formatDate(item.fechaVencimientoDate) }}
              </p>
              <p class="text-xs text-muted tabular-nums">
                Monto {{ formatMontoCompact(item.montoContado) }}
              </p>
              <p class="text-xs text-muted tabular-nums">
                Rango {{ formatTasaRango(item.tasaMinDia, item.tasaMaxDia) }}
              </p>
            </div>

            <div class="text-right space-y-0.5 shrink-0">
              <div class="font-bold tabular-nums text-green-800 dark:text-green-200">
                {{ formatPercentAuto(item.tasaActual) }}
              </div>
              <div class="text-xs text-muted">Tasa actual</div>
            </div>
          </div>
        </div>
      </div>

      <!-- sm+: tabla -->
      <div class="hidden sm:block border border-default rounded-lg overflow-hidden">
        <UTable v-model:sorting="sorting" :data="items" :columns="columns" :loading="loading">
          <template #empty>
            <div class="py-12 text-center text-muted">No hay cauciones disponibles.</div>
          </template>
        </UTable>
      </div>

      <div class="border border-default rounded-lg p-4 bg-white dark:bg-neutral-900">
        <h3 class="mb-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Curva de tasas (tasa actual vs plazo)
        </h3>
        <CaucionYieldCurveChart :items="items" :moneda="moneda" />
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-12 text-muted">
      No hay datos de cauciones {{ moneda.toUpperCase() }} en este momento.
    </div>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto text-sm leading-relaxed">
        <div class="space-y-4">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            ¿Qué son las cauciones?
          </h3>
          <p>
            Las <strong>cauciones</strong> son operaciones de corto plazo en el mercado de capitales
            argentino: un tomador recibe dinero hoy y se compromete a devolverlo en una fecha
            futura, dejando títulos en garantía. Quien coloca (colocador) obtiene una tasa por el
            plazo acordado.
          </p>
          <p>
            En esta página se muestran <strong>plazo</strong>, <strong>tasa actual</strong>,
            <strong>tasa mínima y máxima del día</strong>, <strong>monto contado</strong>,
            <strong>fecha de operación</strong> y <strong>vencimiento</strong>, según datos
            agregados por ArgentinaDatos, en pesos (ARS) y dólares (USD). Filtramos filas cuyo
            plazo no es coherente con la fecha de vencimiento. Son valores
            <strong>orientativos</strong> de mercado; no constituyen asesoramiento financiero.
          </p>
        </div>
        <div class="space-y-4">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">Tasas del día</h3>
          <p>
            La <strong>tasa actual</strong> es la tasa informada para ese plazo. La
            <strong>tasa min. día</strong> y la <strong>tasa max. día</strong> corresponden al
            rango observado en la rueda de la fecha de operación. En la curva, el tamaño de cada
            punto refleja el monto contado relativo de ese plazo.
          </p>
        </div>
      </div>
    </section>
  </UContainer>
</template>

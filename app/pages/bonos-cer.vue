<script setup lang="ts">
import { UButton } from '#components'
import CerYieldCurveChart from '~/components/charts/CerYieldCurveChart.vue'
import {
  type BonosCerPayload,
  type CerBondRow,
  diasAlVencimientoCer,
  durationYearsCerAprox,
} from '~/composables/useBonosCer'
import { ogUpdatedAtDate } from '~/utils/og-data'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  pageTitle: 'Bonos CER',
  pageDescription: 'Bonos soberanos en pesos ajustados por CER: cotización y TIR según mercado.',
})

useSeoMeta({
  title: 'Bonos CER',
  description:
    'Compará cotización y TIR (%) de bonos soberanos en pesos ajustados por CER en Argentina.',
  ogTitle: 'Bonos CER — TIR y curva',
  ogDescription: 'Bonos soberanos en pesos ajustados por CER: cotización, TIR y curva por plazo.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/bonos-cer' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/bonos-cer' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/bonos-cer' },
  ],
})

function textoActualizacionOg(iso?: string) {
  if (!iso) return ogUpdatedAtDate()
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ogUpdatedAtDate()
  return `${d.toLocaleString('es-AR', { timeZone: 'UTC', dateStyle: 'long', timeStyle: 'short' })} UTC`
}

const { data: ogBonosCer } = await useAsyncData('og-bonos-cer', () =>
  $fetch<BonosCerPayload>('https://api.argentinadatos.com/v1/finanzas/bonos-cer'),
)

defineOgImage('BonosCerCurve.takumi', {
  title: 'Bonos CER — soberanos',
  bonds: ogBonosCer.value?.bonos ?? [],
  updatedAt: textoActualizacionOg(ogBonosCer.value?.fechaActualizacion),
})

const { bonds, loading, error, fetch, data } = useBonosCer()

const sorting = ref([
  {
    id: 'daysToMaturity',
    desc: false,
  },
])

onMounted(() => {
  fetch()
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPctRaw(value: number): string {
  return `${value.toFixed(2)}%`
}

function formatFechaActualizacionUtc(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.toLocaleString('es-AR', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'medium' })} UTC`
}

function formatDateShort(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year!, month! - 1, day)
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date)
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

const columns: TableColumn<CerBondRow>[] = [
  {
    accessorKey: 'ticker',
    header: createSortableHeader('Ticker', 'ticker'),
    cell: ({ row }) =>
      h('span', { class: 'font-bold text-neutral-900 dark:text-white' }, row.getValue('ticker')),
  },
  {
    accessorKey: 'precioArs',
    header: createSortableHeader('Precio', 'precioArs'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-primary-800 dark:text-primary-200 font-bold' },
        formatCurrency(row.getValue('precioArs') as number),
      ),
  },
  {
    accessorKey: 'tirPorcentaje',
    header: createSortableHeader('TIR (%)', 'tirPorcentaje'),
    cell: ({ row }) => {
      const v = row.getValue('tirPorcentaje') as number
      const cls = v >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
      return h('div', { class: `font-bold ${cls}` }, formatPctRaw(v))
    },
  },
  {
    id: 'durationYears',
    accessorFn: (row) => durationYearsCerAprox(row.fechaVencimiento),
    header: createSortableHeader('Duration', 'durationYears'),
    cell: ({ row }) =>
      h('div', {}, durationYearsCerAprox(row.original.fechaVencimiento).toFixed(2)),
  },
  {
    id: 'daysToMaturity',
    accessorFn: (row) => diasAlVencimientoCer(row.fechaVencimiento),
    header: createSortableHeader('Días', 'daysToMaturity'),
    cell: ({ row }) => h('div', {}, String(diasAlVencimientoCer(row.original.fechaVencimiento))),
  },
  {
    accessorKey: 'fechaVencimiento',
    header: createSortableHeader('Vencimiento', 'fechaVencimiento'),
    cell: ({ row }) => {
      const m = row.getValue('fechaVencimiento') as string | null
      return h('div', {}, m ? formatDateShort(m) : '—')
    },
  },
]

const payload = computed(() => data.value)

const extraccionError = computed(() => data.value?.errorExtraccion)

const textoActualizacion = computed(() => {
  const iso = data.value?.fechaActualizacion
  if (!iso) return null
  return formatFechaActualizacionUtc(iso)
})
</script>

<template>
  <UContainer class="w-full mx-auto space-y-6 max-w-6xl px-0">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-lg font-medium scroll-mt-16 text-neutral-900 dark:text-white">Bonos CER</h2>
      <div class="text-xs text-muted">
        Fuente:
        <a
          href="https://www.doctacapital.com.ar/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-800 dark:text-primary-200 font-medium"
        >
          DoctaCapital
        </a>
        vía
        <a
          href="https://argentinadatos.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-800 dark:text-primary-200 font-medium"
        >
          ArgentinaDatos
        </a>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Error cargando bonos CER" />

    <UAlert
      v-if="extraccionError && !bonds.length"
      color="warning"
      variant="soft"
      title="Sin datos de bonos CER"
      :description="extraccionError"
    />

    <FundsLoading v-if="loading && !bonds.length" />

    <div v-else-if="bonds.length" class="space-y-6">
      <div class="border border-default rounded-lg overflow-hidden">
        <UTable v-model:sorting="sorting" :data="bonds" :columns="columns" :loading="loading">
          <template #empty>
            <div class="py-12 text-center text-muted">No hay bonos CER disponibles.</div>
          </template>
        </UTable>
      </div>

      <div class="border border-default rounded-lg p-4 bg-white dark:bg-neutral-900">
        <h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
          Curva TIR vs plazo (días al vencimiento)
        </h3>
        <CerYieldCurveChart :bonds="bonds" />
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-12 text-muted">
      No hay datos de bonos CER en este momento.
    </div>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto text-sm leading-relaxed">
        <div class="space-y-4">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            ¿Qué son los bonos CER?
          </h3>
          <p>
            Los <strong>bonos soberanos CER</strong> son títulos de deuda emitidos por el Estado
            argentino, denominados en pesos, cuyos pagos de capital e intereses se actualizan
            mediante el <strong>coeficiente CER</strong> publicado por el Banco Central (BCRA). En la
            práctica, el saldo nominal del bono se ajusta para reflejar la evolución del costo de
            vida y preservar el poder adquisitivo frente a la inflación.
          </p>
          <p>
            En esta página se muestran <strong>precio de cotización</strong> y
            <strong>TIR</strong> (tasa interna de retorno en porcentaje) según datos de mercado
            agregados por ArgentinaDatos. Son valores <strong>orientativos</strong>: la TIR depende
            del precio observado, del calendario de cupones y de supuestos de mercado; no
            constituyen asesoramiento financiero.
          </p>
        </div>
        <div class="space-y-4">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">¿Qué es el CER?</h3>
          <p>
            El <strong>CER</strong> (Coeficiente de Estabilización de Referencia) es un índice
            elaborado por el BCRA que se utiliza para indexar créditos, depósitos y títulos públicos
            en pesos. Su evolución está ligada a la dinámica de precios de la economía; los bonos
            CER capitalizan o pagan cupones en función de ese coeficiente según las condiciones de
            cada emisión.
          </p>
          <p>
            Para la definición oficial y la serie histórica conviene consultar la documentación del
            <a
              class="text-primary-600 dark:text-primary-400 underline underline-offset-2"
              href="https://www.bcra.gob.ar/"
              target="_blank"
              rel="noopener noreferrer"
              >BCRA</a
            >.
          </p>
        </div>
      </div>
    </section>
  </UContainer>
</template>

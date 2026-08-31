<script setup lang="ts">
import { UButton } from '#components'
import CerYieldCurveChart, { type CerYieldMode } from '~/components/charts/CerYieldCurveChart.vue'
import {
  type BonosCerPayload,
  type CerBondRow,
  diasAlVencimientoCer,
  durationYearsCerAprox,
} from '~/composables/useBonosCer'
import { ogUpdatedAtDate } from '~/utils/og-data'
import type { TableColumn } from '@nuxt/ui'
import { useRouteQuery } from '@vueuse/router'

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

const { bonds, loading, error, data } = useBonosCer()

const curvaQuery = useRouteQuery<CerYieldMode>('curva', 'tir')
const curvaMode = computed<CerYieldMode>({
  get: () => (curvaQuery.value === 'tem' ? 'tem' : 'tir'),
  set: (value) => {
    curvaQuery.value = value
  },
})

const sorting = ref([
  {
    id: 'daysToMaturity',
    desc: false,
  },
])

/** Lista mobile: orden por días al vencimiento (asc). */
const bondsForList = computed(() =>
  [...bonds.value].sort(
    (a, b) => diasAlVencimientoCer(a.fechaVencimiento) - diasAlVencimientoCer(b.fechaVencimiento),
  ),
)

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
    accessorKey: 'temPorcentaje',
    header: createSortableHeader('TEM (%)', 'temPorcentaje'),
    cell: ({ row }) => {
      const v = (row.getValue('temPorcentaje') as number) ?? 0
      return h('div', { class: 'font-bold text-sky-600 dark:text-sky-400' }, formatPctRaw(v))
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

const extraccionError = computed(() => data.value?.errorExtraccion)

const textoActualizacion = computed(() => {
  const iso = data.value?.fechaActualizacion
  if (!iso) return null
  return formatFechaActualizacionUtc(iso)
})
</script>

<template>
  <UContainer class="w-full mx-auto space-y-6 max-w-6xl px-0">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
      <div class="min-w-0 space-y-0.5">
        <h2 class="text-lg font-medium scroll-mt-16 text-neutral-900 dark:text-white">Bonos CER</h2>
        <p v-if="textoActualizacion" class="text-xs text-muted">Act. {{ textoActualizacion }}</p>
      </div>
      <div class="text-xs text-muted">
        Fuente:
        <a
          href="https://app.doctacapital.com.ar/?utm_source=comparatasas&utm_medium=bonos-cer"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-800 dark:text-primary-200 font-medium"
        >
          Docta Terminal
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
      <!-- Mobile: lista -->
      <div class="sm:hidden flex flex-col gap-3">
        <div
          v-for="item in bondsForList"
          :key="item.ticker"
          class="rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 space-y-1">
              <span class="font-bold text-neutral-900 dark:text-white">{{ item.ticker }}</span>
              <p class="text-xs text-muted">
                {{ formatDateShort(item.fechaVencimiento) }} ·
                {{ diasAlVencimientoCer(item.fechaVencimiento) }} días · duration
                {{ durationYearsCerAprox(item.fechaVencimiento).toFixed(2) }}
              </p>
              <p class="text-xs text-muted tabular-nums">
                Precio {{ formatCurrency(item.precioArs) }}
              </p>
            </div>

            <div class="text-right space-y-0.5 shrink-0">
              <div
                class="font-bold tabular-nums"
                :class="
                  item.tirPorcentaje >= 0
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                "
              >
                {{ formatPctRaw(item.tirPorcentaje) }}
              </div>
              <div class="text-xs text-muted">TIR</div>
              <div class="text-xs tabular-nums text-sky-600 dark:text-sky-400">
                TEM {{ formatPctRaw(item.temPorcentaje ?? 0) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- sm+: tabla -->
      <div class="hidden sm:block border border-default rounded-lg overflow-hidden">
        <UTable v-model:sorting="sorting" :data="bonds" :columns="columns" :loading="loading">
          <template #empty>
            <div class="py-12 text-center text-muted">No hay bonos CER disponibles.</div>
          </template>
        </UTable>
      </div>

      <div class="border border-default rounded-lg p-4 bg-white dark:bg-neutral-900">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Curva de Rendimientos ({{ curvaMode === 'tem' ? 'TEM' : 'TIR' }} vs Días)
          </h3>
          <UFieldGroup size="sm" class="shrink-0">
            <UButton
              label="TIR"
              color="neutral"
              :variant="curvaMode === 'tir' ? 'solid' : 'outline'"
              @click="curvaMode = 'tir'"
            />
            <UButton
              label="TEM"
              color="neutral"
              :variant="curvaMode === 'tem' ? 'solid' : 'outline'"
              @click="curvaMode = 'tem'"
            />
          </UFieldGroup>
        </div>
        <CerYieldCurveChart :bonds="bonds" :mode="curvaMode" />
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
            mediante el <strong>coeficiente CER</strong> publicado por el Banco Central (BCRA). En
            la práctica, el saldo nominal del bono se ajusta para reflejar la evolución del costo de
            vida y preservar el poder adquisitivo frente a la inflación.
          </p>
          <p>
            En esta página se muestran <strong>precio de cotización</strong>, <strong>TIR</strong> y
            <strong>TEM</strong> (tasa efectiva mensual implícita) según datos de mercado agregados
            por ArgentinaDatos. Son valores <strong>orientativos</strong>: la TIR depende del precio
            observado, del calendario de cupones y de supuestos de mercado; no constituyen
            asesoramiento financiero.
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
              href="https://www.bcra.gob.ar/?utm_source=comparatasas&utm_medium=bonos-cer&ref=comparatasas"
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

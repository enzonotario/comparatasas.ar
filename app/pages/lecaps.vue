<script setup lang="ts">
import LecapYieldCurveChart, {
  type LecapYieldMode,
} from '~/components/charts/LecapYieldCurveChart.vue'
import LecapsComparadorTabla from '~/components/LecapsComparadorTabla.vue'
import CaucionesBrokerSelect from '~/components/CaucionesBrokerSelect.vue'
import {
  type BrokerOption,
  useCaucionesBrokerSelection,
} from '~/composables/useCaucionesBrokerSelection'
import { resolvePlazoFijoRateAtDays, usePlazosFijos } from '~/composables/usePlazosFijos'
import type { LetrasPayload } from '~/composables/useLecaps'
import { getComisionesBrokersProductoPath } from '~/lib/comisiones-brokers-nav'
import { ogUpdatedAtDate } from '~/utils/og-data'
import { useRouteQuery } from '@vueuse/router'

definePageMeta({
  pageTitle: 'LECAPs y BONCAPs',
  pageDescription:
    'Compará precio, comisión de broker, ganancia al vencimiento y TNA de LECAPs y BONCAPs en Argentina.',
})

useSeoMeta({
  title: 'LECAPs y BONCAPs',
  description:
    'Compará precio, ganancia directa, TNA y TEM de LECAPs y BONCAPs soberanos a tasa fija. Incluye comisión de compra de letras por broker y vs plazo fijo.',
  ogTitle: 'LECAPs y BONCAPs — comparador',
  ogDescription:
    'Cotización, ganancia al vencimiento, TNA/TEM, comisión de letras por broker y comparación vs plazo fijo.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/lecaps' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/lecaps' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/lecaps' },
  ],
})

function textoActualizacionOg(iso?: string) {
  if (!iso) return ogUpdatedAtDate()
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ogUpdatedAtDate()
  return `${d.toLocaleString('es-AR', { timeZone: 'UTC', dateStyle: 'long', timeStyle: 'short' })} UTC`
}

const { data: ogLetras } = await useAsyncData('og-lecaps', () =>
  $fetch<LetrasPayload>('https://api.argentinadatos.com/v1/finanzas/letras'),
)

const { lecapsItems, loading, error, data } = useLecaps()

const OPERACION_LECAP = 'compra' as const
const { comisiones: comisionesBrokers, fetch: fetchComisionesBrokers } =
  useComisionesCaucionesBrokers()
await fetchComisionesBrokers().catch(() => undefined)

const { brokerOptions, selectedEntidad, selectedComision } = useCaucionesBrokerSelection(
  'ars',
  OPERACION_LECAP,
  comisionesBrokers,
  'letras',
)

const { plazosFijosTableRows } = usePlazosFijos()

const searchQuery = useRouteQuery('q', '')
const montoQuery = useRouteQuery('monto', '')
const pfQuery = useRouteQuery('pf', '')
const curvaQuery = useRouteQuery<LecapYieldMode>('curva', 'tir')

const DEFAULT_MONTO = 1_000_000
const montoPresets = [
  { value: 500_000, label: '$500k' },
  { value: 1_000_000, label: '$1M' },
  { value: 10_000_000, label: '$10M' },
] as const

function parseQueryNumber(raw: unknown, fallback: number): number {
  const n = parseFloat(String(raw ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : fallback
}

function formatQueryNumber(n: number): string {
  return String(Math.round(n * 1e6) / 1e6)
}

const montoInvertir = computed({
  get: () => {
    const raw = String(montoQuery.value ?? '').trim()
    if (!raw) return DEFAULT_MONTO
    const n = parseQueryNumber(raw, DEFAULT_MONTO)
    return n > 0 ? n : DEFAULT_MONTO
  },
  set: (v: number) => {
    const n = Number.isFinite(v) && v > 0 ? v : DEFAULT_MONTO
    montoQuery.value = formatQueryNumber(n)
  },
})

function setMontoPreset(value: number) {
  montoInvertir.value = value
}

/** Opciones de PF ordenadas como en /plazos-fijos (mejor TNA 30d primero). */
const plazoFijoOptions = computed<BrokerOption[]>(() => {
  const amount = montoInvertir.value
  return plazosFijosTableRows.value
    .map((row) => {
      const match = resolvePlazoFijoRateAtDays(row, 30, amount)
      const tna = match?.tna ?? (row.sortTna30d > 0 ? row.sortTna30d : row.sortTna)
      if (!(tna > 0)) return null
      return {
        value: row.rowKey,
        label: row.institution,
        description: `${tna.toFixed(2)}% TNA`,
      }
    })
    .filter((option): option is BrokerOption => option != null)
})

const selectedPlazoFijo = computed({
  get: () => {
    const current = pfQuery.value
    if (current && plazoFijoOptions.value.some((option) => option.value === current)) {
      return current
    }
    return plazoFijoOptions.value[0]?.value ?? ''
  },
  set: (value: string) => {
    pfQuery.value = value
  },
})

const tnaPlazoFijoPorcentaje = computed(() => {
  const row = plazosFijosTableRows.value.find((r) => r.rowKey === selectedPlazoFijo.value)
  if (!row) return 0
  const match = resolvePlazoFijoRateAtDays(row, 30, montoInvertir.value)
  if (match) return match.tna
  return row.sortTna30d > 0 ? row.sortTna30d : row.sortTna
})

function pickBestPlazoFijo() {
  const best = plazoFijoOptions.value[0]
  if (best) pfQuery.value = best.value
}

onMounted(() => {
  if (!pfQuery.value) pickBestPlazoFijo()
  if (!String(montoQuery.value ?? '').trim()) {
    montoQuery.value = formatQueryNumber(DEFAULT_MONTO)
  }
})

watch(plazoFijoOptions, (options) => {
  if (!options.length) {
    pfQuery.value = ''
    return
  }
  if (!options.some((option) => option.value === pfQuery.value)) {
    pickBestPlazoFijo()
  }
})

const curvaMode = computed<LecapYieldMode>({
  get: () => (curvaQuery.value === 'tem' ? 'tem' : 'tir'),
  set: (value) => {
    curvaQuery.value = value
  },
})

const filteredItems = computed(() => {
  const q = String(searchQuery.value || '')
    .trim()
    .toUpperCase()
  const base = [...lecapsItems.value].sort((a, b) => a.days - b.days)
  if (!q) return base
  return base.filter((i) => i.symbol.includes(q) || i.type.includes(q) || i.typeLabel.includes(q))
})

const ogLecapsItems = computed(() =>
  (ogLetras.value?.letras ?? []).map((letra) => {
    const type = letra.ticker.startsWith('T') ? ('BONCAP' as const) : ('LECAP' as const)
    return {
      symbol: letra.ticker,
      price: letra.precioArs,
      type,
      days: letra.diasAlVencimiento,
      maturity: letra.fechaVencimiento,
      tna: letra.tnaPorcentaje / 100,
      tir: letra.teaPorcentaje / 100,
      tem: letra.temPorcentaje / 100,
    }
  }),
)

defineOgImage('LecapsCurve.takumi', {
  title: 'LECAPs y BONCAPs',
  lecaps: ogLecapsItems.value,
  updatedAt: textoActualizacionOg(ogLetras.value?.fechaActualizacion),
})

const extraccionError = computed(() => data.value?.errorExtraccion)

const textoActualizacion = computed(() => {
  const iso = data.value?.fechaActualizacion
  if (!iso) return null
  return formatFechaActualizacionUtc(iso)
})

function formatFechaActualizacionUtc(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.toLocaleString('es-AR', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'medium' })} UTC`
}
</script>

<template>
  <UContainer class="w-full mx-auto space-y-4 px-0">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
      <div class="min-w-0 space-y-0.5">
        <h2 class="text-lg font-medium scroll-mt-16 text-neutral-900 dark:text-white">
          LECAPs y BONCAPs
        </h2>
        <p v-if="textoActualizacion" class="text-xs text-muted">Act. {{ textoActualizacion }}</p>
      </div>
      <div class="text-xs text-muted">
        Fuente:
        <a
          href="https://app.doctacapital.com.ar/?utm_source=comparatasas&utm_medium=lecaps"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-800 dark:text-primary-200 font-medium"
        >
          Docta Terminal
        </a>
      </div>
    </div>

    <p class="text-xs text-muted -mt-1 leading-snug max-w-5xl">
      Precio c/ comisión según broker de letras (+ IVA si aplica; membresía no incluida). Monto → VN
      y total a recibir; vs PF usa TNA 30d del banco elegido (mejor de
      <NuxtLink
        to="/plazos-fijos"
        class="text-primary-800 dark:text-primary-200 font-medium underline underline-offset-2"
      >
        plazos fijos </NuxtLink
      >
      por defecto).
    </p>

    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:items-start">
      <UFormField label="Buscar">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Buscar por ticker..."
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Monto a invertir">
        <div class="space-y-1.5">
          <UInputNumber
            v-model="montoInvertir"
            :min="1"
            :step="1"
            size="sm"
            :format-options="{
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }"
            class="w-full"
          />
          <div class="flex flex-wrap gap-1">
            <UButton
              v-for="preset in montoPresets"
              :key="preset.value"
              size="xs"
              color="neutral"
              :variant="montoInvertir === preset.value ? 'solid' : 'outline'"
              :label="preset.label"
              @click="setMontoPreset(preset.value)"
            />
          </div>
        </div>
      </UFormField>

      <UFormField v-if="brokerOptions.length" label="Comisión broker">
        <CaucionesBrokerSelect
          v-model="selectedEntidad"
          :items="brokerOptions"
          size="sm"
          class="w-full"
        />
      </UFormField>

      <UFormField v-if="plazoFijoOptions.length" label="Comparar con Plazo fijo">
        <CaucionesBrokerSelect
          v-model="selectedPlazoFijo"
          :items="plazoFijoOptions"
          size="sm"
          class="w-full"
        />
      </UFormField>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Error cargando datos de LECAPs" />

    <UAlert
      v-if="extraccionError && !lecapsItems.length"
      color="warning"
      variant="soft"
      title="Sin datos de LECAPs"
      :description="extraccionError"
    />

    <FundsLoading v-if="loading && !lecapsItems.length" />

    <div v-else-if="filteredItems.length" class="space-y-6">
      <LecapsComparadorTabla
        :items="filteredItems"
        :comision="selectedComision"
        :monto-invertir="montoInvertir"
        :tna-plazo-fijo-porcentaje="tnaPlazoFijoPorcentaje"
      />

      <div class="flex justify-end">
        <UButton
          :to="getComisionesBrokersProductoPath('letras')"
          color="neutral"
          variant="outline"
          size="sm"
          label="Ver comisiones de letras"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>

      <div class="border border-default rounded-lg p-4 bg-white dark:bg-neutral-900">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Curva de Rendimientos ({{ curvaMode === 'tem' ? 'TEM' : 'TEA' }} vs Días)
          </h3>
          <UFieldGroup size="sm" class="shrink-0">
            <UButton
              label="TEA"
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
        <LecapYieldCurveChart :lecaps="filteredItems" :mode="curvaMode" />
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-12 text-muted">
      {{
        searchQuery
          ? 'No hay instrumentos que coincidan con la búsqueda.'
          : 'No hay LECAPs o BONCAPs disponibles en este momento.'
      }}
    </div>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto text-sm leading-relaxed">
        <div class="space-y-4">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">¿Qué son las LECAPs?</h3>
          <p>
            Las <strong>LECAPs</strong> (Letras de Capitalización) son instrumentos de deuda a corto
            plazo emitidos por el Tesoro Nacional de Argentina. Capitalizan intereses periódicamente
            y se negocian en el mercado secundario.
          </p>
          <p>
            En esta página se muestran cotización y tasas según
            <strong>Docta Terminal</strong>. Podés elegir un <strong>broker</strong> para aplicar la
            comisión de compra de letras (+ IVA si corresponde), ingresar un
            <strong>monto a invertir</strong> y comparar contra la
            <strong>TNA de un plazo fijo</strong> (por defecto el mejor a 30 días). El selector de
            broker queda en `?broker=` y el de plazo fijo en `?pf=`. Son valores
            <strong>orientativos</strong>; no constituyen asesoramiento financiero.
          </p>
        </div>
        <div class="space-y-4">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">¿Qué son los BONCAPs?</h3>
          <p>
            Los <strong>BONCAPs</strong> son Bonos de Capitalización, similares a las LECAPs pero
            generalmente con plazos de vencimiento más largos.
          </p>
        </div>
      </div>
    </section>
  </UContainer>
</template>

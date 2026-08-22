<script setup lang="ts">
import type { SelectItem } from '@nuxt/ui'
import type {
  PrestamoPersonalSimulado,
  PrestamosClienteFilter,
} from '~/composables/usePrestamosPersonalesSimulator'
import { formatCurrency } from '~/lib/fci-fund-formatters'
import {
  classifyCuotaIngreso,
  compareCftVsRem,
  cuotaIngresoRatioPercent,
  ingresoRequeridoParaCuota,
  projectCuotaIngresoByYear,
  type AumentoSalarialFrecuencia,
  type CftVsRemRisk,
  type CuotaIngresoRisk,
} from '~/lib/finance/prestamo-personal'
import { getInstitutionShortName, getInstitutionUrl } from '~/lib/mappings/institutions'
import { withOutboundUtm } from '~/lib/outbound-url'

const monto = defineModel<number>('monto', { required: true })
const plazo = defineModel<number>('plazo', { required: true })
const ingresos = defineModel<number | null>('ingresos', { required: true })
const aumentoSalarial = defineModel<number>('aumentoSalarial', { required: true })
const frecuenciaAumento = defineModel<AumentoSalarialFrecuencia>('frecuenciaAumento', {
  required: true,
})
const sinAumento = defineModel<boolean>('sinAumento', { required: true })
const clienteFilter = defineModel<PrestamosClienteFilter>('clienteFilter', { required: true })
const condicionesSeleccionadas = defineModel<string[]>('condicionesSeleccionadas', {
  required: true,
})

const props = defineProps<{
  condicionesDisponibles: string[]
  isOpen: boolean
  isSimulating: boolean
  ofertaSeleccionada: PrestamoPersonalSimulado | null
  remInflacionAnualPercent?: number | null
  remInformeLabel?: string | null
  remPublicacionUrl?: string | null
  remLoading?: boolean
}>()

const emit = defineEmits<{
  open: []
  minimize: []
  close: []
  'update:isOpen': [value: boolean]
}>()

const plazoPresets = [12, 24, 36, 48, 60] as const
const montoPresets = [
  { value: 500_000, label: '$500mil' },
  { value: 1_000_000, label: '$1M' },
  { value: 2_000_000, label: '$2M' },
  { value: 3_000_000, label: '$3M' },
  { value: 5_000_000, label: '$5M' },
  { value: 10_000_000, label: '$10M' },
] as const
const ingresosPresets = [
  { value: 500_000, label: '$500mil' },
  { value: 1_000_000, label: '$1M' },
  { value: 1_500_000, label: '$1,5M' },
  { value: 2_000_000, label: '$2M' },
  { value: 3_000_000, label: '$3M' },
] as const

const clienteItems: SelectItem[] = [
  { label: 'Todas las ofertas', value: 'todas' },
  { label: 'Sin ser cliente', value: 'sin_cliente' },
  { label: 'Solo para clientes', value: 'cliente' },
]

const frecuenciaItems: SelectItem[] = [
  { label: 'Anual', value: 'anual' },
  { label: 'Semestral', value: 'semestral' },
  { label: 'Trimestral', value: 'trimestral' },
]

const ingresosModel = computed({
  get: () => ingresos.value ?? undefined,
  set: (value: number | undefined) => {
    ingresos.value = value != null && Number.isFinite(value) && value > 0 ? value : null
  },
})

const resumenActivo = computed(() => {
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto.value)
  return `${formatted} · ${plazo.value} meses`
})

const sim = computed(() => props.ofertaSeleccionada?.simulation ?? null)

const cuotaResumen = computed(() => sim.value?.cuotaCft ?? sim.value?.cuota ?? null)

const ingresoRequerido = computed(() =>
  cuotaResumen.value != null ? ingresoRequeridoParaCuota(cuotaResumen.value) : null,
)

const ratioHoy = computed(() => {
  if (cuotaResumen.value == null || ingresos.value == null) return null
  return cuotaIngresoRatioPercent(cuotaResumen.value, ingresos.value)
})

const riskHoy = computed<CuotaIngresoRisk | null>(() =>
  ratioHoy.value != null ? classifyCuotaIngreso(ratioHoy.value) : null,
)

const cftVsRem = computed(() => {
  const cft = sim.value?.cftTeaUsada
  const rem = props.remInflacionAnualPercent
  if (cft == null || rem == null) return null
  return compareCftVsRem(cft, rem)
})

const cftVsRemMeta: Record<
  CftVsRemRisk,
  { label: string; color: 'success' | 'warning' | 'error' | 'neutral'; title: string }
> = {
  bajo: {
    label: 'Costo razonable vs inflación',
    color: 'success',
    title: 'EL CFT ESTÁ CERCA DE LA INFLACIÓN ESPERADA',
  },
  moderado: {
    label: 'Costo elevado',
    color: 'warning',
    title: 'EL CFT SUPERA LA INFLACIÓN ESPERADA',
  },
  alto: {
    label: 'Costo muy alto',
    color: 'warning',
    title: 'ATENCIÓN: EL COSTO ES MUY ALTO',
  },
  extremo: {
    label: 'Riesgo extremo',
    color: 'error',
    title: 'SOS RIESGO EXTREMO',
  },
}

const projectionRows = computed(() => {
  if (cuotaResumen.value == null || ingresos.value == null) return []
  return projectCuotaIngresoByYear({
    months: plazo.value,
    cuota: cuotaResumen.value,
    income: ingresos.value,
    aumentoAnualPercent: aumentoSalarial.value,
    frecuencia: frecuenciaAumento.value,
    sinAumento: sinAumento.value,
    remInflacionAnualPercent: props.remInflacionAnualPercent,
  })
})

const ofertaLabel = computed(() => {
  if (!props.ofertaSeleccionada) return null
  const institution =
    getInstitutionShortName(props.ofertaSeleccionada.entidad) ||
    props.ofertaSeleccionada.nombreComercial
  return `${institution} · ${props.ofertaSeleccionada.producto}`
})

const ofertaUrl = computed(() => {
  const oferta = props.ofertaSeleccionada
  if (!oferta) return null
  const mapped =
    getInstitutionUrl(oferta.entidad, 'prestamos-personales') ||
    getInstitutionUrl(oferta.nombreComercial, 'prestamos-personales')
  const url = withOutboundUtm(oferta.enlace || mapped || '#', 'prestamos-personales')
  return url && url !== '#' ? url : null
})

const riskMeta: Record<
  CuotaIngresoRisk,
  { label: string; color: 'success' | 'warning' | 'error' | 'neutral'; description: string }
> = {
  optimo: {
    label: 'Óptimo',
    color: 'success',
    description: 'La cuota representa menos del 20% del ingreso neto.',
  },
  aceptable: {
    label: 'Aceptable con precaución',
    color: 'warning',
    description: 'Entre 20% y 30%: dentro del tope orientativo del BCRA, pero elevada.',
  },
  alerta: {
    label: 'Alerta',
    color: 'warning',
    description: 'Entre 30% y 40%: supera el tope orientativo del 30% del ingreso.',
  },
  riesgo: {
    label: 'Riesgo alto',
    color: 'error',
    description: 'Más del 40% del ingreso: alto riesgo de sobreendeudamiento.',
  },
}

function formatPct(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${value.toFixed(digits)}%`
}

function riskBadgeColor(risk: CuotaIngresoRisk) {
  return riskMeta[risk].color
}

onMounted(() => {
  if (props.isSimulating && !props.isOpen) {
    emit('update:isOpen', true)
  }
})
</script>

<template>
  <!-- Cerrado / minimizado: CTA compacta -->
  <div
    v-if="!isSimulating || !isOpen"
    class="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
  >
    <div
      v-if="!isSimulating"
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="space-y-1 min-w-0">
        <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
          Simulador de préstamo
        </h3>
        <p class="text-xs text-muted">
          Sistema francés: estimá cuota, total y relación cuota/ingreso según monto y plazo.
        </p>
      </div>
      <UButton
        color="primary"
        label="Abrir simulación"
        icon="i-lucide-calculator"
        class="shrink-0"
        @click="emit('open')"
      />
    </div>

    <div v-else class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1 min-w-0">
        <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Simulación activa</h3>
        <p class="text-xs text-muted">{{ resumenActivo }}</p>
      </div>
      <div class="flex flex-wrap gap-2 shrink-0">
        <UButton
          color="primary"
          variant="soft"
          label="Ver simulador"
          icon="i-lucide-calculator"
          @click="emit('update:isOpen', true)"
        />
        <UButton
          color="error"
          variant="soft"
          label="Cerrar simulación"
          icon="i-lucide-x"
          @click="emit('close')"
        />
      </div>
    </div>
  </div>

  <!-- Abierto: inputs + lista a la izquierda, resumen sticky a la derecha -->
  <div v-else class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] items-start">
    <div class="min-w-0 space-y-4">
      <UCard class="overflow-visible">
        <template #header>
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-sliders-horizontal"
                  class="size-5 text-primary-600 dark:text-primary-400"
                />
                <h3 class="text-lg font-semibold">Configurá la simulación</h3>
              </div>
              <p class="text-sm text-neutral-500">
                Ingresá monto, plazo e ingresos. Hacé clic en una oferta de la lista para usarla en
                el resumen.
              </p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <UButton
                icon="i-lucide-minus"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Minimizar simulador"
                @click="emit('minimize')"
              />
              <UButton
                icon="i-lucide-x"
                color="error"
                variant="ghost"
                size="sm"
                aria-label="Cerrar simulación"
                @click="emit('close')"
              />
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div
            class="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
          >
            <p class="text-sm font-medium text-neutral-900 dark:text-white">Monto del crédito</p>
            <UInputNumber
              v-model="monto"
              :min="10000"
              :max="100000000"
              :step="10000"
              :format-options="{
                useGrouping: true,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }"
              class="w-full"
            />
            <USlider v-model="monto" :min="100000" :max="20000000" :step="100000" />
            <div class="flex flex-wrap gap-1.5">
              <UButton
                v-for="preset in montoPresets"
                :key="preset.value"
                size="xs"
                color="neutral"
                :variant="monto === preset.value ? 'solid' : 'outline'"
                :label="preset.label"
                @click="monto = preset.value"
              />
            </div>
          </div>

          <div
            class="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
          >
            <p class="text-sm font-medium text-neutral-900 dark:text-white">Plazo del crédito</p>
            <UInputNumber v-model="plazo" :min="1" :max="84" :step="1" class="w-full" />
            <p class="text-xs text-muted -mt-1">meses</p>
            <USlider v-model="plazo" :min="3" :max="72" :step="1" />
            <div class="flex flex-wrap gap-1.5">
              <UButton
                v-for="preset in plazoPresets"
                :key="preset"
                size="xs"
                color="neutral"
                :variant="plazo === preset ? 'solid' : 'outline'"
                :label="`${preset}m`"
                @click="plazo = preset"
              />
            </div>
          </div>

          <div
            class="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1 min-w-0">
                <p class="text-sm font-medium text-neutral-900 dark:text-white">
                  Ingresos netos mensuales del hogar
                </p>
                <p class="text-xs text-muted">
                  Opcional · para relación cuota/ingreso y tope BCRA (~30%)
                </p>
              </div>
              <UButton
                v-if="ingresos != null"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="shrink-0"
                aria-label="Limpiar ingresos"
                @click="ingresos = null"
              />
            </div>
            <UInputNumber
              v-model="ingresosModel"
              :min="0"
              :step="10000"
              placeholder="Ej. 800000"
              :format-options="{
                useGrouping: true,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }"
              class="w-full"
            />
            <USlider
              v-if="ingresos != null"
              :model-value="ingresos"
              :min="100000"
              :max="10000000"
              :step="50000"
              @update:model-value="ingresos = $event"
            />
            <div class="flex flex-wrap gap-1.5">
              <UButton
                v-for="preset in ingresosPresets"
                :key="preset.value"
                size="xs"
                color="neutral"
                :variant="ingresos === preset.value ? 'solid' : 'outline'"
                :label="preset.label"
                @click="ingresos = preset.value"
              />
            </div>
          </div>

          <div
            v-if="ingresos != null"
            class="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
          >
            <div class="grid gap-3 sm:grid-cols-2">
              <UFormField label="Aumento salarial esperado anual">
                <UInputNumber
                  v-model="aumentoSalarial"
                  :min="0"
                  :max="200"
                  :step="1"
                  :disabled="sinAumento"
                  class="w-full"
                />
                <p class="text-xs text-muted -mt-1">
                  % anual
                  <template v-if="remInflacionAnualPercent != null">
                    · referencia REM {{ formatPct(remInflacionAnualPercent) }}
                  </template>
                </p>
              </UFormField>
              <UFormField label="Frecuencia del aumento">
                <USelect
                  v-model="frecuenciaAumento"
                  :items="frecuenciaItems"
                  value-key="value"
                  :disabled="sinAumento"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UCheckbox
              v-model="sinAumento"
              label="Simular escenario de estrés: sin aumento salarial"
            />
          </div>

          <div
            class="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
          >
            <p class="text-sm font-medium text-neutral-900 dark:text-white">Filtros de ofertas</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <UFormField label="Requisito de cliente">
                <USelect
                  v-model="clienteFilter"
                  :items="clienteItems"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                v-if="condicionesDisponibles.length"
                label="Condiciones"
                hint="Vacío = todas"
              >
                <USelect
                  v-model="condicionesSeleccionadas"
                  :items="condicionesDisponibles"
                  multiple
                  placeholder="Todas las condiciones"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <div class="flex justify-end">
            <UButton
              color="error"
              variant="soft"
              size="sm"
              label="Cerrar simulación"
              icon="i-lucide-x"
              @click="emit('close')"
            />
          </div>
        </div>
      </UCard>

      <slot name="lista" />
    </div>

    <UCard
      class="overflow-hidden md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-6.5rem)] md:overflow-y-auto"
    >
      <template #header>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-layout-dashboard"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
            <h3 class="text-lg font-semibold">Características de la operación</h3>
          </div>
          <p class="text-sm text-neutral-500">
            Resumen de la oferta elegida. Por defecto, la de menor cuota estimada.
          </p>
        </div>
      </template>

      <div v-if="ofertaSeleccionada && sim && cuotaResumen != null" class="space-y-4">
        <div
          class="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/50"
        >
          <p class="text-xs uppercase tracking-wide text-neutral-500">Oferta elegida</p>
          <p class="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">
            {{ ofertaLabel }}
          </p>
          <p v-if="ofertaSeleccionada.condiciones" class="text-xs text-muted mt-0.5">
            {{ ofertaSeleccionada.condiciones }}
          </p>
        </div>

        <dl class="space-y-3 text-sm">
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-neutral-500">Cuota inicial estimada</dt>
            <dd class="font-semibold tabular-nums text-primary-600 dark:text-primary-400">
              {{ formatCurrency(cuotaResumen) }}
            </dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-neutral-500">Ingreso requerido (~30%)</dt>
            <dd class="font-semibold tabular-nums">{{ formatCurrency(ingresoRequerido) }}</dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-neutral-500">Total de cuotas</dt>
            <dd class="font-semibold tabular-nums">
              {{ plazo }} ({{ (plazo / 12).toFixed(plazo % 12 === 0 ? 0 : 1) }}
              {{ plazo === 12 ? 'año' : 'años' }})
            </dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-neutral-500">Tasa de interés</dt>
            <dd class="font-semibold text-right text-xs sm:text-sm">
              TNA {{ formatPct(sim.tnaUsada) }} · CFT TEA {{ formatPct(sim.cftTeaUsada) }}
            </dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-neutral-500">Total a devolver</dt>
            <dd class="font-semibold tabular-nums">
              {{ formatCurrency(sim.totalCft ?? sim.total) }}
            </dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-neutral-500">Intereses y costos</dt>
            <dd class="font-semibold tabular-nums">
              {{
                formatCurrency(
                  (sim.totalCft ?? sim.total ?? 0) - monto > 0
                    ? (sim.totalCft ?? sim.total ?? 0) - monto
                    : sim.interes,
                )
              }}
            </dd>
          </div>
        </dl>

        <UButton
          v-if="ofertaUrl"
          :href="ofertaUrl"
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="outline"
          block
          icon="i-lucide-external-link"
          label="Ir al préstamo"
          trailing
        />

        <div
          v-if="cftVsRem"
          class="rounded-2xl border p-3 space-y-2"
          :class="{
            'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30':
              cftVsRem.risk === 'bajo',
            'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30':
              cftVsRem.risk === 'moderado' || cftVsRem.risk === 'alto',
            'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30':
              cftVsRem.risk === 'extremo',
          }"
        >
          <p class="text-xs uppercase tracking-wide text-neutral-500">
            CFT vs inflación esperada (REM)
          </p>
          <p class="text-sm font-semibold text-neutral-900 dark:text-white">
            {{ cftVsRemMeta[cftVsRem.risk].title }}
          </p>
          <p class="text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">
            {{ cftVsRem.multiple.toFixed(2).replace('.', ',') }}×
            <span class="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              la inflación esperada
            </span>
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-neutral-600 dark:text-neutral-300">
            <UBadge color="neutral" variant="subtle" size="sm">
              CFT {{ formatPct(cftVsRem.cftPercent) }}
            </UBadge>
            <UBadge color="neutral" variant="subtle" size="sm">
              REM {{ formatPct(cftVsRem.remPercent) }}
            </UBadge>
            <UBadge :color="cftVsRemMeta[cftVsRem.risk].color" variant="soft" size="sm">
              {{ cftVsRemMeta[cftVsRem.risk].label }}
            </UBadge>
          </div>
          <p class="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Si la inflación anual esperada (mediana REM a 12 meses) es
            {{ formatPct(cftVsRem.remPercent) }} y el CFT TEA es
            {{ formatPct(cftVsRem.cftPercent) }}, el crédito cuesta
            {{ cftVsRem.multiple.toFixed(2).replace('.', ',') }} veces esa inflación.
          </p>
          <p v-if="remInformeLabel || remPublicacionUrl" class="text-[11px] text-muted">
            Fuente: REM BCRA
            <template v-if="remInformeLabel"> ({{ remInformeLabel }})</template>
            <template v-if="remPublicacionUrl">
              ·
              <a
                :href="withOutboundUtm(remPublicacionUrl, 'prestamos-personales')"
                target="_blank"
                rel="noopener noreferrer"
                class="underline underline-offset-2"
              >
                informe
              </a>
            </template>
            vía Argentina Datos.
          </p>
        </div>

        <div
          v-else-if="remLoading"
          class="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 text-xs text-muted"
        >
          Cargando inflación esperada REM…
        </div>

        <div
          v-if="riskHoy && ratioHoy != null"
          class="rounded-2xl border p-3"
          :class="{
            'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30':
              riskHoy === 'optimo',
            'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30':
              riskHoy === 'aceptable' || riskHoy === 'alerta',
            'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30':
              riskHoy === 'riesgo',
          }"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs uppercase tracking-wide text-neutral-500">Relación cuota/ingreso</p>
            <UBadge :color="riskBadgeColor(riskHoy)" variant="soft">
              {{ formatPct(ratioHoy) }} · {{ riskMeta[riskHoy].label }}
            </UBadge>
          </div>
          <p class="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            {{ riskMeta[riskHoy].description }}
          </p>
        </div>

        <div v-if="projectionRows.length" class="space-y-2">
          <p class="text-sm font-medium text-neutral-900 dark:text-white">
            Relación cuota / ingreso
          </p>
          <div class="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table class="w-full text-left text-xs">
              <thead class="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500">
                <tr>
                  <th class="px-2 py-2 font-medium">Año</th>
                  <th class="px-2 py-2 font-medium">Ingreso</th>
                  <th class="px-2 py-2 font-medium">Cuota</th>
                  <th class="px-2 py-2 font-medium">Relación</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in projectionRows"
                  :key="row.yearIndex"
                  class="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td class="px-2 py-2 whitespace-nowrap">{{ row.label }}</td>
                  <td class="px-2 py-2 tabular-nums whitespace-nowrap">
                    {{ formatCurrency(row.ingresoMensual) }}
                  </td>
                  <td class="px-2 py-2 tabular-nums whitespace-nowrap">
                    {{ formatCurrency(row.cuotaMensual) }}
                  </td>
                  <td class="px-2 py-2">
                    <UBadge :color="riskBadgeColor(row.risk)" variant="subtle" size="sm">
                      {{ formatPct(row.ratioPercent) }}
                    </UBadge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted leading-relaxed">
            Menos de 20% óptimo · 20–30% aceptable · 30–40% alerta · más de 40% riesgo. El 30% es la
            referencia del BCRA para financiaciones a personas humanas.
          </p>
        </div>
      </div>

      <div v-else class="py-8 text-center text-sm text-muted space-y-2">
        <UIcon name="i-lucide-calculator" class="size-8 mx-auto text-neutral-400" />
        <p>
          {{
            ofertaSeleccionada
              ? 'No hay cuota estimable para el plazo elegido.'
              : 'No hay ofertas que coincidan con los filtros.'
          }}
        </p>
      </div>
    </UCard>
  </div>
</template>

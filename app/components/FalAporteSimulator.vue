<script setup lang="ts">
import {
  formatMontoFal,
  presetsEmpleadosFal,
  presetsSueldoFal,
  simularAporteFal,
  tiposEmpresaFal,
  type TipoEmpresaFalId,
} from '~/lib/finance/fal'

const tipos = Object.values(tiposEmpresaFal)
const presetInicial = presetsEmpleadosFal[1]

const tipoId = ref<TipoEmpresaFalId>(presetInicial.tipo)
const empleados = ref(presetInicial.empleados)
const sueldo = ref(presetInicial.sueldo)
const sueldoEditado = ref(false)
const isOpen = ref(false)
const isSimulating = ref(false)

const tipo = computed(() => tiposEmpresaFal[tipoId.value])
const resultado = computed(() =>
  simularAporteFal({
    empleados: empleados.value,
    sueldoBruto: sueldo.value || 0,
    alicuota: tipo.value.alicuota,
  }),
)
const resumenActivo = computed(
  () =>
    `${empleados.value.toLocaleString('es-AR')} empleados · ${formatMontoFal(resultado.value.aporteMensual)}/mes`,
)

function openSimulator() {
  isOpen.value = true
  isSimulating.value = true
}

function minimizeSimulator() {
  isOpen.value = false
}

function closeSimulator() {
  isOpen.value = false
  isSimulating.value = false
}

function elegirPreset(preset: (typeof presetsEmpleadosFal)[number]) {
  empleados.value = preset.empleados
  tipoId.value = preset.tipo
  if (!sueldoEditado.value) sueldo.value = preset.sueldo
}

function alCambiarSueldo(valor: number | null | undefined) {
  sueldoEditado.value = true
  sueldo.value = valor ?? 0
}

function elegirSueldo(valor: number) {
  alCambiarSueldo(valor)
}
</script>

<template>
  <div
    v-if="!isSimulating || !isOpen"
    class="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
  >
    <div
      v-if="!isSimulating"
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0 space-y-1">
        <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Simulador de aporte</h3>
        <p class="text-xs text-muted">
          Estimá la masa salarial y el capital aportado al FAL según el tipo de empresa.
        </p>
      </div>
      <UButton
        color="primary"
        label="Abrir simulación"
        icon="i-lucide-calculator"
        class="shrink-0"
        @click="openSimulator"
      />
    </div>

    <div v-else class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0 space-y-1">
        <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Simulación activa</h3>
        <p class="text-xs text-muted">{{ resumenActivo }}</p>
      </div>
      <div class="flex shrink-0 flex-wrap gap-2">
        <UButton
          color="primary"
          variant="soft"
          label="Ver simulador"
          icon="i-lucide-calculator"
          @click="isOpen = true"
        />
        <UButton
          color="error"
          variant="soft"
          label="Cerrar simulación"
          icon="i-lucide-x"
          @click="closeSimulator"
        />
      </div>
    </div>
  </div>

  <UCard v-else>
    <template #header>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 space-y-1">
          <h3 class="text-lg font-semibold">Simulador de aporte</h3>
          <p class="text-sm text-muted">{{ resumenActivo }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <UButton
            icon="i-lucide-minus"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Minimizar simulador"
            @click="minimizeSimulator"
          />
          <UButton
            icon="i-lucide-x"
            color="error"
            variant="ghost"
            size="sm"
            aria-label="Cerrar simulación"
            @click="closeSimulator"
          />
        </div>
      </div>
    </template>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="space-y-5">
        <div class="space-y-2">
          <p class="text-sm font-semibold text-primary">Tipo de Empresa</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <UButton
              v-for="opcion in tipos"
              :key="opcion.id"
              color="primary"
              :variant="tipoId === opcion.id ? 'solid' : 'outline'"
              :label="opcion.etiqueta"
              class="w-full justify-center"
              :ui="{ label: 'whitespace-normal text-center' }"
              @click="tipoId = opcion.id"
            />
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-medium text-neutral-900 dark:text-white">Cantidad de empleados</p>
          <p class="text-3xl font-semibold tabular-nums">
            {{ empleados.toLocaleString('es-AR') }}
          </p>
          <USlider v-model="empleados" :min="1" :max="5000" :step="1" />
          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="preset in presetsEmpleadosFal"
              :key="preset.empleados"
              size="xs"
              color="neutral"
              :variant="empleados === preset.empleados ? 'solid' : 'outline'"
              :label="preset.empleados.toLocaleString('es-AR')"
              @click="elegirPreset(preset)"
            />
          </div>
        </div>

        <div class="space-y-2">
          <UFormField label="Sueldo bruto promedio">
            <UInputNumber
              :model-value="sueldo"
              :min="0"
              :step="10000"
              :format-options="{
                style: 'currency',
                currency: 'ARS',
                useGrouping: true,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }"
              class="w-full"
              @update:model-value="alCambiarSueldo"
            />
          </UFormField>
          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="valor in presetsSueldoFal"
              :key="valor"
              size="xs"
              color="neutral"
              :variant="sueldo === valor ? 'solid' : 'outline'"
              :label="formatMontoFal(valor)"
              @click="elegirSueldo(valor)"
            />
          </div>
        </div>
      </div>

      <dl class="space-y-3 text-sm lg:border-l lg:border-default lg:pl-6">
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-muted">Masa salarial mensual</dt>
          <dd class="font-medium tabular-nums">{{ formatMontoFal(resultado.masaSalarial) }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-muted">Aporte mensual</dt>
          <dd class="font-medium tabular-nums">{{ formatMontoFal(resultado.aporteMensual) }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="min-w-0">
            <span class="text-muted">En un año</span>
            <span class="mt-0.5 block text-xs text-muted">13 aportes, con aguinaldo</span>
          </dt>
          <dd class="shrink-0 font-semibold tabular-nums">
            {{ formatMontoFal(resultado.capitalUnAnio) }}
          </dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="min-w-0">
            <span class="text-muted">En tres años</span>
            <span class="mt-0.5 block text-xs text-muted">39 aportes</span>
          </dt>
          <dd class="shrink-0 font-semibold tabular-nums">
            {{ formatMontoFal(resultado.capitalTresAnios) }}
          </dd>
        </div>
        <div class="flex items-start gap-2 border-t border-default pt-3 text-xs text-muted">
          <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" />
          <p>
            Solo aportes, sin rendimiento del fondo. M = millones. MM = miles de millones. La
            alícuota es la base de la Ley 27.802.
          </p>
        </div>
      </dl>
    </div>
  </UCard>
</template>

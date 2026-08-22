<script setup lang="ts">
import type { PrestamoPersonal } from '~/composables/usePrestamosPersonales'
import {
  prestamoPersonalOfertaKey,
  type PrestamoPersonalSimulado,
} from '~/composables/usePrestamosPersonalesSimulator'
import { formatCurrency } from '~/lib/fci-fund-formatters'
import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'
import { withOutboundUtm } from '~/lib/outbound-url'

const props = withDefaults(
  defineProps<{
    prestamos: Array<PrestamoPersonal | PrestamoPersonalSimulado>
    plazo?: number
    showSimulation?: boolean
    selectable?: boolean
    selectedKey?: string | null
  }>(),
  {
    showSimulation: false,
    selectable: false,
    selectedKey: null,
  },
)

const emit = defineEmits<{
  select: [item: PrestamoPersonal | PrestamoPersonalSimulado]
}>()

function formatPct(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toFixed(1)}%`
}

function hasSimulation(
  item: PrestamoPersonal | PrestamoPersonalSimulado,
): item is PrestamoPersonalSimulado {
  return 'simulation' in item && item.simulation != null
}

const items = computed(() => {
  return props.prestamos.map((prestamo) => {
    const logo =
      getInstitutionLogo(prestamo.entidad) || getInstitutionLogo(prestamo.nombreComercial)
    const institution = getInstitutionShortName(prestamo.entidad) || prestamo.nombreComercial
    const mappedUrl =
      getInstitutionUrl(prestamo.entidad) || getInstitutionUrl(prestamo.nombreComercial)
    const url = prestamo.enlace || mappedUrl || '#'
    const key = prestamoPersonalOfertaKey(prestamo)

    return {
      ...prestamo,
      logo,
      institution,
      url: withOutboundUtm(url, 'prestamos-personales'),
      key,
    }
  })
})

function onSelect(item: (typeof items.value)[number]) {
  emit('select', item)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <component
      :is="selectable ? 'button' : 'a'"
      v-for="(item, index) in items"
      :key="`${item.key}-${index}`"
      :type="selectable ? 'button' : undefined"
      :href="!selectable && item.url !== '#' ? item.url : undefined"
      :target="!selectable && item.url !== '#' ? '_blank' : undefined"
      :rel="!selectable && item.url !== '#' ? 'noopener noreferrer' : undefined"
      class="block w-full text-left appearance-none border-0 bg-transparent p-0 rounded-xl"
      :class="
        showSimulation && hasSimulation(item) && item.simulation.exceedsIncomeCap
          ? 'opacity-70'
          : undefined
      "
      @click="selectable ? onSelect(item) : undefined"
    >
      <UCard
        :ui="{
          body: '!py-3',
          root: [
            selectable && selectedKey === item.key
              ? '!ring-2 !ring-primary-500 dark:!ring-primary-400'
              : selectable
                ? 'hover:!ring-primary-500 dark:hover:!ring-primary-400 cursor-pointer'
                : 'hover:ring-indigo-500 dark:hover:ring-indigo-400',
          ].join(' '),
        }"
      >
        <div class="flex flex-col gap-2">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <img
                v-if="item.logo"
                :src="item.logo"
                :alt="item.institution"
                referrerpolicy="no-referrer"
                class="size-12 shrink-0 rounded-full object-cover"
              />
              <div v-else class="size-12 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />

              <div class="flex flex-col gap-1 min-w-0">
                <div class="font-medium truncate">
                  {{ item.institution }}
                </div>
                <div class="text-sm text-muted truncate">
                  {{ item.producto }}
                </div>
                <div class="flex items-center gap-1 flex-wrap">
                  <UBadge
                    v-if="item.condiciones"
                    color="neutral"
                    variant="outline"
                    class="text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-950/30"
                  >
                    {{ item.condiciones }}
                  </UBadge>
                  <UBadge
                    v-if="item.metadata?.rango?.cftTea?.max != null"
                    color="neutral"
                    variant="subtle"
                  >
                    CFT hasta {{ formatPct(item.metadata.rango.cftTea.max) }}
                  </UBadge>
                  <UBadge
                    v-if="item.metadata?.tasasPorPlazo?.length"
                    color="primary"
                    variant="subtle"
                  >
                    {{ item.metadata.plazoMinMeses ?? '—' }}–{{
                      item.metadata.plazoMaxMeses ?? '—'
                    }}m · {{ item.metadata.tasasPorPlazo.length }}
                    {{ item.metadata.tasasPorPlazo.length === 1 ? 'tramo' : 'tramos' }}
                  </UBadge>
                  <UBadge v-if="item.requiereCliente" color="warning" variant="outline">
                    Requiere cliente
                  </UBadge>
                  <UBadge
                    v-if="selectable && selectedKey === item.key"
                    color="primary"
                    variant="outline"
                  >
                    Elegida
                  </UBadge>
                  <UBadge
                    v-if="showSimulation && hasSimulation(item) && item.simulation.exceedsIncomeCap"
                    color="error"
                    variant="subtle"
                  >
                    Supera afectación
                  </UBadge>
                  <UBadge
                    v-if="
                      showSimulation && hasSimulation(item) && item.simulation.plazoFueraDeRango
                    "
                    color="warning"
                    variant="subtle"
                  >
                    Fuera de plazo
                  </UBadge>
                  <UBadge
                    v-if="
                      showSimulation &&
                      hasSimulation(item) &&
                      item.simulation.plazoDifiereDeEjemplo &&
                      !item.simulation.plazoFueraDeRango
                    "
                    color="info"
                    variant="subtle"
                  >
                    Ejemplo a {{ item.simulation.plazoEjemplo }}m
                  </UBadge>
                </div>
              </div>
            </div>

            <div class="text-right space-y-1 shrink-0">
              <template v-if="showSimulation && hasSimulation(item)">
                <template v-if="item.simulation.plazoFueraDeRango">
                  <div class="text-muted font-semibold tabular-nums">—</div>
                  <div class="text-xs text-neutral">Sin tasa a {{ plazo }}m</div>
                </template>
                <template v-else>
                  <div class="text-primary-600 dark:text-primary-400 font-semibold tabular-nums">
                    {{ formatCurrency(item.simulation.cuota) }}
                  </div>
                  <div class="text-xs text-neutral">Cuota · {{ plazo }}m</div>
                  <div class="text-xs text-muted tabular-nums">
                    Total {{ formatCurrency(item.simulation.total) }}
                  </div>
                  <div
                    v-if="item.simulation.cuotaCft != null"
                    class="text-xs text-muted tabular-nums"
                  >
                    ≈ {{ formatCurrency(item.simulation.cuotaCft) }} c/CFT
                  </div>
                </template>
                <div class="text-xs text-muted">
                  <template v-if="item.metadata?.rango && !item.metadata?.tasasPorPlazo?.length">
                    CFT desde {{ formatPct(item.cftTea) }} · TNA desde {{ formatPct(item.tna) }}
                  </template>
                  <template v-else>
                    CFT {{ formatPct(item.simulation.cftTeaUsada) }} · TNA
                    {{ formatPct(item.simulation.tnaUsada) }}
                  </template>
                </div>
              </template>
              <template v-else>
                <div class="text-primary-600 dark:text-primary-400 font-semibold">
                  {{ formatPct(item.cftTea) }}
                </div>
                <div class="text-xs text-neutral">
                  <template v-if="item.metadata?.rango || item.metadata?.tasasPorPlazo?.length">
                    CFT TEA desde
                  </template>
                  <template v-else>CFT TEA</template>
                </div>
                <div class="text-xs text-muted">
                  <template v-if="item.metadata?.rango || item.metadata?.tasasPorPlazo?.length">
                    TNA desde {{ formatPct(item.tna) }}
                  </template>
                  <template v-else>TNA {{ formatPct(item.tna) }}</template>
                </div>
              </template>
            </div>
          </div>

          <PrestamoPersonalTasasPorPlazo
            v-if="item.metadata?.tasasPorPlazo?.length"
            :tasas="item.metadata.tasasPorPlazo"
            :selected-months="showSimulation ? plazo : null"
          />
        </div>
      </UCard>
    </component>
  </div>
</template>

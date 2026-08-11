<script setup lang="ts">
import type { PrestamoPersonalBcra } from '~/composables/usePrestamosPersonalesBcra'
import { formatCurrency } from '~/lib/fci-fund-formatters'
import { getInstitutionLogo, getInstitutionShortName } from '~/lib/mappings/institutions'

const props = defineProps<{
  prestamos: PrestamoPersonalBcra[]
}>()

function formatPct(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toFixed(1)}%`
}

function formatMonto(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null
  return formatCurrency(value)
}

const items = computed(() => {
  return props.prestamos.map((prestamo) => {
    const logo =
      getInstitutionLogo(prestamo.entidad) || getInstitutionLogo(prestamo.nombreComercial)
    const institution = getInstitutionShortName(prestamo.entidad) || prestamo.nombreComercial
    const montoMin = formatMonto(prestamo.metadata?.montoMin ?? null)
    const montoMax = formatMonto(prestamo.metadata?.montoMax ?? null)
    const plazoMax = prestamo.metadata?.plazoMaxMeses

    return {
      ...prestamo,
      logo,
      institution,
      productoLabel: prestamo.productoCorto || prestamo.producto || 'Préstamo personal',
      montoRango:
        montoMin && montoMax ? `${montoMin} – ${montoMax}` : montoMax || montoMin || null,
      plazoLabel: plazoMax != null ? `hasta ${plazoMax}m` : null,
    }
  })
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="(item, index) in items"
      :key="`${item.codigoEntidad}-${item.productoCorto}-${item.condiciones}-${index}`"
      class="rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <img
            v-if="item.logo"
            :src="item.logo"
            :alt="item.institution"
            referrerpolicy="no-referrer"
            class="size-10 shrink-0 rounded-full object-cover"
          />
          <div v-else class="size-10 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />

          <div class="flex flex-col gap-1 min-w-0">
            <div class="font-medium truncate">{{ item.institution }}</div>
            <div class="text-sm text-muted truncate">{{ item.productoLabel }}</div>
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
                v-if="item.metadata?.afectacionIngresos"
                color="neutral"
                variant="subtle"
              >
                Afectación {{ item.metadata.afectacionIngresos }}
              </UBadge>
              <UBadge v-if="item.plazoLabel" color="neutral" variant="subtle">
                {{ item.plazoLabel }}
              </UBadge>
              <UBadge v-if="item.requiereCliente" color="warning" variant="outline">
                Requiere cliente
              </UBadge>
            </div>
            <div v-if="item.montoRango" class="text-xs text-muted">
              Monto {{ item.montoRango }}
            </div>
          </div>
        </div>

        <div class="text-right space-y-1 shrink-0">
          <div class="text-primary-600 dark:text-primary-400 font-semibold tabular-nums">
            {{ formatPct(item.cftTeaMax) }}
          </div>
          <div class="text-xs text-neutral">CFT máx.</div>
          <div class="text-xs text-muted tabular-nums">TEA máx. {{ formatPct(item.teaMax) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

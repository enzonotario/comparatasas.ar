<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
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

function formatMonto(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return formatCurrency(value)
}

const rows = computed(() => {
  return props.prestamos.map((prestamo, index) => {
    const institution = getInstitutionShortName(prestamo.entidad) || prestamo.nombreComercial
    const logo =
      getInstitutionLogo(prestamo.entidad) || getInstitutionLogo(prestamo.nombreComercial)

    return {
      id: `${prestamo.codigoEntidad}-${prestamo.productoCorto}-${index}`,
      institution,
      logo,
      producto: prestamo.productoCorto || prestamo.producto || 'Préstamo personal',
      condiciones: prestamo.condiciones,
      requiereCliente: prestamo.requiereCliente,
      teaMax: prestamo.teaMax,
      cftTeaMax: prestamo.cftTeaMax,
      montoMin: prestamo.metadata?.montoMin ?? null,
      montoMax: prestamo.metadata?.montoMax ?? null,
      plazoMaxMeses: prestamo.metadata?.plazoMaxMeses ?? null,
      afectacionIngresos: prestamo.metadata?.afectacionIngresos ?? null,
    }
  })
})

const columns: TableColumn<(typeof rows.value)[number]>[] = [
  { accessorKey: 'institution', header: 'Entidad' },
  { accessorKey: 'producto', header: 'Producto' },
  { accessorKey: 'condiciones', header: 'Condiciones' },
  { accessorKey: 'montoMax', header: 'Monto' },
  { accessorKey: 'plazoMaxMeses', header: 'Plazo' },
  { accessorKey: 'teaMax', header: 'TEA máx.' },
  { accessorKey: 'cftTeaMax', header: 'CFT máx.' },
]
</script>

<template>
  <UTable :data="rows" :columns="columns" class="w-full">
    <template #institution-cell="{ row }">
      <div class="flex items-center gap-2 min-w-0">
        <img
          v-if="row.original.logo"
          :src="row.original.logo"
          :alt="row.original.institution"
          referrerpolicy="no-referrer"
          class="size-8 rounded-full object-cover shrink-0"
        />
        <span class="font-medium truncate">{{ row.original.institution }}</span>
      </div>
    </template>

    <template #producto-cell="{ row }">
      <span class="text-sm">{{ row.original.producto }}</span>
    </template>

    <template #condiciones-cell="{ row }">
      <div class="flex flex-col gap-1.5 min-w-[10rem]">
        <span class="text-sm text-muted">{{ row.original.condiciones || '—' }}</span>
        <div class="flex flex-wrap gap-1">
          <UBadge v-if="row.original.afectacionIngresos" color="neutral" variant="subtle" size="sm">
            Afectación {{ row.original.afectacionIngresos }}
          </UBadge>
          <UBadge v-if="row.original.requiereCliente" color="warning" variant="outline" size="sm">
            Cliente
          </UBadge>
        </div>
      </div>
    </template>

    <template #montoMax-cell="{ row }">
      <span class="text-sm tabular-nums text-muted whitespace-nowrap">
        <template v-if="row.original.montoMin != null || row.original.montoMax != null">
          {{ formatMonto(row.original.montoMin) }} – {{ formatMonto(row.original.montoMax) }}
        </template>
        <template v-else>—</template>
      </span>
    </template>

    <template #plazoMaxMeses-cell="{ row }">
      <span class="text-sm tabular-nums text-muted whitespace-nowrap">
        {{ row.original.plazoMaxMeses != null ? `hasta ${row.original.plazoMaxMeses}m` : '—' }}
      </span>
    </template>

    <template #teaMax-cell="{ row }">
      <span class="tabular-nums">{{ formatPct(row.original.teaMax) }}</span>
    </template>

    <template #cftTeaMax-cell="{ row }">
      <span class="tabular-nums font-semibold text-primary-600 dark:text-primary-400">
        {{ formatPct(row.original.cftTeaMax) }}
      </span>
    </template>
  </UTable>
</template>

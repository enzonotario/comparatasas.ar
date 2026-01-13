<script setup lang="ts">
defineProps<{
  items: any[]
  keyProp?: string
  mode?: 'simple' | 'detailed'
  showSimulation?: boolean
}>()

function formatDate(dateString: string): string {
  if (!dateString) return ''

  const parts = dateString.split('-')
  if (parts.length === 3) {
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]
    return `${day}/${month}/${year}`
  }

  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <a
      v-for="(item, index) in items"
      :key="keyProp ? `${item[keyProp]}-${index}` : `item-${index}`"
      :href="item.url ? item.url : undefined"
      :target="item.url ? '_blank' : undefined"
      :rel="item.url ? 'noopener noreferrer' : undefined"
    >
      <UCard :ui="{ body: '!py-3', root: 'hover:ring-indigo-500 dark:hover:ring-indigo-400' }">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div>
                <img
                  v-if="item.logo"
                  :src="item.logo"
                  :alt="keyProp ? item[keyProp] : item.institution"
                  referrerpolicy="no-referrer"
                  class="size-12 rounded-full object-cover"
                />
                <div v-else class="size-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>

              <div class="flex flex-col gap-1 flex-1">
                <div class="font-medium">
                  {{ keyProp ? item[keyProp] : item.institution }}
                </div>
                <span v-if="item.displayName" class="text-sm">
                  {{ item.displayName }}
                </span>

                <div v-if="item.condicionesCorto" class="text-sm text-neutral max-w-sm">
                  {{ item.condicionesCorto }}
                </div>

                <div class="flex items-center gap-1 flex-wrap">
                  <slot name="badges-start" :item="item" />
                  <UBadge
                    v-if="item.typeLabel"
                    color="info"
                    variant="outline"
                    class="text-blue-800 dark:text-blue-100 bg-blue-50 dark:bg-blue-950/30"
                  >
                    {{ item.typeLabel }}
                  </UBadge>
                  <UBadge
                    v-if="item.tope"
                    color="error"
                    variant="outline"
                    class="text-red-800 dark:text-red-100 bg-red-50 dark:bg-red-950/30"
                  >
                    Límite:
                    {{
                      new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                        notation: 'compact',
                      }).format(item.tope)
                    }}
                  </UBadge>
                  <UBadge
                    v-if="item.tope === null"
                    color="neutral"
                    variant="outline"
                    class="text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-950/30"
                  >
                    Sin Límites
                  </UBadge>
                  <UBadge
                    v-if="item.patrimonio"
                    color="neutral"
                    variant="outline"
                    class="text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-950/30"
                  >
                    Patrimonio:
                    {{
                      new Intl.NumberFormat('es-AR', { notation: 'compact' }).format(
                        item.patrimonio,
                      )
                    }}
                  </UBadge>
                  <slot name="badges-end" :item="item" />
                </div>
              </div>
            </div>

            <div class="text-right space-y-1">
              <div v-if="showSimulation && item.simulation" class="space-y-1">
                <div class="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                  {{ formatCurrency(item.simulation.earned) }}
                </div>
                <div class="text-xs text-neutral">
                  Ganancia en {{ item.simulation.days }} días
                  <span v-if="item.simulation.isPlazoFijo" class="text-neutral-500"
                    >(plazo fijo)</span
                  >
                </div>
                <div
                  v-if="item.simulation.exceedsLimit"
                  class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"
                >
                  <UIcon name="i-lucide-alert-triangle" class="size-3" />
                  <span>Tope: {{ formatCurrency(item.simulation.limit) }}</span>
                </div>
                <div
                  v-if="item.simulation.isFiwind"
                  class="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1"
                >
                  <UIcon name="i-lucide-info" class="size-3 mt-0.5 shrink-0" />
                  <span>
                    Hasta {{ formatCurrency(item.simulation.limit) }}: {{ (item.tna * 100).toFixed(2) }}% TNA.
                    Excedente: {{ (item.simulation.deltaPesosTna * 100).toFixed(2) }}% TNA (Delta Pesos - Clase A).
                  </span>
                </div>
                <div class="text-xs text-neutral-500 dark:text-neutral-600">
                  TNA: {{ mode === 'simple' ? item.tna.toFixed(2) : (item.tna * 100).toFixed(2) }}%
                </div>
              </div>
              <div v-else>
                <div class="text-primary-600 dark:text-primary-400 font-semibold">
                  {{ mode === 'simple' ? item.tna.toFixed(2) : (item.tna * 100).toFixed(2) }}%
                </div>
                <div class="text-xs text-neutral">
                  TNA
                  <div v-if="item.fechaAnterior && item.fecha">
                    <span>Entre </span>

                    <span>{{ formatDate(item.fechaAnterior) }} y {{ formatDate(item.fecha) }}</span>
                  </div>
                  <div v-else-if="item.fecha">
                    <span>Actualizado el </span>
                    <span>{{ formatDate(item.fecha) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <slot name="details" :item="item" />
        </div>
      </UCard>
    </a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  items: any[]
  keyProp?: string
  mode?: 'simple' | 'detailed'
}>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
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
              <div class="text-primary-600 dark:text-primary-400 font-semibold">
                {{ mode === 'simple' ? item.tna.toFixed(2) : (item.tna * 100).toFixed(2) }}%
              </div>
              <div class="text-xs text-neutral">
                TNA
                <div v-if="item.fechaAnterior && item.fecha">
                  <span>Entre </span>

                  <span>{{ formatDate(item.fechaAnterior) }} y {{ formatDate(item.fecha) }}</span>
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

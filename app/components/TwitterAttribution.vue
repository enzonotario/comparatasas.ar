<script setup lang="ts">
import { withOutboundUtm } from '~/lib/outbound-url'

interface Props {
  usuario: string
  nombre: string
  avatar: string
  url: string
  medium?: string
  /** `header`: bloque compacto alineado a la derecha. `card`: fila con estilo de ítem para listados. */
  variant?: 'header' | 'card'
}

const props = withDefaults(defineProps<Props>(), {
  medium: 'attribution',
  variant: 'header',
})

const outboundUrl = computed(() => withOutboundUtm(props.url, props.medium))
const cafecitoUrl = computed(() =>
  withOutboundUtm('https://cafecito.app/salinaseconomia1', props.medium),
)
</script>

<template>
  <div
    v-if="props.variant === 'card'"
    class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/50"
  >
    <div class="flex min-w-0 items-center gap-3">
      <img
        :src="props.avatar"
        :alt="props.nombre"
        class="size-12 rounded-full object-cover"
        referrerpolicy="no-referrer"
      />
      <p class="text-sm text-gray-900 dark:text-gray-100">
        <span class="text-gray-600 dark:text-gray-400">Datos recolectados por</span>
        <a
          :href="outboundUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="ml-1 font-semibold text-gray-900 hover:underline dark:text-gray-100"
        >
          @{{ props.usuario }}
        </a>
      </p>
    </div>

    <UButton
      :to="cafecitoUrl"
      external
      target="_blank"
      rel="noopener noreferrer"
      color="neutral"
      variant="outline"
      size="sm"
    >
      <UIcon name="i-heroicons-heart" />
      Invitame un café
    </UButton>
  </div>

  <div v-else class="flex flex-col items-end gap-1 p-1">
    <div class="flex items-center gap-3">
      <img
        :src="props.avatar"
        :alt="props.nombre"
        class="size-10 rounded-full object-cover"
        referrerpolicy="no-referrer"
      />
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-900 dark:text-gray-100">
          <span class="text-gray-600 dark:text-gray-400">Datos recolectados por</span>
          <a
            :href="outboundUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-gray-900 dark:text-gray-100 hover:underline ml-1"
          >
            @{{ props.usuario }}
          </a>
        </p>
      </div>
    </div>

    <UButton
      :to="cafecitoUrl"
      external
      target="_blank"
      rel="noopener noreferrer"
      color="neutral"
      variant="outline"
      size="sm"
    >
      <UIcon name="i-heroicons-heart" />
      Invitame un café
    </UButton>
  </div>
</template>

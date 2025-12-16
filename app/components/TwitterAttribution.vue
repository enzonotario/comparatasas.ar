<script setup lang="ts">
interface Props {
  usuario: string
  nombre: string
  avatar: string
  url: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    class="flex flex-col items-end gap-1 p-1"
  >
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
            :href="props.url"
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
      to="https://cafecito.app/salinaseconomia1"
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

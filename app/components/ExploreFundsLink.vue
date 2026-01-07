<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  to?: string
  icon?: string
}>()

const defaultTitle = 'Análisis completo de FCI'
const defaultDescription =
  'Consultá y compará todos los fondos disponibles con datos detallados de rendimiento, patrimonio y características'
const defaultTo = '/fondos'
const defaultIcon = 'i-lucide-bar-chart-3'
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-base font-medium text-neutral-700 dark:text-neutral-300">
      {{ title || defaultTitle }}
    </h3>
    <NuxtLink
      :to="to || defaultTo"
      class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200 group"
    >
      <UIcon
        :name="icon || defaultIcon"
        class="size-6 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400"
      />
      <div class="flex-1">
        <div
          class="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400"
        >
          <slot name="link-text">
            Explorar todos los FCI
          </slot>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          <slot name="description">
            {{ description || defaultDescription }}
          </slot>
        </p>
      </div>
      <UIcon
        name="i-lucide-arrow-right"
        class="size-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400"
      />
    </NuxtLink>
  </div>
</template>


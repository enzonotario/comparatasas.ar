<script setup lang="ts">
const props = defineProps<{
  count: number
  to: string | Record<string, unknown>
  disabled?: boolean
  hint?: string | null
}>()

defineEmits<{
  clear: []
}>()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-3"
  >
    <div
      v-if="count > 0"
      class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3"
    >
      <div
        class="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl border border-default bg-default/95 px-3 py-2 shadow-lg backdrop-blur-md sm:gap-3"
      >
        <div class="min-w-0 pl-1">
          <p class="text-sm font-medium text-highlighted truncate">
            {{ count }}
            {{ count === 1 ? 'fondo seleccionado' : 'fondos seleccionados' }}
          </p>
          <p v-if="hint" class="text-xs text-muted truncate">{{ hint }}</p>
        </div>

        <UButton
          :to="to"
          color="primary"
          size="sm"
          icon="i-lucide-columns-2"
          label="Comparar"
          :disabled="disabled"
          class="shrink-0"
        />

        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          square
          icon="i-lucide-x"
          aria-label="Limpiar selección"
          class="shrink-0"
          @click="$emit('clear')"
        />
      </div>
    </div>
  </Transition>
</template>

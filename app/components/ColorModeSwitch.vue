<script setup>
const colorMode = useColorMode()

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  },
})
</script>

<template>
  <ClientOnly v-if="!colorMode?.forced">
    <UButton
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      color="neutral"
      variant="ghost"
      :aria-label="isDark ? 'Modo oscuro' : 'Modo claro'"
      @click="isDark = !isDark"
    >
    </UButton>

    <template #fallback>
      <div class="size-8" />
    </template>
  </ClientOnly>
</template>

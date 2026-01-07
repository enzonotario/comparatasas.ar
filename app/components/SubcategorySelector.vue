<script setup lang="ts">
import type { NavigationPage } from '~/composables/useNavigationPages'

const route = useRoute()
const { getCurrentCategory, isActive } = useNavigationPages()

const currentCategory = computed(() => getCurrentCategory())

// Solo mostrar para ARS y si tiene más de una página
const shouldShow = computed(() => {
  return currentCategory.value?.id === 'ars' && (currentCategory.value?.pages.length ?? 0) > 1
})

const getSubcategoryRoute = (page: NavigationPage): string => {
  return page.to
}
</script>

<template>
  <div
    class="sticky z-30 top-[var(--ui-header-height)]"
    :style="{ height: shouldShow && currentCategory ? '2.5rem' : '2.5rem' }"
  >
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-full"
    >
      <div
        v-if="shouldShow && currentCategory"
        class="bg-white/70 dark:bg-neutral-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-800 h-10"
      >
        <div class="h-10 flex flex-row sm:justify-center overflow-x-auto">
          <UButton
            v-for="page in currentCategory.pages"
            :key="page.to"
            :variant="isActive(page, route.path) ? 'link' : 'ghost'"
            color="neutral"
            size="sm"
            :to="getSubcategoryRoute(page)"
            :class="[
              'h-full transition-all duration-200 rounded-none flex-shrink-0',
              isActive(page, route.path)
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border-b-2 border-transparent',
            ]"
          >
            <img :src="page.image" :alt="page.label" class="size-8" />
            {{ page.label }}
          </UButton>
        </div>
      </div>
    </Transition>
  </div>
</template>

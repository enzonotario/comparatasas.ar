<script setup lang="ts">
interface NavigationPage {
  to: string
  label: string
  icon: string
  image: string
}

interface Props {
  pages: NavigationPage[]
  currentRoute: string
}

const props = defineProps<Props>()

const currentIndex = computed(() => {
  return props.pages.findIndex((page) => page.to.split('#')[0] === props.currentRoute)
})

const previousPage = computed(() => {
  const prevIndex = currentIndex.value - 1
  return prevIndex >= 0 ? props.pages[prevIndex] : null
})

const nextPage = computed(() => {
  const nextIndex = currentIndex.value > 0 ? currentIndex.value + 1 : 1
  return nextIndex < props.pages.length ? props.pages[nextIndex] : null
})
</script>

<template>
  <div v-if="previousPage || nextPage" class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div v-if="previousPage" class="w-full flex md:justify-start">
      <NuxtLink
        :to="previousPage.to"
        class="w-full group flex flex-col gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200"
      >
        <div
          class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400"
        >
          <UIcon name="i-lucide-arrow-left" class="size-6" />
        </div>
        <div class="flex items-center gap-3 flex-1">
          <img :src="previousPage.image" :alt="previousPage.label" class="size-6" />
          <div>
            <div
              class="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400"
            >
              {{ previousPage.label }}
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-if="nextPage" class="w-full flex md:justify-end">
      <NuxtLink
        :to="nextPage.to"
        class="w-full group flex flex-col gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200"
      >
        <div
          class="flex items-center justify-end gap-2 text-sm text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400"
        >
          <UIcon name="i-lucide-arrow-right" class="size-6" />
        </div>
        <div class="flex items-center gap-3 flex-1 text-right">
          <div class="flex-1">
            <div
              class="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400"
            >
              {{ nextPage.label }}
            </div>
          </div>
          <img :src="nextPage.image" :alt="nextPage.label" class="size-6" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

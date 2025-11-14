<script setup lang="ts">
import type { NavigationPage } from '~/composables/useNavigationPages'

interface Props {
  pages: NavigationPage[]
  currentRoute: string
}

const props = defineProps<Props>()
const { getPreviousPage, getNextPage } = useNavigationPages()

const previousPage = computed(() => getPreviousPage(props.currentRoute))
const nextPage = computed(() => getNextPage(props.currentRoute))
</script>

<template>
  <div
    v-if="previousPage || nextPage"
    class="flex flex-col md:flex-row gap-4"
    :class="{ 'md:flex-row-reverse': !previousPage }"
  >
    <div v-if="previousPage" class="w-full md:w-1/2 flex md:justify-start">
      <NuxtLink
        v-if="previousPage"
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

    <div v-if="nextPage" class="w-full md:w-1/2 flex md:justify-end">
      <NuxtLink
        v-if="nextPage"
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

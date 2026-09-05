<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import {
  groupNavigationPages,
  type NavigationPage,
} from '~/composables/useNavigationPages'

const GROUP_ICONS: Record<string, string> = {
  inversion: 'i-lucide-wallet',
  mercado: 'i-lucide-chart-line',
  credito: 'i-lucide-landmark',
  'costos-y-herramientas': 'i-lucide-wrench',
  usd: 'i-lucide-dollar-sign',
  otros: 'i-lucide-layout-grid',
}

const route = useRoute()
const { getCurrentCategory, getCurrentPage, isActive } = useNavigationPages()

const openMobile = ref(false)

const currentCategory = computed(() => getCurrentCategory())
const currentPage = computed(() => getCurrentPage())

const shouldShow = computed(() => (currentCategory.value?.pages.length ?? 0) > 1)

const pageGroups = computed(() => groupNavigationPages(currentCategory.value?.pages ?? []))

const showGroupLabels = computed(() => pageGroups.value.length > 1)

const useGroupedDesktop = computed(() => pageGroups.value.length > 1)

const desktopItems = computed<NavigationMenuItem[]>(() => {
  const groups = pageGroups.value

  // Un solo grupo: links planos (como items sin children en la doc)
  if (groups.length <= 1) {
    return (groups[0]?.pages ?? []).map((page) => toPageItem(page))
  }

  // Varios grupos: label + icon + children (patrón docs NavigationMenu)
  return groups.map((group) => {
    const groupActive = group.pages.some((page) => isActive(page))
    return {
      label: group.label,
      icon: GROUP_ICONS[group.id] ?? GROUP_ICONS.otros,
      active: groupActive,
      children: group.pages.map((page) => ({
        ...toPageItem(page),
        // avatar no se renderiza en children del NavigationMenu;
        // lo consumimos en #item-content
        avatar: { src: page.image, alt: '' },
      })),
    } satisfies NavigationMenuItem
  })
})

watch(
  () => route.fullPath,
  () => {
    openMobile.value = false
  },
)

function toPageItem(page: NavigationPage): NavigationMenuItem {
  return {
    label: page.label,
    icon: page.icon,
    to: page.to,
    active: isActive(page),
  }
}

function pageLinkClass(page: NavigationPage) {
  return [
    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
    isActive(page)
      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70',
  ]
}
</script>

<template>
  <div class="sticky z-30 top-[var(--ui-header-height)]">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-full"
    >
      <div
        v-if="shouldShow && currentCategory && currentPage"
        class="bg-white/70 dark:bg-neutral-900/70 backdrop-blur"
      >
        <!--
          Desktop: UNavigationMenu según docs
          https://ui.nuxt.com/docs/components/navigation-menu
          highlight + border-b; no forzar h-full/py-0 (rompe after:-bottom-2)
        -->
        <div class="hidden md:block px-2">
          <UNavigationMenu
            :items="desktopItems"
            orientation="horizontal"
            content-orientation="vertical"
            color="primary"
            variant="link"
            highlight
            highlight-color="primary"
            class="w-full max-w-5xl mx-auto justify-center data-[orientation=horizontal]:border-b border-default"
            :ui="{
              linkLeadingIcon: 'size-4 shrink-0',
              linkTrailingIcon: 'size-3.5 shrink-0 opacity-60',
              content: 'min-w-56',
              childLinkIcon: 'size-4 shrink-0',
            }"
          >
            <!-- Children no soportan avatar; slot con PNG de producto -->
            <template v-if="useGroupedDesktop" #item-content="{ item }">
              <ul class="flex flex-col gap-0.5 p-1.5">
                <li v-for="(child, childIndex) in item.children" :key="childIndex">
                  <NuxtLink
                    :to="child.to"
                    class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors"
                    :class="
                      child.active
                        ? 'bg-elevated text-highlighted'
                        : 'text-muted hover:bg-elevated/50 hover:text-highlighted'
                    "
                  >
                    <img
                      v-if="child.avatar?.src"
                      :src="child.avatar.src"
                      alt=""
                      class="size-6 shrink-0"
                      aria-hidden="true"
                    />
                    <UIcon
                      v-else-if="child.icon"
                      :name="child.icon"
                      class="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span class="truncate font-medium">{{ child.label }}</span>
                  </NuxtLink>
                </li>
              </ul>
            </template>
          </UNavigationMenu>
        </div>

        <!-- Mobile: barra compacta + drawer vertical -->
        <div class="md:hidden flex h-11 items-center border-b border-default px-2">
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-between"
            trailing-icon="i-lucide-chevron-down"
            :aria-expanded="openMobile"
            :aria-label="`Abrir comparadores ${currentCategory.label}`"
            @click="openMobile = true"
          >
            <span class="flex min-w-0 items-center gap-2">
              <img :src="currentPage.image" alt="" class="size-6 shrink-0" aria-hidden="true" />
              <span class="truncate font-medium">{{ currentPage.label }}</span>
            </span>
          </UButton>

          <UDrawer v-model:open="openMobile" :title="`Comparadores ${currentCategory.label}`">
            <template #body>
              <div class="space-y-5 px-1 pb-4">
                <section v-for="group in pageGroups" :key="group.id" class="space-y-1">
                  <h3
                    v-if="showGroupLabels"
                    class="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted"
                  >
                    {{ group.label }}
                  </h3>
                  <ul class="space-y-0.5">
                    <li v-for="page in group.pages" :key="page.to">
                      <NuxtLink
                        :to="page.to"
                        :class="pageLinkClass(page)"
                        class="px-3 py-2.5"
                        @click="openMobile = false"
                      >
                        <img
                          :src="page.image"
                          alt=""
                          class="size-8 shrink-0"
                          aria-hidden="true"
                        />
                        <span class="min-w-0 truncate">{{ page.label }}</span>
                        <UIcon
                          v-if="isActive(page)"
                          name="i-lucide-check"
                          class="ml-auto size-4 shrink-0 text-primary-600 dark:text-primary-400"
                        />
                      </NuxtLink>
                    </li>
                  </ul>
                </section>
              </div>
            </template>
          </UDrawer>
        </div>
      </div>
    </Transition>
  </div>
</template>

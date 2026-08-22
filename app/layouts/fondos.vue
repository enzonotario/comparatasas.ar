<script setup lang="ts">
import FondosDashboardSidebar from '~/components/funds/FondosDashboardSidebar.vue'
import { withOutboundUtm } from '~/lib/outbound-url'

const nuxtApp = useNuxtApp()
const route = useRoute()
const { initialize } = useHotjar()

useFunds()
useAccounts()
useFciVariablesUltimo()

const open = ref(false)

const { allFunds } = useFondosCatalog()

onMounted(() => {
  initialize()
})

const isDetailPage = computed(() => route.name === 'fondos-nombre')
</script>

<template>
  <UApp>
    <GlobalSearch />

    <UHeader
      class="top-0 left-0 right-0 z-[60] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md max-lg:sticky lg:fixed"
      :ui="{
        center: '!flex',
        toggle: '!hidden',
      }"
    >
      <template #title>
        <NuxtLink to="/" class="flex items-center gap-2">
          <img
            src="/assets/logo.png"
            alt="ComparaTasas.ar"
            class="w-8 h-8 rounded-full object-cover"
            loading="eager"
            fetchpriority="high"
          />
          <span class="text-lg font-bold text-zinc-900 dark:text-white hidden lg:block">
            ComparaTasas.ar
          </span>
        </NuxtLink>
      </template>

      <template #default>
        <CategorySelector />
      </template>

      <template #right>
        <UButton
          class="hidden h-7 sm:inline-flex"
          color="neutral"
          variant="outline"
          icon="i-lucide-search"
          label="Buscar"
          @click="() => nuxtApp.hooks.callHook('dashboard:search:toggle')"
        >
          <template #trailing>
            <UKbd value="meta" variant="subtle" />
            <UKbd value="k" variant="subtle" />
          </template>
        </UButton>
        <UButton
          class="inline-flex h-7 sm:hidden"
          color="neutral"
          variant="ghost"
          square
          icon="i-lucide-search"
          aria-label="Buscar"
          @click="() => nuxtApp.hooks.callHook('dashboard:search:toggle')"
        />
        <UColorModeSwitch />
      </template>

      <template #body>
        <CategorySelectorMobile />
      </template>
    </UHeader>

    <UDashboardGroup
      unit="rem"
      storage-key="fondos-dashboard"
      class="bg-neutral-50 dark:bg-neutral-950 max-lg:relative max-lg:!inset-auto max-lg:!top-auto max-lg:!bottom-auto max-lg:overflow-visible max-lg:h-auto max-lg:min-h-0 lg:fixed lg:!inset-x-0 lg:!top-[var(--ui-header-height)] lg:!bottom-0 lg:overflow-hidden"
    >
      <UDashboardSidebar
        id="fondos"
        v-model:open="open"
        resizable
        :min-size="14"
        :default-size="18"
        :max-size="24"
        class="bg-elevated/25 h-full !min-h-0"
        :ui="{
          root: 'h-full !min-h-0',
          footer: 'lg:border-t lg:border-default',
        }"
      >
        <template #default>
          <FondosDashboardSidebar
            :all-funds="allFunds ?? []"
            @select="open = false"
          />
        </template>

        <template #footer>
          <NuxtLink
            :to="withOutboundUtm('https://argentinadatos.com/', 'fondos')"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 w-full min-w-0 rounded-md hover:bg-elevated/50 transition-colors px-1 py-0.5"
          >
            <div
              class="size-8 shrink-0 rounded-full bg-elevated ring ring-default flex items-center justify-center"
            >
              <UIcon name="i-lucide-database" class="size-4 text-muted" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium truncate">ArgentinaDatos</p>
            </div>
          </NuxtLink>
        </template>
      </UDashboardSidebar>

      <slot />
    </UDashboardGroup>
  </UApp>
</template>

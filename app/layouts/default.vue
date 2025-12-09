<script setup lang="ts">
const { fetch: fetchFunds } = useFunds()
const { fetch: fetchAccounts } = useAccounts()
const { fetch: fetchCrypto } = useCrypto()
const { fetch: fetchPlazosFijos } = usePlazosFijos()
const { fetch: fetchCriptopesos } = useCriptopesos()
const { initialize } = useHotjar()

const route = useRoute()
const { pages } = useNavigationPages()

onMounted(() => {
  fetchAccounts()
  fetchFunds()
  fetchCrypto()
  fetchPlazosFijos()
  fetchCriptopesos()
  initialize()
})
</script>

<template>
  <UApp>
    <div class="bg-neutral-50 dark:bg-neutral-950">
      <LayoutBackground />

      <UHeader
        class="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md"
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
              class="w-9 h-9 rounded-full object-cover"
              loading="eager"
              fetchpriority="high"
            />
            <span
              class="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white hidden lg:block"
            >
              ComparaTasas.ar
            </span>
          </NuxtLink>
        </template>

        <template #default>
          <CategorySelector />
        </template>

        <template #right>
          <UColorModeSwitch />
        </template>

        <template #body>
          <CategorySelectorMobile />
        </template>
      </UHeader>

      <SubcategorySelector />

      <UMain class="flex flex-col space-y-6 pt-16">
        <UContainer class="space-y-6">
          <div class="flex flex-col items-center text-center space-y-2">
            <h1 class="font-bold text-4xl sm:text-5xl text-neutral-900 dark:text-white">
              ¡Encontra <span class="text-primary-600">las mejores inversiones</span> para vos!
            </h1>
            <p class="text-neutral-600 dark:text-neutral-400">
              Compará tasas de plazos fijos, fondos comunes de inversión y rendimientos crypto.
            </p>
          </div>

          <AdBanner />
        </UContainer>

        <UContainer
          class="w-full mx-auto space-y-6"
          :class="{
            'max-w-3xl': route.name !== 'criptomonedas',
            'max-w-5xl': route.name === 'criptomonedas',
          }"
        >
          <slot />
        </UContainer>

        <UContainer class="w-full max-w-3xl mx-auto space-y-6">
          <span class="flex-1" />

          <FinancialAdviceCard />

          <PageNavigation :pages="pages" :current-route="route.path" />

          <DisclaimerSection :page="route.name" />
        </UContainer>
      </UMain>

      <USeparator type="dashed" class="h-px mt-6" />

      <UFooter
        :ui="{
          top: '!py-6',
          container: '!p-0',
        }"
      >
        <template #top>
          <UContainer class="w-full max-w-3xl mx-auto space-y-12 !py-0">
            <div class="flex flex-col items-start gap-2">
              <h3 class="text-xl font-bold">Apoyá el proyecto</h3>
              <p class="text-sm text-muted">
                Ayudame a mantener y mejorar este proyecto con una donación.
              </p>
              <UButton
                to="https://cafecito.app/enzonotario"
                external
                target="_blank"
                rel="noopener noreferrer"
                color="neutral"
                variant="outline"
                size="lg"
              >
                <UIcon name="i-heroicons-heart" />
                Invitame un café
              </UButton>
            </div>

            <div class="flex flex-col items-start gap-2">
              <h3 class="text-xl font-bold">Open Source</h3>
              <p class="text-sm text-muted">
                Este proyecto es de código abierto. Contribuciones y sugerencias son bienvenidas.
              </p>
              <UButton
                href="https://github.com/enzonotario/comparatasas.ar"
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                color="neutral"
                class="space-x-2"
              >
                <UIcon name="i-lucide-github" class="size-4" />
                GitHub
              </UButton>
            </div>

            <FriendlyPages />
          </UContainer>
        </template>
      </UFooter>
    </div>
  </UApp>
</template>

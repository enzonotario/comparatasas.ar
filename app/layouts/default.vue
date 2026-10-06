<script setup lang="ts">
const nuxtApp = useNuxtApp()

useFunds()
useAccounts()
useCrypto()
usePlazosFijos()
usePlazosFijosUvaPagoPeriodico()
usePlazosFijosPrecancelables()
useCriptopesos()
const { initialize } = useHotjar()

const route = useRoute()
const { showProductScenarios } = useProductScenarios()

const isSumarsePage = computed(
  () => route.path === '/sumarse' || route.path.startsWith('/sumarse/'),
)

const useSponsorBanner = computed(() => {
  const cutoffDate = new Date('2026-01-01')
  const today = new Date()
  return today >= cutoffDate
})

onMounted(() => {
  initialize()
})

const isWideLayout = computed(() => {
  const p = route.path.replace(/\/$/, '') || '/'
  // Solo el ranking tradicional usa contenedor ancho; UVA pago periódico /
  // precancelable siguen en max-w-3xl como antes.
  if (p === '/plazos-fijos') return true
  if (p === '/creditos-hipotecarios-uva' || p.startsWith('/creditos-hipotecarios-uva/')) return true
  if (p === '/prestamos-personales' || p.startsWith('/prestamos-personales/')) return true
  if (p === '/metodologia' || p.startsWith('/metodologia/')) return true
  if (p === '/comisiones-brokers' || p.startsWith('/comisiones-brokers/')) return true

  return [
    'criptomonedas',
    'comisiones-cobro',
    'contado-cuotas',
    'fondos',
    'fondos-nombre',
    'fondos-nombre-historico',
    'remesas',
    'cuentas-billeteras-graficos',
    'lecaps',
    'cauciones',
    'bonos-cer',
  ].includes(route.name as string)
})

const isProviderHistoryPage = computed(() => {
  return route.path.startsWith('/cuentas-billeteras/') && route.params.provider
})

const pageTitle = computed(() => route.meta.pageTitle as string | undefined)
const pageDescription = computed(() => route.meta.pageDescription as string | undefined)

const productScenarioRailPaths = new Set([
  '/',
  '/plazos-fijos',
  '/cuentas-billeteras',
  '/fondos',
  '/usd',
  '/criptomonedas',
  '/remesas',
  '/creditos-hipotecarios-uva',
  '/prestamos-personales',
  '/comisiones-cobro',
  '/comisiones-brokers',
  '/lecaps',
  '/cauciones',
  '/bonos-cer',
])

const showProductScenariosRail = computed(() => {
  if (!showProductScenarios.value) return false

  if (isSumarsePage.value || isProviderHistoryPage.value || route.name === 'contado-cuotas') {
    return false
  }

  return productScenarioRailPaths.has(route.path) || route.path.startsWith('/comisiones-brokers/')
})
</script>

<template>
  <UApp>
    <GlobalSearch />
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
          <div class="flex items-center gap-2">
            <img
              src="/assets/logo.png"
              alt="ComparaTasas.ar"
              class="w-8 h-8 rounded-full object-cover"
              loading="eager"
              fetchpriority="high"
            />
            <span
              class="text-xs md:text-sm lg:text-xl font-bold text-zinc-900 dark:text-white"
            >
              ComparaTasas.ar
            </span>
          </div>
        </template>

        <template #default>
          <CategorySelector v-if="!isSumarsePage" class="hidden md:flex" />
        </template>

        <template #right>
          <CategorySelector v-if="!isSumarsePage" class="flex md:hidden" />
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
          <CategorySelectorMobile v-if="!isSumarsePage" />
        </template>
      </UHeader>

      <SubcategorySelector v-if="!isSumarsePage" />

      <UMain class="flex flex-col space-y-6 pt-16">
        <UContainer v-if="!isProviderHistoryPage" class="space-y-6">
          <div v-if="pageTitle" class="flex flex-col items-center text-center space-y-2">
            <h1 class="font-bold text-4xl sm:text-5xl text-neutral-900 dark:text-white">
              {{ pageTitle }}
            </h1>
            <p v-if="pageDescription" class="text-neutral-600 dark:text-neutral-400">
              {{ pageDescription }}
            </p>
          </div>

          <SponsorBanner v-if="useSponsorBanner" />
          <AdBanner v-else />
        </UContainer>

        <UContainer
          class="w-full mx-auto space-y-6"
          :class="{
            'max-w-3xl': !isWideLayout,
            'max-w-8xl': isWideLayout,
          }"
        >
          <slot />

          <ProductScenariosRail
            v-if="showProductScenariosRail"
            subtitle="Elegí un producto para simular Contado vs Cuotas."
            action-label="Ver en simulación"
            navigate-on-select
          />
        </UContainer>

        <UContainer v-if="!isProviderHistoryPage" class="w-full max-w-3xl mx-auto space-y-6">
          <span class="flex-1" />

          <OpinaPageFeedback />

          <FinancialAdviceCard v-if="!isSumarsePage" />

          <PageNavigation />

          <DisclaimerSection v-if="!isSumarsePage" :page="route.name" />
        </UContainer>
      </UMain>

      <AppFooter class="mt-12" />

    </div>
  </UApp>
</template>


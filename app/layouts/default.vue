<script setup lang="ts">
const { fetch: fetchFunds } = useFunds()
const { fetch: fetchAccounts } = useAccounts()
const { fetch: fetchCrypto } = useCrypto()
const { fetch: fetchPlazosFijos } = usePlazosFijos()
const { fetch: fetchCriptopesos } = useCriptopesos()
const { initialize } = useHotjar()

const route = useRoute()
const { pages } = useNavigationPages()

useHead({
  htmlAttrs: { lang: 'es' },
  title: 'Compara Tasas - Encuentra las mejores inversiones en Argentina',
  meta: [
    {
      name: 'description',
      content:
        'Compara tasas de plazos fijos, fondos comunes de inversión, cuentas remuneradas y rendimientos crypto en Argentina. Encuentra la mejor inversión para tu dinero.',
    },
    { name: 'application-name', content: 'Compara Tasas' },
    { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
    { name: 'theme-color', content: '#111827', media: '(prefers-color-scheme: dark)' },
    // {
    //   name: 'viewport',
    //   content:
    //     'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
    // },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' },
    { rel: 'manifest', href: '/manifest.json' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://api.argentinadatos.com' },
    { rel: 'preconnect', href: 'https://api.iconify.design' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cal+Sans&display=swap' },
  ],
})

useSeoMeta({
  title: 'Compara Tasas - Encuentra las mejores inversiones en Argentina',
  ogTitle: 'Compara Tasas - Encuentra las mejores inversiones en Argentina',
  description:
    'Compara tasas de plazos fijos, fondos comunes de inversión, cuentas remuneradas y rendimientos crypto en Argentina. Encuentra la mejor inversión para tu dinero.',
  ogDescription:
    'Compara tasas de plazos fijos, fondos comunes de inversión, cuentas remuneradas y rendimientos crypto en Argentina. Encuentra la mejor inversión para tu dinero.',
  ogImage: 'https://comparatasas.ar/meta-imagen.png',
  ogUrl: 'https://comparatasas.ar',
  ogType: 'website',
  ogLocale: 'es_AR',
  twitterCard: 'summary_large_image',
  robots: 'index, follow',
})

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
      >
        <template #title>
          <NuxtLink to="/" class="flex items-center gap-2">
            <img
              src="/assets/logo.png"
              alt="ComparaTasas.ar"
              class="w-12 h-12 rounded-full object-cover"
              loading="eager"
              fetchpriority="high"
            />
            <span
              class="font-bold text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
            >
              ComparaTasas.ar
            </span>
          </NuxtLink>
        </template>

        <template #right>
          <UColorModeSwitch />
        </template>

        <template #body>
          <PageNavigationMobile :pages="pages" :current-route="`/${route.name}`" />
        </template>
      </UHeader>

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

          <nav class="flex justify-center">
            <div class="flex flex-wrap md:flex-nowrap justify-center">
              <div v-for="page in pages" :key="page.to" class="w-1/2 sm:w-1/3 md:w-1/5 p-1">
                <NuxtLink
                  :to="page.to"
                  class="h-full flex flex-col items-center gap-2 p-2 text-center text-xs md:text-base rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                  active-class="bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800 text-primary-800 dark:text-primary-200 border-primary-300 dark:border-primary-700"
                >
                  <img :src="page.image" alt="Ícono" class="size-7 md:size-10" />
                  {{ page.label }}
                </NuxtLink>
              </div>
            </div>
          </nav>
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

          <PageNavigation :pages="pages" :current-route="`/${route.name}`" />

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

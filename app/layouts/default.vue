<script setup lang="ts">
const { fetch: fetchFunds } = useFunds()
const { fetch: fetchAccounts } = useAccounts()
const { fetch: fetchCrypto } = useCrypto()

const route = useRoute()

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
  ogImage: 'https://comparatasas-nuxt.vercel.app/meta-imagen.png',
  twitterCard: 'summary_large_image',
})

const pages = [
  {
    to: '/cuentas-billeteras#cuentas-remuneradas',
    label: 'Cuentas y Billeteras',
    icon: 'i-lucide-wallet',
    image: 'https://api.argentinadatos.com/static/comparatasas/icons/wallet.png',
  },
  {
    to: '/mercado-dinero-ars#mercado-dinero-ars',
    label: 'Mercado Dinero ARS',
    icon: 'i-lucide-pie-chart',
    image: 'https://api.argentinadatos.com/static/comparatasas/icons/piggy-bank.png',
  },
  {
    to: '/renta-fija-usd#renta-fija-usd',
    label: 'Renta Fija USD',
    icon: 'i-lucide-pie-chart',
    image: 'https://api.argentinadatos.com/static/comparatasas/icons/us-flag.png',
  },
  {
    to: '/mercado-dinero-usd#mercado-dinero-usd',
    label: 'Mercado Dinero USD',
    icon: 'i-lucide-pie-chart',
    image: 'https://api.argentinadatos.com/static/comparatasas/icons/us-bill.png',
  },
  {
    to: '/plazos-fijos#plazos-fijos',
    label: 'Plazos Fijos',
    icon: 'i-lucide-clock',
    image: 'https://api.argentinadatos.com/static/comparatasas/icons/safe.png',
  },
  {
    to: '/criptomonedas#rendimientos-crypto',
    label: 'Criptomonedas',
    icon: 'i-lucide-bitcoin',
    image: 'https://api.argentinadatos.com/static/comparatasas/icons/bitcoin.png',
  },
]

onMounted(() => {
  fetchAccounts()
  fetchFunds()
  fetchCrypto()
})
</script>

<template>
  <UApp>
    <div class="bg-neutral-50 dark:bg-neutral-950">
      <Background />

      <header
        class="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md"
      >
        <UContainer class="flex items-center justify-between h-12">
          <NuxtLink to="/" class="flex items-center gap-2">
            <span
              class="font-bold text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
            >
              comparatasas.ar
            </span>
          </NuxtLink>
          <ColorModeSwitch />
        </UContainer>
      </header>

      <main class="min-h-screen flex flex-col space-y-6 pt-16">
        <UContainer class="space-y-6">
          <div class="flex flex-col items-center text-center space-y-2">
            <h1 class="font-bold text-4xl sm:text-5xl text-neutral-900 dark:text-white">
              ¡Encontra <span class="text-primary-600">las mejores inversiones</span> para vos!
            </h1>
            <p class="text-neutral-600 dark:text-neutral-400">
              Compará tasas de plazos fijos, fondos comunes de inversión y rendimientos crypto.
            </p>
          </div>

          <Ads />

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

          <DisclaimerSection :page="route.name" />
        </UContainer>
      </main>

      <USeparator type="dashed" class="h-px mt-6" />

      <footer class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
        <div class="flex flex-col items-start gap-2">
          <p class="text-sm text-muted font-semibold">Open Source</p>
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

        <div class="flex flex-col gap-2"></div>

        <div class="flex flex-col md:items-end gap-2">
          <FriendlyPages />
        </div>
      </footer>
    </div>
  </UApp>
</template>

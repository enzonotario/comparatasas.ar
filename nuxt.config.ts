// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-gtag',
    '@vite-pwa/nuxt',
    '@nuxtjs/sitemap',
  ],
  ssr: false,
  devtools: { enabled: true },

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      titleTemplate: '%s | comparatasas.ar',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },

  css: ['@/assets/css/globals.css'],

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },

  site: {
    url: 'https://comparatasas.ar',
    name: 'comparatasas.ar',
  },

  compatibilityDate: '2025-07-15',

  nitro: {
    preset: 'cloudflare_pages',
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  gtag: {
    id: 'G-MVDC98G0E2',
  },

  pwa: {
    selfDestroying: true,
  },

  sitemap: {
    urls: () => {
      return ['https://comparatasas.ar/']
    },
  },
})

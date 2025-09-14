// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@vueuse/nuxt', 'nuxt-gtag', '@vite-pwa/nuxt'],
  ssr: false,
  devtools: { enabled: true },

  // Set baseURL for GitHub Pages when deploying under a subpath
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
  },

  css: ['@/assets/css/globals.css'],

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
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
})

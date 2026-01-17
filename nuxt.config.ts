// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-gtag',
    '@vite-pwa/nuxt',
    '@nuxtjs/sitemap',
    'nuxt-module-hotjar',
    'nuxt-echarts',
  ],
  ssr: false,
  devtools: { enabled: true },

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: {
        lang: 'es-AR',
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Compara Tasas - Encuentra las mejores inversiones en Argentina',
      titleTemplate: '%s | comparatasas.ar',
      meta: [
        {
          name: 'description',
          content:
            'Compara tasas de plazos fijos, fondos comunes de inversión, cuentas remuneradas y rendimientos crypto en Argentina. Encuentra la mejor inversión para tu dinero.',
        },
        { name: 'application-name', content: 'Compara Tasas' },
        { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#111827', media: '(prefers-color-scheme: dark)' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'comparatasas.ar' },
        { property: 'og:locale', content: 'es_AR' },
        { property: 'og:url', content: 'https://comparatasas.ar' },
        {
          property: 'og:title',
          content: 'Compara Tasas - Encuentra las mejores inversiones en Argentina',
        },
        {
          property: 'og:description',
          content:
            'Compara tasas de plazos fijos, fondos comunes de inversión, cuentas remuneradas y rendimientos crypto en Argentina. Encuentra la mejor inversión para tu dinero.',
        },
        { property: 'og:image', content: 'https://comparatasas.ar/meta-imagen.png' },
        {
          property: 'og:image:alt',
          content: 'Compara Tasas - Encuentra las mejores inversiones en Argentina',
        },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://comparatasas.ar/meta-imagen.png' },
        {
          name: 'twitter:image:alt',
          content: 'Compara Tasas - Encuentra las mejores inversiones en Argentina',
        },
        { name: 'twitter:site', content: '@comparatasas' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://api.argentinadatos.com' },
        { rel: 'preconnect', href: 'https://api.iconify.design' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cal+Sans&display=swap',
        },
      ],
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
    prerender: {
      crawlLinks: false,
    },
    minify: true,
  },

  echarts: {
    charts: ['LineChart'],
    components: ['GridComponent', 'TooltipComponent'],
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  gtag: {
    id: 'G-MVDC98G0E2',
  },

  hotjar: {
    hotjarId: 6522567,
    scriptVersion: 6,
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

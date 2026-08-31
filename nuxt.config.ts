// https://nuxt.com/docs/api/configuration/nuxt-config
import { getPrerenderRoutes } from './app/lib/prerender-routes'
import { jsonLdScript, siteOrganization } from './app/lib/json-ld'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-gtag',
    '@vite-pwa/nuxt',
    '@nuxtjs/sitemap',
    'nuxt-module-hotjar',
    'nuxt-highcharts',
    'nuxt-echarts',
    'nuxt-og-image',
  ],
  ssr: true,
  devtools: { enabled: true },

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: {
        lang: 'es-AR',
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Compara Tasas - La mejor inversión para vos',
      titleTemplate: '%s | comparatasas.ar',
      meta: [
        {
          name: 'description',
          content:
            'Compara tasas de plazos fijos, fondos comunes de inversión, cuentas remuneradas y rendimientos crypto en Argentina. Encontrá la mejor inversión para vos.',
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
          content: 'Compara Tasas - La mejor inversión para vos',
        },
        {
          property: 'og:description',
          content:
            'Compara tasas de plazos fijos, fondos comunes de inversión, cuentas remuneradas y rendimientos crypto en Argentina. Encontrá la mejor inversión para vos.',
        },
        { property: 'og:image', content: 'https://comparatasas.ar/meta-imagen.png' },
        {
          property: 'og:image:alt',
          content: 'Compara Tasas - La mejor inversión para vos',
        },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://comparatasas.ar/meta-imagen.png' },
        {
          name: 'twitter:image:alt',
          content: 'Compara Tasas - La mejor inversión para vos',
        },
        { name: 'twitter:site', content: '@comparatasas' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'llms', href: '/llms.txt' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://api.argentinadatos.com' },
        { rel: 'preconnect', href: 'https://api.iconify.design' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cal+Sans&display=swap',
        },
      ],
      script: [jsonLdScript(siteOrganization)],
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

  runtimeConfig: {
    public: {
      showProductScenarios: false,
    },
  },

  compatibilityDate: '2025-07-15',

  nitro: {
    preset: 'cloudflare_pages',
    prerender: {
      // Solo rutas explícitas (fondos curados + páginas estáticas). crawlLinks
      // expandía hermanos del catálogo a ~700+ /fondos/* y ~9 min de generate.
      // `/` se sirve por el Worker (SSR) para poder negociar Accept: text/markdown.
      crawlLinks: false,
      concurrency: 16,
      failOnError: false,
      routes: [
        // Trust + home stay on the Worker so Accept: text/markdown can negotiate.
        '/metodologia',
        '/cuentas-billeteras',
        '/cuentas-billeteras/graficos',
        '/plazos-fijos',
        '/plazos-fijos/uva-pago-periodico',
        '/plazos-fijos/uva-precancelable',
        '/fondos',
        '/fondos/mercado',
        '/usd',
        '/criptomonedas',
        '/criptopesos',
        '/creditos-hipotecarios-uva',
        '/creditos-hipotecarios-uva/uva-dolar',
        '/creditos-hipotecarios-uva/simulador',
        '/prestamos-personales',
        '/prestamos-personales/bcra',
        '/comisiones-cobro',
        '/comisiones-brokers',
        '/contado-cuotas',
        '/remesas',
        '/lecaps',
        '/cauciones',
        '/bonos-cer',
        '/sumarse',
      ],
    },
    minify: true,
  },

  hooks: {
    async 'nitro:config'(nitroConfig) {
      nitroConfig.prerender = nitroConfig.prerender || {}
      const existing = Array.isArray(nitroConfig.prerender.routes)
        ? nitroConfig.prerender.routes
        : []
      nitroConfig.prerender.routes = [...new Set([...existing, ...(await getPrerenderRoutes())])]
    },
  },

  echarts: {
    charts: ['LineChart', 'BarChart', 'PieChart'],
    components: ['GridComponent', 'TooltipComponent', 'LegendComponent', 'DataZoomComponent'],
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  gtag: {
    id: 'G-MVDC98G0E2',
  },

  highcharts: {
    exporting: true,
  },

  hotjar: {
    hotjarId: 6522567,
    scriptVersion: 6,
  },

  pwa: {
    selfDestroying: true,
  },

  sitemap: {
    urls: async () => {
      const base = 'https://comparatasas.ar'
      // Solo rutas que realmente prerenderizamos (crawlLinks off).
      // Listar los ~4700 FCI del catálogo generaba URLs sin HTML estático.
      const { getPrerenderRoutes } = await import('./app/lib/prerender-routes')
      const routes = await getPrerenderRoutes()
      return routes.map((path) => `${base}${path === '/' ? '/' : path}`)
    },
  },
})

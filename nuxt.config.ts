// https://nuxt.com/docs/api/configuration/nuxt-config
import { getPrerenderRoutes } from './app/lib/prerender-routes'

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
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://api.argentinadatos.com' },
        { rel: 'preconnect', href: 'https://api.iconify.design' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cal+Sans&display=swap',
        },
      ],
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Compara Tasas',
            url: 'https://comparatasas.ar',
            logo: 'https://comparatasas.ar/icons/icon-512x512.png',
            sameAs: ['https://x.com/comparatasas'],
          }),
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

  runtimeConfig: {
    public: {
      showProductScenarios: false,
    },
  },

  compatibilityDate: '2025-07-15',

  nitro: {
    preset: 'cloudflare_pages',
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: [
        '/',
        '/cuentas-billeteras',
        '/cuentas-billeteras/graficos',
        '/plazos-fijos',
        '/plazos-fijos/uva-pago-periodico',
        '/plazos-fijos/uva-precancelable',
        '/fondos',
        '/usd',
        '/criptomonedas',
        '/criptopesos',
        '/creditos-hipotecarios-uva',
        '/contado-cuotas',
        '/remesas',
        '/lecaps',
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
      const urls: string[] = [base + '/']

      const slugify = (name: string): string =>
        name
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')

      try {
        const res = await fetch('https://api.argentinadatos.com/v1/finanzas/fci/fondos')
        const data = (await res.json()) as { fondos: Array<{ nombre: string }> }
        for (const fondo of data.fondos) {
          urls.push(`${base}/fondos/${slugify(fondo.nombre)}`)
        }
      } catch {}

      return urls
    },
  },
})

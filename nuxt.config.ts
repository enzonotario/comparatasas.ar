// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'
import {
  AGENT_NEGOTIATED_ROUTES,
  getPublicRoutes,
  getStaticPrerenderRoutes,
} from './app/lib/agent-routes'
import { readCategoryIconVersions } from './app/lib/category-icons'
import { CATEGORY_ICON_MAX_AGE } from './app/lib/category-icon-url'
import { getPrerenderRoutes } from './app/lib/prerender-routes'
import { jsonLdScript, siteOrganization } from './app/lib/json-ld'

const categoryIconsDir = fileURLToPath(new URL('./public/assets/icons', import.meta.url))
// `nuxt build` fija NODE_ENV=production antes de cargar este archivo.
const categoryIconVersions = readCategoryIconVersions(
  categoryIconsDir,
  process.env.NODE_ENV === 'production',
)
// Coolify Dockerfile sets NITRO_PRESET=bun. Cloudflare Pages keeps the default.
const isBunPreset = process.env.NITRO_PRESET === 'bun'
// `isr` is platform-specific (Vercel/Netlify). Bun needs Nitro `swr` cache.
const FONDOS_SWR_SECONDS = 60 * 60
// Market data (cauciones, LECAPs, USD, ...) changes during the day.
const DATA_SWR_SECONDS = 5 * 60
// Content-only pages: safe to freeze at build time.
const STATIC_CONTENT_PREFIXES = ['/metodologia/', '/sumarse/']
const isStaticContentRoute = (route: string) =>
  STATIC_CONTENT_PREFIXES.some((prefix) => route.startsWith(prefix))
// Under Bun, prerendered HTML would keep build-time data until the next deploy.
// Render data pages at runtime instead and cache them with SWR.
const bunDataRouteRules = Object.fromEntries(
  getStaticPrerenderRoutes()
    .filter((route) => !isStaticContentRoute(route) && !route.startsWith('/fondos'))
    .map((route) => [route, { prerender: false, swr: DATA_SWR_SECONDS }]),
)

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-gtag',
    '@vite-pwa/nuxt',
    '@nuxtjs/sitemap',
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
      categoryIconVersions,
      opinaUrl: process.env.NUXT_PUBLIC_OPINA_URL || 'https://opina.enzonotario.me',
      opinaKey: process.env.NUXT_PUBLIC_OPINA_KEY || 'pk_ukf7rlillrzg7io6',
    },
  },
  routeRules: {
    ...Object.fromEntries(
      AGENT_NEGOTIATED_ROUTES.map((route) => [route, { prerender: false }]),
    ),
    // Coolify Bun: no prerender ~110 /fondos/* at build (OOM risk on 8GB hosts).
    // Cache HTML with Nitro SWR instead of platform `isr`.
    ...(isBunPreset
      ? {
          ...bunDataRouteRules,
          '/fondos': { prerender: false, swr: FONDOS_SWR_SECONDS },
          '/fondos/**': { prerender: false, swr: FONDOS_SWR_SECONDS },
        }
      : {}),
  },

  compatibilityDate: '2025-07-15',

  // Coolify/Docker sets NITRO_PRESET=bun. Cloudflare Pages keeps the default.
  nitro: {
    preset: process.env.NITRO_PRESET || 'cloudflare_pages',
    // Carpeta aparte de `public/` para que Pages la sirva como asset estático
    // (fuera del Worker) y Nitro escriba Cache-Control en `dist/_headers`.
    // El query `?v=` es el hash del archivo: un icono igual conserva la URL;
    // un icono nuevo obtiene otra URL. Por eso `immutable` es seguro.
    // https://developers.cloudflare.com/pages/configuration/headers/
    publicAssets:
      process.env.NODE_ENV === 'production'
        ? [
            {
              baseURL: '/assets/icons',
              dir: categoryIconsDir,
              maxAge: CATEGORY_ICON_MAX_AGE,
            },
          ]
        : [],
    // Cloudflare Pages: `_routes.json` is capped at 100 rules and Nitro truncates
    // its auto-generated excludes, which drops these prerendered JSON files and
    // routes them to the Worker. Explicit excludes are kept first, so Pages
    // serves them as static assets.
    cloudflare: isBunPreset
      ? undefined
      : {
          pages: {
            routes: {
              exclude: [
                '/api/fci/catalog.json',
                '/api/fci/market-overview.json',
                '/api/fci/nominal-tna.json',
                '/api/fci/types.json',
              ],
            },
          },
        },
    prerender: {
      // Las rutas negociadas quedan fuera y llegan al Worker. crawlLinks expandía
      // hermanos del catálogo a ~700+ /fondos/* y ~9 min de generate.
      crawlLinks: false,
      // Bun/Coolify builds share a small host with other apps; keep concurrency low.
      concurrency: isBunPreset ? 4 : 16,
      failOnError: false,
      routes: [],
    },
    // Route-rule SWR and defineCachedEventHandler write to the `cache:` mount
    // (Nitro runtime/internal/cache.mjs, base "/cache"). Under Bun it would be
    // in-memory and grow with every `/fondos?...` query variant, so keep it on
    // disk. Relative base resolves against the runtime cwd (`/app` in Docker).
    storage: isBunPreset
      ? { cache: { driver: 'fsLite', base: './.data/cache' } }
      : {},
    minify: true,
  },

  hooks: {
    async 'nitro:config'(nitroConfig) {
      nitroConfig.prerender = nitroConfig.prerender || {}
      const existing = Array.isArray(nitroConfig.prerender.routes)
        ? nitroConfig.prerender.routes
        : []
      let routes = await getPrerenderRoutes()
      if (isBunPreset) {
        routes = routes.filter(isStaticContentRoute)
      } else {
        // Cloudflare Pages: emit the FCI JSON endpoints as static assets so the
        // Worker never parses the ~31 MB upstream catalog. Bun keeps them fresh
        // via the runtime cache instead.
        routes = [
          ...routes,
          '/api/fci/catalog.json',
          '/api/fci/market-overview.json',
          '/api/fci/nominal-tna.json',
          '/api/fci/types.json',
        ]
      }
      nitroConfig.prerender.routes = [...new Set([...existing, ...routes])]
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

  // Dentro de node_modules/.cache/nuxt (allow-list de Cloudflare Pages build cache).
  // El default (nuxt-seo/og-image) no se restaura entre deploys.
  ogImage: {
    buildCache: {
      base: 'node_modules/.cache/nuxt/og-image',
    },
  },

  pwa: {
    selfDestroying: true,
  },

  sitemap: {
    urls: () => {
      const base = 'https://comparatasas.ar'
      // Unión de páginas SSR negociadas y catálogo prerenderizado.
      const routes = getPublicRoutes()
      return routes.map((path) => `${base}${path === '/' ? '/' : path}`)
    },
  },
})

import type { RouterConfig } from '@nuxt/schema'

export default {
  routes: (_routes) => [
    {
      name: 'home',
      path: '/',
      component: () => import('~/pages/cuentas-billeteras.vue'),
    },
    ..._routes,
  ],
} satisfies RouterConfig

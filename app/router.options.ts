import type { RouterConfig } from '@nuxt/schema'

export default {
  routes: (_routes) => [
    {
      name: 'home',
      path: '/',
      component: () => import('~/pages/cuentas-billeteras/index.vue'),
      meta: {
        pageTitle: 'Cuentas Remuneradas y Billeteras Digitales',
        pageDescription:
          'Compará los rendimientos actualizados de las principales billeteras digitales y cuentas remuneradas de Argentina.',
      },
    },
    ..._routes,
  ],
} satisfies RouterConfig

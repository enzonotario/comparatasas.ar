export default defineNuxtRouteMiddleware((to) => {
  if (to.query.tab) {
    const tabId = to.query.tab as string

    const tabToRouteMapping: Record<string, string> = {
      accounts: '/cuentas-billeteras',
      funds: '/cuentas-billeteras#rendimiento-variable',
      usd: '/mercado-dinero-usd',
      'usd-funds': '/renta-fija-usd',
      'usd-money-market': '/mercado-dinero-usd',
      fixed: '/plazos-fijos',
      crypto: '/criptomonedas',
    }

    const newRoute = tabToRouteMapping[tabId]

    if (newRoute) {
      return navigateTo(newRoute, {
        redirectCode: 301,
        replace: true,
      })
    }
  }
})

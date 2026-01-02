export default defineNuxtRouteMiddleware((to) => {
  // Redirecciones de páginas antiguas a nueva página unificada /usd
  if (to.path === '/renta-fija-usd' || to.path === '/mercado-dinero-usd') {
    return navigateTo('/usd', {
      redirectCode: 301,
      replace: true,
    })
  }

  if (to.query.tab) {
    const tabId = to.query.tab as string

    const tabToRouteMapping: Record<string, string> = {
      accounts: '/cuentas-billeteras',
      funds: '/cuentas-billeteras#rendimiento-variable',
      usd: '/usd',
      'usd-funds': '/usd',
      'usd-money-market': '/usd',
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

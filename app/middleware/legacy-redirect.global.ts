function tabQueryFirst(tab: unknown): string | undefined {
  if (typeof tab === 'string') return tab
  if (Array.isArray(tab) && typeof tab[0] === 'string') return tab[0]
  return undefined
}

export default defineNuxtRouteMiddleware((to) => {
  // Legacy: PF UVA pago periódico vivía en ?tab=uvaPeriodico (producción)
  const plazosPath = to.path.replace(/\/$/, '') || '/'
  if (plazosPath === '/plazos-fijos' && tabQueryFirst(to.query.tab) === 'uvaPeriodico') {
    return navigateTo('/plazos-fijos/uva-pago-periodico', {
      redirectCode: 301,
      replace: true,
    })
  }

  // Redireccionar /cuentas-billeteras a / para evitar duplicados
  if (to.path === '/cuentas-billeteras' || to.path === '/cuentas-billeteras/') {
    return navigateTo('/', {
      redirectCode: 301,
      replace: true,
    })
  }

  // Redirecciones de páginas antiguas a nueva página unificada /usd
  if (to.path === '/renta-fija-usd' || to.path === '/mercado-dinero-usd') {
    return navigateTo('/usd', {
      redirectCode: 301,
      replace: true,
    })
  }

  if (to.path === '/criptopesos' || to.path === '/criptopesos/') {
    return navigateTo('/criptomonedas', {
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

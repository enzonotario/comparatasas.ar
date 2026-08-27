function tabQueryFirst(tab: unknown): string | undefined {
  if (typeof tab === 'string') return tab
  if (Array.isArray(tab) && typeof tab[0] === 'string') return tab[0]
  return undefined
}

function queryWithoutTab(query: Record<string, unknown>): Record<string, string | string[]> {
  const next: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(query)) {
    if (key === 'tab') continue
    if (typeof value === 'string' || Array.isArray(value)) {
      next[key] = value
    }
  }
  return next
}

function redirectDroppingTab(path: string, query: Record<string, unknown>) {
  const rest = queryWithoutTab(query)
  return navigateTo(
    { path, query: rest },
    {
      redirectCode: 301,
      replace: true,
    },
  )
}

export default defineNuxtRouteMiddleware((to) => {
  const path = to.path.replace(/\/$/, '') || '/'

  // Legacy: PF UVA pago periódico vivía en ?tab=uvaPeriodico (producción)
  if (path === '/plazos-fijos' && tabQueryFirst(to.query.tab) === 'uvaPeriodico') {
    return redirectDroppingTab('/plazos-fijos/uva-pago-periodico', to.query)
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

  const tab = tabQueryFirst(to.query.tab)
  if (!tab) return

  // Hipotecarios UVA: ?tab= → rutas hermanas (preserva ?dolar=)
  if (path === '/creditos-hipotecarios-uva') {
    if (tab === 'uva-dolar') {
      return redirectDroppingTab('/creditos-hipotecarios-uva/uva-dolar', to.query)
    }
    if (tab === 'simulador') {
      return redirectDroppingTab('/creditos-hipotecarios-uva/simulador', to.query)
    }
    // tasas / inválido → index sin tab
    return redirectDroppingTab('/creditos-hipotecarios-uva', to.query)
  }

  // Préstamos personales
  if (path === '/prestamos-personales') {
    if (tab === 'bcra') {
      return redirectDroppingTab('/prestamos-personales/bcra', to.query)
    }
    // plazo / ranking / inválido → index
    return redirectDroppingTab('/prestamos-personales', to.query)
  }

  // Metodología
  if (path === '/metodologia') {
    if (tab === 'cuentas') {
      return redirectDroppingTab('/metodologia', to.query)
    }
    return redirectDroppingTab(`/metodologia/${tab}`, to.query)
  }

  // Sumarse
  if (path === '/sumarse') {
    if (tab === 'plazos-fijos') {
      return redirectDroppingTab('/sumarse', to.query)
    }
    return redirectDroppingTab(`/sumarse/${tab}`, to.query)
  }

  // Detalle FCI: /fondos/:slug?tab=historico → /fondos/:slug/historico (preserva periodo)
  const fondosMatch = path.match(/^\/fondos\/([^/]+)$/)
  if (fondosMatch && tab === 'historico') {
    return redirectDroppingTab(`/fondos/${fondosMatch[1]}/historico`, to.query)
  }
  if (fondosMatch && tab === 'resumen') {
    return redirectDroppingTab(path, to.query)
  }

  // Legacy home tabs (cuenta antigua con ?tab= en /)
  const tabToRouteMapping: Record<string, string> = {
    accounts: '/cuentas-billeteras',
    funds: '/cuentas-billeteras#rendimiento-variable',
    usd: '/usd',
    'usd-funds': '/usd',
    'usd-money-market': '/usd',
    fixed: '/plazos-fijos',
    crypto: '/criptomonedas',
  }

  const newRoute = tabToRouteMapping[tab]
  if (newRoute) {
    return navigateTo(newRoute, {
      redirectCode: 301,
      replace: true,
    })
  }
})

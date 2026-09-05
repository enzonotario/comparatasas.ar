export interface NavigationPage {
  to: string
  label: string
  icon: string
  image: string
  /** Agrupa opciones en el panel de subnavegación (desktop/mobile). */
  group?: string
}

export interface NavigationPageGroup {
  id: string
  label: string
  pages: NavigationPage[]
}

export interface NavigationCategory {
  id: string
  label: string
  ariaLabel: string
  icon: string | 'flag-ars' | 'flag-usd' | 'bitcoin'
  pages: NavigationPage[]
}

function slugifyGroupLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function groupNavigationPages(pages: NavigationPage[]): NavigationPageGroup[] {
  const groups: NavigationPageGroup[] = []
  const byLabel = new Map<string, NavigationPageGroup>()

  for (const page of pages) {
    const label = page.group?.trim() || 'Otros'
    let group = byLabel.get(label)
    if (!group) {
      group = { id: slugifyGroupLabel(label), label, pages: [] }
      byLabel.set(label, group)
      groups.push(group)
    }
    group.pages.push(page)
  }

  return groups
}

function getPagePath(to: string): string {
  const i = to.indexOf('?')
  return i === -1 ? to : to.slice(0, i)
}

function getPageQuery(to: string): URLSearchParams {
  const i = to.indexOf('?')
  return new URLSearchParams(i === -1 ? '' : to.slice(i + 1))
}

function normalizeNavigationAlias(path: string): string {
  const trimmed = path.replace(/\/$/, '') || '/'
  if (trimmed.startsWith('/plazos-fijos/')) return '/plazos-fijos'
  if (trimmed.startsWith('/creditos-hipotecarios-uva/')) return '/creditos-hipotecarios-uva'
  if (trimmed.startsWith('/prestamos-personales/')) return '/prestamos-personales'
  if (trimmed.startsWith('/comisiones-brokers/')) return '/comisiones-brokers'
  return trimmed
}

export const useNavigationPages = () => {
  const route = useRoute()

  // Normaliza: sin barra final; '/' → '/cuentas-billeteras'
  const normalizeRoute = (routePath: string): string => {
    const aliased = normalizeNavigationAlias(routePath)
    return aliased === '/' ? '/cuentas-billeteras' : aliased
  }

  const isPageActive = (page: NavigationPage): boolean => {
    const normalizedPath = normalizeRoute(route.path)
    const pagePath = normalizeRoute(getPagePath(page.to))
    if (pagePath !== normalizedPath) return false

    // /cauciones vive en ARS y USD: el query `moneda` distingue la entrada activa.
    if (pagePath === '/cauciones') {
      const pageMoneda = getPageQuery(page.to).get('moneda') === 'usd' ? 'usd' : 'ars'
      const routeMoneda = route.query.moneda === 'usd' ? 'usd' : 'ars'
      return pageMoneda === routeMoneda
    }

    return true
  }

  const categories: NavigationCategory[] = [
    {
      id: 'ars',
      label: 'ARS',
      ariaLabel:
        'ARS — comparadores en pesos: cuentas y billeteras, plazos fijos, contado vs cuotas, LECAPs, cauciones, bonos CER, créditos hipotecarios UVA, préstamos personales y comisiones',
      icon: 'flag-ars',
      pages: [
        {
          to: '/cuentas-billeteras',
          label: 'Cuentas y Billeteras',
          icon: 'i-lucide-wallet',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/wallet.png',
          group: 'Inversión',
        },
        {
          to: '/plazos-fijos',
          label: 'Plazos Fijos',
          icon: 'i-lucide-clock',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/safe.png',
          group: 'Inversión',
        },
        {
          to: '/criptopesos',
          label: 'Criptopesos',
          icon: 'i-lucide-coins',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/criptopesos.png',
          group: 'Inversión',
        },
        {
          to: '/cauciones',
          label: 'Cauciones',
          icon: 'i-lucide-handshake',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/cauciones.png',
          group: 'Mercado',
        },
        {
          to: '/lecaps',
          label: 'LECAPs',
          icon: 'i-lucide-banknote',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/letras.png',
          group: 'Mercado',
        },
        {
          to: '/bonos-cer',
          label: 'Bonos CER',
          icon: 'i-lucide-trending-up',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/safe.png',
          group: 'Mercado',
        },
        {
          to: '/creditos-hipotecarios-uva',
          label: 'Créditos Hipotecarios UVA',
          icon: 'i-lucide-home',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/credito-hipotecario.png',
          group: 'Crédito',
        },
        {
          to: '/prestamos-personales',
          label: 'Préstamos Personales',
          icon: 'i-lucide-banknote',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/credito-personal.png',
          group: 'Crédito',
        },
        {
          to: '/comisiones-cobro',
          label: 'Comisiones de cobro',
          icon: 'i-lucide-receipt',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/cobros.png',
          group: 'Costos y herramientas',
        },
        {
          to: '/comisiones-brokers',
          label: 'Comisiones de brokers',
          icon: 'i-lucide-briefcase-business',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/brokers.png',
          group: 'Costos y herramientas',
        },
        {
          to: '/contado-cuotas',
          label: 'Contado vs Cuotas',
          icon: 'i-lucide-credit-card',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/cuotas.png',
          group: 'Costos y herramientas',
        },
      ],
    },
    {
      id: 'usd',
      label: 'USD',
      ariaLabel: 'USD — comparadores en dólares estadounidenses',
      icon: 'flag-usd',
      pages: [
        {
          to: '/usd',
          label: 'Inversiones en USD',
          icon: 'i-lucide-dollar-sign',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/us-flag.png',
          group: 'USD',
        },
        {
          to: '/cauciones?moneda=usd',
          label: 'Cauciones',
          icon: 'i-lucide-handshake',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/us-flag.png',
          group: 'USD',
        },
        {
          to: '/remesas',
          label: 'Remesas',
          icon: 'i-lucide-send',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/wallet.png',
          group: 'USD',
        },
      ],
    },
    {
      id: 'crypto',
      label: 'Criptos',
      ariaLabel: 'Criptos — comparador de criptomonedas',
      icon: 'bitcoin',
      pages: [
        {
          to: '/criptomonedas',
          label: 'Criptomonedas',
          icon: 'i-lucide-bitcoin',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/bitcoin.png',
        },
      ],
    },
  ]

  // Páginas planas para compatibilidad con código existente
  const pages: NavigationPage[] = categories.flatMap((category) => category.pages)

  const getCurrentCategory = (): NavigationCategory | null => {
    return categories.find((category) => category.pages.some((page) => isPageActive(page))) ?? null
  }

  const getCurrentPage = (): NavigationPage | null => {
    return pages.find((page) => isPageActive(page)) ?? null
  }

  const getCategoryByRoute = (routePath: string): NavigationCategory | null => {
    // Prefer active page (incluye query moneda en /cauciones); fallback por path.
    const active = getCurrentCategory()
    if (active && normalizeRoute(route.path) === normalizeRoute(routePath)) {
      return active
    }
    const normalizedPath = normalizeRoute(routePath)
    return (
      categories.find((category) =>
        category.pages.some((page) => normalizeRoute(getPagePath(page.to)) === normalizedPath),
      ) ?? null
    )
  }

  const getCurrentIndex = () => {
    return pages.findIndex((page) => isPageActive(page))
  }

  const getPreviousPage = (): NavigationPage | null => {
    const normalizedRoute = normalizeRoute(route.path)
    const currentCategory = getCategoryByRoute(normalizedRoute)
    if (!currentCategory) return null

    const categoryPages = currentCategory.pages
    const currentIndex = categoryPages.findIndex((page) => isPageActive(page))
    const prevIndex = currentIndex - 1

    if (prevIndex >= 0) {
      return categoryPages[prevIndex] ?? null
    }

    // Si no hay página anterior en la categoría, buscar en la categoría anterior
    const currentCategoryIndex = categories.findIndex((cat) => cat.id === currentCategory.id)
    if (currentCategoryIndex > 0) {
      const prevCategory = categories[currentCategoryIndex - 1]
      if (prevCategory && prevCategory.pages.length > 0) {
        return prevCategory.pages[prevCategory.pages.length - 1] ?? null
      }
    }

    return null
  }

  const getNextPage = (): NavigationPage | null => {
    const normalizedRoute = normalizeRoute(route.path)
    const currentCategory = getCategoryByRoute(normalizedRoute)
    if (!currentCategory) return null

    const categoryPages = currentCategory.pages
    const currentIndex = categoryPages.findIndex((page) => isPageActive(page))
    const nextIndex = currentIndex + 1

    if (nextIndex < categoryPages.length) {
      return categoryPages[nextIndex] ?? null
    }

    // Si no hay página siguiente en la categoría, buscar en la siguiente categoría
    const currentCategoryIndex = categories.findIndex((cat) => cat.id === currentCategory.id)
    if (currentCategoryIndex < categories.length - 1) {
      const nextCategory = categories[currentCategoryIndex + 1]
      if (nextCategory && nextCategory.pages.length > 0) {
        return nextCategory.pages[0] ?? null
      }
    }

    return null
  }

  const isActive = (page: NavigationPage): boolean => isPageActive(page)

  const isCategoryActive = (category: NavigationCategory, currentRoute: string): boolean => {
    if (normalizeRoute(currentRoute) === normalizeRoute(route.path)) {
      return category.pages.some((page) => isPageActive(page))
    }
    const normalizedRoute = normalizeRoute(currentRoute)
    return category.pages.some((page) => normalizeRoute(getPagePath(page.to)) === normalizedRoute)
  }

  return {
    categories,
    pages,
    getCurrentCategory,
    getCurrentPage,
    getCategoryByRoute,
    getCurrentIndex,
    getPreviousPage,
    getNextPage,
    isActive,
    isCategoryActive,
  }
}

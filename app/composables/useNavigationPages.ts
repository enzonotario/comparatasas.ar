export interface NavigationPage {
  to: string
  label: string
  icon: string
  image: string
}

export interface NavigationCategory {
  id: string
  label: string
  ariaLabel: string
  icon: string | 'flag-ars' | 'flag-usd' | 'bitcoin'
  pages: NavigationPage[]
}

function getPagePath(to: string): string {
  const i = to.indexOf('?')
  return i === -1 ? to : to.slice(0, i)
}

function normalizeNavigationAlias(path: string): string {
  if (
    path === '/plazos-fijos/uva-pago-periodico' ||
    path === '/plazos-fijos/uva-precancelable'
  ) {
    return '/plazos-fijos'
  }
  return path
}

export const useNavigationPages = () => {
  const route = useRoute()

  // Normaliza: sin barra final; '/' → '/cuentas-billeteras'
  const normalizeRoute = (routePath: string): string => {
    const aliased = normalizeNavigationAlias(routePath)
    const trimmed = aliased.replace(/\/$/, '') || '/'
    return trimmed === '/' ? '/cuentas-billeteras' : trimmed
  }

  const isPageActive = (page: NavigationPage): boolean => {
    const normalizedPath = normalizeRoute(route.path)
    const pagePath = normalizeRoute(getPagePath(page.to))
    return pagePath === normalizedPath
  }

  const categories: NavigationCategory[] = [
    {
      id: 'ars',
      label: 'ARS',
      ariaLabel:
        'ARS — comparadores en pesos: cuentas y billeteras, plazos fijos, PF UVA pago periódico, PF UVA precancelable, LECAPs y créditos hipotecarios UVA',
      icon: 'flag-ars',
      pages: [
        {
          to: '/cuentas-billeteras',
          label: 'Cuentas y Billeteras',
          icon: 'i-lucide-wallet',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/wallet.png',
        },
        {
          to: '/plazos-fijos',
          label: 'Plazos Fijos',
          icon: 'i-lucide-clock',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/safe.png',
        },
        {
          to: '/lecaps',
          label: 'LECAPs',
          icon: 'i-lucide-banknote',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/letras.png',
        },
        {
          to: '/creditos-hipotecarios-uva',
          label: 'Créditos Hipotecarios UVA',
          icon: 'i-lucide-home',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/credito-hipotecario.png',
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
    const currentPath = normalizeRoute(route.path)
    return (
      categories.find((category) =>
        category.pages.some((page) => normalizeRoute(getPagePath(page.to)) === currentPath),
      ) ?? null
    )
  }

  const getCurrentPage = (): NavigationPage | null => {
    return pages.find((page) => isPageActive(page)) ?? null
  }

  const getCategoryByRoute = (routePath: string): NavigationCategory | null => {
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

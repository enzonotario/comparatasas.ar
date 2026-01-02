export interface NavigationPage {
  to: string
  label: string
  icon: string
  image: string
}

export interface NavigationCategory {
  id: string
  label: string
  icon: string | 'flag-ars' | 'flag-usd' | 'bitcoin'
  pages: NavigationPage[]
}

export const useNavigationPages = () => {
  const route = useRoute()

  // Normaliza la ruta: convierte '/' a '/cuentas-billeteras'
  const normalizeRoute = (routePath: string): string => {
    return routePath === '/' ? '/cuentas-billeteras' : routePath
  }

  const categories: NavigationCategory[] = [
    {
      id: 'ars',
      label: 'ARS',
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
          label: 'Plazo Fijo',
          icon: 'i-lucide-clock',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/safe.png',
        },
        {
          to: '/criptopesos',
          label: 'Criptopesos',
          icon: 'i-lucide-coins',
          image: 'https://api.argentinadatos.com/static/comparatasas/icons/criptopesos.png',
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
      categories.find((category) => category.pages.some((page) => page.to === currentPath)) ?? null
    )
  }

  const getCurrentPage = (): NavigationPage | null => {
    const currentPath = normalizeRoute(route.path)
    return pages.find((page) => page.to === currentPath) ?? null
  }

  const getCategoryByRoute = (routePath: string): NavigationCategory | null => {
    const normalizedPath = normalizeRoute(routePath)
    return (
      categories.find((category) => category.pages.some((page) => page.to === normalizedPath)) ??
      null
    )
  }

  const getCurrentIndex = (currentRoute: string) => {
    const normalizedRoute = normalizeRoute(currentRoute)
    return pages.findIndex((page) => page.to === normalizedRoute)
  }

  const getPreviousPage = (currentRoute: string): NavigationPage | null => {
    const normalizedRoute = normalizeRoute(currentRoute)
    const currentCategory = getCategoryByRoute(normalizedRoute)
    if (!currentCategory) return null

    const categoryPages = currentCategory.pages
    const currentIndex = categoryPages.findIndex((page) => page.to === normalizedRoute)
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

  const getNextPage = (currentRoute: string): NavigationPage | null => {
    const normalizedRoute = normalizeRoute(currentRoute)
    const currentCategory = getCategoryByRoute(normalizedRoute)
    if (!currentCategory) return null

    const categoryPages = currentCategory.pages
    const currentIndex = categoryPages.findIndex((page) => page.to === normalizedRoute)
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

  const isActive = (page: NavigationPage, currentRoute: string): boolean => {
    const normalizedRoute = normalizeRoute(currentRoute)
    return page.to === normalizedRoute
  }

  const isCategoryActive = (category: NavigationCategory, currentRoute: string): boolean => {
    const normalizedRoute = normalizeRoute(currentRoute)
    return category.pages.some((page) => page.to === normalizedRoute)
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

export interface NavigationPage {
  to: string
  label: string
  icon: string
  image: string
}

export const useNavigationPages = () => {
  const pages: NavigationPage[] = [
    {
      to: '/cuentas-billeteras#rendimiento-garantizado',
      label: 'Cuentas y Billeteras',
      icon: 'i-lucide-wallet',
      image: 'https://api.argentinadatos.com/static/comparatasas/icons/wallet.png',
    },
    {
      to: '/renta-fija-usd#renta-fija-usd',
      label: 'Renta Fija USD',
      icon: 'i-lucide-pie-chart',
      image: 'https://api.argentinadatos.com/static/comparatasas/icons/us-flag.png',
    },
    {
      to: '/mercado-dinero-usd#mercado-dinero-usd',
      label: 'Mercado Dinero USD',
      icon: 'i-lucide-pie-chart',
      image: 'https://api.argentinadatos.com/static/comparatasas/icons/us-bill.png',
    },
    {
      to: '/plazos-fijos#plazos-fijos',
      label: 'Plazos Fijos',
      icon: 'i-lucide-clock',
      image: 'https://api.argentinadatos.com/static/comparatasas/icons/safe.png',
    },
    {
      to: '/criptomonedas#rendimientos-crypto',
      label: 'Criptomonedas',
      icon: 'i-lucide-bitcoin',
      image: 'https://api.argentinadatos.com/static/comparatasas/icons/bitcoin.png',
    },
    {
      to: '/criptopesos#criptopesos',
      label: 'Criptopesos',
      icon: 'i-lucide-coins',
      image: 'https://api.argentinadatos.com/static/comparatasas/icons/criptopesos.png',
    },
  ]

  const getCurrentIndex = (currentRoute: string) => {
    return pages.findIndex((page) => page.to.split('#')[0] === currentRoute)
  }

  const getPreviousPage = (currentRoute: string): NavigationPage | null => {
    const currentIndex = getCurrentIndex(currentRoute)
    const prevIndex = currentIndex - 1
    return prevIndex >= 0 ? (pages[prevIndex] ?? null) : null
  }

  const getNextPage = (currentRoute: string): NavigationPage | null => {
    const currentIndex = getCurrentIndex(currentRoute)
    const nextIndex = currentIndex > 0 ? currentIndex + 1 : 1
    return nextIndex < pages.length ? (pages[nextIndex] ?? null) : null
  }

  const isActive = (page: NavigationPage, currentRoute: string): boolean => {
    return page.to.split('#')[0] === currentRoute
  }

  return {
    pages,
    getCurrentIndex,
    getPreviousPage,
    getNextPage,
    isActive,
  }
}

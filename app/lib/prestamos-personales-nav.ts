export interface PrestamosPersonalesNavTab {
  to: string
  label: string
  icon: `i-lucide-${string}`
}

export const prestamosPersonalesNavTabs: PrestamosPersonalesNavTab[] = [
  { to: '/prestamos-personales', label: 'Por plazo', icon: 'i-lucide-calendar-range' },
  { to: '/prestamos-personales/bcra', label: 'Techos BCRA', icon: 'i-lucide-shield' },
]

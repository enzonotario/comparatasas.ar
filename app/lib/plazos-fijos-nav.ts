export interface PlazosFijosNavTab {
  to: string
  label: string
  icon: `i-lucide-${string}`
}

/** Orden canónico (tabs y búsqueda): tradicional → precancelable → pago periódico. */
export const plazosFijosNavTabs: PlazosFijosNavTab[] = [
  { to: '/plazos-fijos', label: 'Tradicional (30+ días)', icon: 'i-lucide-clock' },
  {
    to: '/plazos-fijos/uva-precancelable',
    label: 'UVA precancelable',
    icon: 'i-lucide-calendar-clock',
  },
  {
    to: '/plazos-fijos/uva-pago-periodico',
    label: 'UVA pago periódico',
    icon: 'i-lucide-calendar-range',
  },
]

export interface HipotecariosUVANavTab {
  to: string
  label: string
  icon: `i-lucide-${string}`
}

export const hipotecariosUVANavTabs: HipotecariosUVANavTab[] = [
  { to: '/creditos-hipotecarios-uva', label: 'Tasas', icon: 'i-lucide-percent' },
  { to: '/creditos-hipotecarios-uva/uva-dolar', label: 'UVA vs dólar', icon: 'i-lucide-chart-line' },
  { to: '/creditos-hipotecarios-uva/simulador', label: 'Simulador', icon: 'i-lucide-calculator' },
]

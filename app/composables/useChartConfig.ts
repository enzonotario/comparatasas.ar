export const CHART_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#14b8a6',
  '#f97316',
  '#84cc16',
]

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(value)
}

export function useChartTheme() {
  const colorMode = computed(() => useColorMode().value)

  const textColor = computed(() => (colorMode.value === 'dark' ? '#fff' : '#000'))
  const gridLineColor = computed(() => (colorMode.value === 'dark' ? '#333' : '#e5e5e5'))

  return {
    colorMode,
    textColor,
    gridLineColor,
  }
}

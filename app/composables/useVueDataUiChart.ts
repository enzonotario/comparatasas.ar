import type { Component } from 'vue'

export type VueDataUiLazyChart =
  | 'VueUiVerticalBar'
  | 'VueUiScatter'
  | 'VueUiXy'
  | 'VueUiHorizontalBar'

/**
 * Carga perezosa de un componente de vue-data-ui (evita SSR / HTMLElement en import estático).
 */
export function useVueDataUiChart(componentName: VueDataUiLazyChart) {
  const Chart = shallowRef<Component | null>(null)

  onMounted(async () => {
    const mod = await import('vue-data-ui')
    Chart.value = mod[componentName] as Component
  })

  return Chart
}

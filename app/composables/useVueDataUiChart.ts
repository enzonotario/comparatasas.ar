import type { Component } from 'vue'

const loadDonut = () => import('vue-data-ui/vue-ui-donut').then((module) => module.VueUiDonut)

/**
 * Carga perezosa de VueUiDonut (evita SSR / HTMLElement en un import estático).
 * El subpath `vue-data-ui/vue-ui-donut` deja el resto de la librería fuera del bundle.
 */
export function useVueDataUiDonut() {
  const Chart = shallowRef<Component | null>(null)

  onMounted(async () => {
    Chart.value = await loadDonut()
  })

  return Chart
}

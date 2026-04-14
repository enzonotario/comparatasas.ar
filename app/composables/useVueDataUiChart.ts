import type { Component } from 'vue'

export type VueDataUiLazyChart =
  | 'VueUiVerticalBar'
  | 'VueUiScatter'
  | 'VueUiXy'
  | 'VueUiHorizontalBar'
  | 'VueUiCirclePack'

const chartLoaders = {
  VueUiXy: () => import('vue-data-ui/vue-ui-xy').then((m) => m.VueUiXy),
  VueUiVerticalBar: () => import('vue-data-ui/vue-ui-vertical-bar').then((m) => m.VueUiVerticalBar),
  VueUiScatter: () => import('vue-data-ui/vue-ui-scatter').then((m) => m.VueUiScatter),
  VueUiHorizontalBar: () =>
    import('vue-data-ui/vue-ui-horizontal-bar').then((m) => m.VueUiHorizontalBar),
  VueUiCirclePack: () => import('vue-data-ui/vue-ui-circle-pack').then((m) => m.VueUiCirclePack),
} satisfies Record<VueDataUiLazyChart, () => Promise<Component>>

/**
 * Carga perezosa de un componente de vue-data-ui (evita SSR / HTMLElement en import estático).
 * Usa subpath `vue-data-ui/vue-ui-*` para que el bundle solo incluya ese chart.
 */
export function useVueDataUiChart(componentName: VueDataUiLazyChart) {
  const Chart = shallowRef<Component | null>(null)

  onMounted(async () => {
    Chart.value = await chartLoaders[componentName]()
  })

  return Chart
}

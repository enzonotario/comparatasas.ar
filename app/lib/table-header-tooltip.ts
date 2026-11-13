import { h, type VNode } from 'vue'
import UTooltip from '@nuxt/ui/components/Tooltip.vue'

/**
 * Envuelve el contenido de un encabezado corto de tabla en un tooltip que
 * muestra el nombre completo de la columna al pasar el mouse.
 *
 * Si no hay nombre largo, devuelve el contenido tal cual.
 */
export function withHeaderTooltip(content: VNode, fullLabel?: string | null): VNode {
  if (!fullLabel) return content
  return h(UTooltip, { text: fullLabel }, { default: () => content })
}

/**
 * Encabezado corto (sin orden) con tooltip del nombre completo de la columna.
 */
export function headerLabelWithTooltip(label: string, fullLabel?: string | null): VNode {
  return withHeaderTooltip(h('span', label), fullLabel)
}

import type { Ref } from 'vue'
import type { AccountHistoryItem } from '~/composables/useAccountHistory'

/** Ventana semántica del eje X, compartida por los dos gráficos. */
export type ChartDateWindow = { start: Date; end: Date }

export function filterHistoryWithTope(history: readonly AccountHistoryItem[]) {
  return history.filter((item) => item.tope != null && item.tope !== undefined)
}

/** Fecha de calendario del historial, sin corrimiento por zona horaria. */
export function parseHistoryDate(fecha: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha)
  if (!match) return new Date(fecha)
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

export function historyDateExtent(
  history: readonly AccountHistoryItem[],
): readonly [Date, Date] | null {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY

  for (const item of history) {
    const time = parseHistoryDate(item.fecha).getTime()
    if (!Number.isFinite(time)) continue
    if (time < min) min = time
    if (time > max) max = time
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  return [new Date(min), new Date(max)]
}

export function clampDateWindow(
  window: ChartDateWindow,
  extent: readonly [Date, Date],
): ChartDateWindow {
  const min = extent[0].getTime()
  const max = extent[1].getTime()
  const full = { start: new Date(min), end: new Date(max) }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return full
  if (max === min) return full

  const startTime = window.start.getTime()
  const endTime = window.end.getTime()
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return full
  }

  const start = Math.min(Math.max(startTime, min), max)
  const end = Math.min(Math.max(endTime, min), max)
  if (end <= start) return full
  return { start: new Date(start), end: new Date(end) }
}

/**
 * Ventana que deben mostrar ambos gráficos.
 * El historial completo define las fechas disponibles. Quitar filas sin tope
 * no cambia el significado: start y end siguen siendo esas fechas.
 */
export function resolveSharedZoomWindow(
  history: readonly AccountHistoryItem[],
  proposed: ChartDateWindow | null | undefined,
): ChartDateWindow | null {
  const extent = historyDateExtent(history)
  if (!extent) return null
  if (proposed == null) return { start: extent[0], end: extent[1] }
  return clampDateWindow(proposed, extent)
}

export function useAccountHistoryChartZoomSync(
  history: Ref<AccountHistoryItem[] | null | undefined>,
) {
  const proposedWindow = ref<ChartDateWindow | null>(null)

  watch(
    () => history.value?.length,
    () => {
      proposedWindow.value = null
    },
  )

  const zoomWindow = computed(() =>
    resolveSharedZoomWindow(history.value ?? [], proposedWindow.value),
  )

  function setZoomWindow(next: ChartDateWindow) {
    const resolved = resolveSharedZoomWindow(history.value ?? [], next)
    const current = zoomWindow.value
    if (
      current &&
      resolved &&
      current.start.getTime() === resolved.start.getTime() &&
      current.end.getTime() === resolved.end.getTime()
    ) {
      return
    }
    proposedWindow.value = resolved
  }

  return {
    zoomWindow,
    setZoomWindow,
  }
}

/**
 * El overlay de zoomX cubre el área del gráfico y el host borra el foco ahí.
 * Este listener corre después y vuelve a mostrar el tooltip en esa zona.
 */
export function useZoomPlotHover() {
  let detach: (() => void) | undefined

  function onRender(context: {
    container: HTMLElement
    interaction: {
      resolvePointer: (clientX: number, clientY: number) => unknown
      setControlledFocus: (target: unknown, options?: { source?: 'pointer' }) => void
    }
  }) {
    detach?.()

    const onPointerMove = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element) || !target.closest('[data-chart-zoom-surface]')) return
      context.interaction.setControlledFocus(
        context.interaction.resolvePointer(event.clientX, event.clientY),
        { source: 'pointer' },
      )
    }

    context.container.addEventListener('pointermove', onPointerMove)
    detach = () => context.container.removeEventListener('pointermove', onPointerMove)
  }

  onBeforeUnmount(() => detach?.())

  return { onRender }
}

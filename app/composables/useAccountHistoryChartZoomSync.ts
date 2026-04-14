import type { Ref } from 'vue'
import type { AccountHistoryItem } from '~/composables/useAccountHistory'

/** Rango de zoom en índices del eje X (end exclusivo, como en VueUiXy). */
export type ChartZoomRange = { start: number; end: number }

export function filterHistoryWithTope(history: AccountHistoryItem[]) {
  return history.filter((item) => item.tope != null && item.tope !== undefined)
}

export function clampZoomRange(range: ChartZoomRange, length: number): ChartZoomRange {
  if (length <= 0) return { start: 0, end: 0 }
  const start = Math.max(0, Math.min(range.start, length - 1))
  const end = Math.max(start + 1, Math.min(range.end, length))
  return { start, end }
}

/** Convierte rango canónico (historial completo) al subconjunto con tope. */
export function canonicalToTopeRange(
  history: AccountHistoryItem[],
  filtered: AccountHistoryItem[],
  start: number,
  end: number,
): ChartZoomRange {
  const n = history.length
  const m = filtered.length
  if (!n || !m) return { start: 0, end: Math.max(0, m) }

  const { start: s, end: e } = clampZoomRange({ start, end }, n)
  const startDate = history[s]!.fecha
  const lastHistIdx = e - 1
  const lastDate = history[Math.min(Math.max(lastHistIdx, 0), n - 1)]!.fecha

  let fStart = filtered.findIndex((f) => f.fecha >= startDate)
  if (fStart < 0) fStart = 0

  let fEnd = m
  for (let i = 0; i < m; i++) {
    if (filtered[i]!.fecha > lastDate) {
      fEnd = i
      break
    }
  }
  return clampZoomRange({ start: fStart, end: fEnd }, m)
}

/** Convierte rango del gráfico de tope a índices del historial completo. */
export function topeToCanonicalRange(
  history: AccountHistoryItem[],
  filtered: AccountHistoryItem[],
  fStart: number,
  fEnd: number,
): ChartZoomRange {
  const n = history.length
  const m = filtered.length
  if (!n) return { start: 0, end: 0 }
  if (!m) return { start: 0, end: n }

  const { start: fs, end: fe } = clampZoomRange({ start: fStart, end: fEnd }, m)
  const startDate = filtered[fs]!.fecha
  const lastIdx = fe - 1
  const lastDate = filtered[Math.min(Math.max(lastIdx, 0), m - 1)]!.fecha

  let cStart = history.findIndex((h) => h.fecha >= startDate)
  if (cStart < 0) cStart = 0

  let cEnd = n
  for (let i = 0; i < n; i++) {
    if (history[i]!.fecha > lastDate) {
      cEnd = i
      break
    }
  }
  return clampZoomRange({ start: cStart, end: cEnd }, n)
}

export function useAccountHistoryChartZoomSync(
  history: Ref<AccountHistoryItem[] | null | undefined>,
) {
  const syncedZoom = ref<ChartZoomRange | null>(null)

  watch(
    () => history.value?.length,
    () => {
      syncedZoom.value = null
    },
  )

  const filtered = computed(() => (history.value ? filterHistoryWithTope(history.value) : []))

  const tnaZoom = computed(() => syncedZoom.value)

  const topeZoom = computed(() => {
    const h = history.value
    const sync = syncedZoom.value
    if (!h?.length || !sync || !filtered.value.length) return null
    return canonicalToTopeRange(h, filtered.value, sync.start, sync.end)
  })

  function onTnaZoomStart(payload: { index: number }) {
    const h = history.value
    if (!h?.length) return
    const prev = syncedZoom.value
    const next = clampZoomRange({ start: payload.index, end: prev?.end ?? h.length }, h.length)
    if (prev && prev.start === next.start && prev.end === next.end) return
    syncedZoom.value = next
  }

  function onTnaZoomEnd(payload: { index: number }) {
    const h = history.value
    if (!h?.length) return
    const prev = syncedZoom.value
    const next = clampZoomRange({ start: prev?.start ?? 0, end: payload.index }, h.length)
    if (prev && prev.start === next.start && prev.end === next.end) return
    syncedZoom.value = next
  }

  function onTopeZoomStart(payload: { index: number }) {
    const h = history.value
    const f = filtered.value
    if (!h?.length || !f.length) return
    const prev = syncedZoom.value
    const topeEnd = prev ? canonicalToTopeRange(h, f, prev.start, prev.end).end : f.length
    const topeRange = clampZoomRange({ start: payload.index, end: topeEnd }, f.length)
    const next = topeToCanonicalRange(h, f, topeRange.start, topeRange.end)
    if (prev && prev.start === next.start && prev.end === next.end) return
    syncedZoom.value = next
  }

  function onTopeZoomEnd(payload: { index: number }) {
    const h = history.value
    const f = filtered.value
    if (!h?.length || !f.length) return
    const prev = syncedZoom.value
    const topeStart = prev ? canonicalToTopeRange(h, f, prev.start, prev.end).start : 0
    const topeRange = clampZoomRange({ start: topeStart, end: payload.index }, f.length)
    const next = topeToCanonicalRange(h, f, topeRange.start, topeRange.end)
    if (prev && prev.start === next.start && prev.end === next.end) return
    syncedZoom.value = next
  }

  function onZoomReset() {
    syncedZoom.value = null
  }

  return {
    tnaZoom,
    topeZoom,
    onTnaZoomStart,
    onTnaZoomEnd,
    onTopeZoomStart,
    onTopeZoomEnd,
    onZoomReset,
  }
}

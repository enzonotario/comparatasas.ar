export interface YieldLabelBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  /** Mayor rango gana. En Highcharts era el valor de Y (la tasa). */
  rank: number
}

const LABEL_PADDING = 2

function intersects(a: YieldLabelBox, b: YieldLabelBox, padding: number) {
  return !(
    b.x >= a.x + a.width + padding ||
    b.x + b.width + padding <= a.x ||
    b.y >= a.y + a.height + padding ||
    b.y + b.height + padding <= a.y
  )
}

/**
 * Igual que Highcharts con `allowOverlap: false`: si dos etiquetas se cruzan,
 * se queda la de mayor rango. Si empatan, se queda la que aparece primero.
 */
export function overlappingYieldLabelIds(
  boxes: readonly YieldLabelBox[],
  padding = LABEL_PADDING,
): Set<string> {
  const state = boxes.map((box) => ({ ...box, visible: true }))

  for (let i = 0; i < state.length; i++) {
    const first = state[i]
    if (!first) continue
    for (let j = i + 1; j < state.length; j++) {
      const second = state[j]
      if (!second || !first.visible || !second.visible) continue
      if (!intersects(first, second, padding)) continue
      if (first.rank < second.rank) first.visible = false
      else second.visible = false
    }
  }

  return new Set(state.filter((box) => !box.visible).map((box) => box.id))
}

function svgUserPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  return point.matrixTransform(ctm.inverse())
}

function adjacentProviderLogo(text: SVGTextElement) {
  for (const node of [text.previousElementSibling, text.nextElementSibling]) {
    if (node instanceof SVGImageElement && node.hasAttribute('data-provider-logo')) return node
  }
  return null
}

function visualBox(svg: SVGSVGElement, node: SVGGraphicsElement) {
  const rect = node.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return null
  const start = svgUserPoint(svg, rect.left, rect.top)
  const end = svgUserPoint(svg, rect.right, rect.bottom)
  if (!start || !end) return null
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

function unionBox(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  }
}

/** Oculta ticker + tasa cuando se superponen, como el `allowOverlap: false` de Highcharts. */
export function hideOverlappingYieldLabels(svg: SVGSVGElement) {
  const texts = [...svg.querySelectorAll<SVGTextElement>('text[data-ts-key^="text-"]')].filter(
    (text) => !text.closest('.ts-chart__legend'),
  )

  for (const text of texts) {
    text.removeAttribute('opacity')
    text.style.opacity = ''
    text.removeAttribute('data-yield-label-hidden')
  }

  for (const logo of svg.querySelectorAll<SVGImageElement>('[data-provider-logo]')) {
    logo.removeAttribute('opacity')
    logo.style.opacity = ''
    logo.removeAttribute('data-yield-label-hidden')
  }

  const names = texts.filter((text) => text.getAttribute('font-weight') === '600')
  const values = texts.filter((text) => text.getAttribute('font-weight') === '500')
  const usedValues = new Set<SVGTextElement>()
  const groups: Array<{
    id: string
    nodes: Array<SVGTextElement | SVGImageElement>
    box: YieldLabelBox
  }> = []

  names.forEach((name, index) => {
    const x = Number(name.getAttribute('x'))
    const y = Number(name.getAttribute('y'))
    let value: SVGTextElement | undefined
    let bestDy = Number.POSITIVE_INFINITY
    for (const candidate of values) {
      if (usedValues.has(candidate)) continue
      const dx = Math.abs(Number(candidate.getAttribute('x')) - x)
      const dy = Number(candidate.getAttribute('y')) - y
      if (dx > 0.6 || dy < 0 || dy > 24 || dy >= bestDy) continue
      value = candidate
      bestDy = dy
    }
    if (value) usedValues.add(value)

    const nameBox = visualBox(svg, name)
    if (!nameBox) return
    const valueBox = value ? visualBox(svg, value) : null
    const logo = adjacentProviderLogo(name)
    const logoBox = logo ? visualBox(svg, logo) : null
    const box = [nameBox, valueBox, logoBox].reduce((union, next) =>
      union && next ? unionBox(union, next) : union || next,
    )
    if (!box) return
    groups.push({
      id: String(index),
      nodes: [name, value, logo].filter(
        (node): node is SVGTextElement | SVGImageElement => node != null,
      ),
      box: { id: String(index), ...box, rank: -y },
    })
  })

  const hidden = overlappingYieldLabelIds(groups.map((group) => group.box))
  for (const group of groups) {
    if (!hidden.has(group.id)) continue
    for (const node of group.nodes) {
      node.setAttribute('opacity', '0')
      node.setAttribute('data-yield-label-hidden', '')
    }
  }
}

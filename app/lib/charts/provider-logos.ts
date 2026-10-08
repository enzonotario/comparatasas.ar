import { toValue, type MaybeRefOrGetter } from 'vue'
import { getInstitutionLogo } from '../mappings/institutions'
import { getLogoForEntity, getLogoForItem } from '../mappings/logos'

const SVG_NS = 'http://www.w3.org/2000/svg'

export const PROVIDER_LOGO_SIZE = 16
export const PROVIDER_LOGO_GAP = 4

/** Corre el nombre hacia la izquierda para dejar el logo entre el texto y el gráfico. */
export const PROVIDER_AXIS_LOGO_DX = -(PROVIDER_LOGO_SIZE + PROVIDER_LOGO_GAP + 2)

/** Desplaza un nombre centrado para que el par logo + texto quede centrado. */
export const PROVIDER_LOGO_PAIR_DX = (PROVIDER_LOGO_SIZE + PROVIDER_LOGO_GAP) / 2

export function resolveProviderLogo(name: string, explicit?: string | null): string | undefined {
  const direct = explicit?.trim()
  if (direct) return direct
  const trimmed = name.trim()
  if (!trimmed) return undefined
  return (
    getLogoForEntity(trimmed) || getLogoForItem({ nombre: trimmed }) || getInstitutionLogo(trimmed)
  )
}

export function providerLogoMap(
  entries: ReadonlyArray<{ name: string; logo?: string | null }>,
): Map<string, string> {
  const logos = new Map<string, string>()
  for (const entry of entries) {
    const name = entry.name.replace(/\s+/g, ' ').trim()
    const logo = resolveProviderLogo(name, entry.logo)
    if (name && logo) logos.set(name, logo)
  }
  return logos
}

function svgUserPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  return point.matrixTransform(ctm.inverse())
}

function visualTextBox(svg: SVGSVGElement, text: SVGTextElement) {
  const rect = text.getBoundingClientRect()
  if (rect.width >= 2 && rect.height >= 2) {
    const start = svgUserPoint(svg, rect.left, rect.top)
    const end = svgUserPoint(svg, rect.right, rect.bottom)
    if (start && end) {
      return {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      }
    }
  }

  try {
    const box = text.getBBox()
    if (box.width < 2 || box.height < 2) return null
    return { x: box.x, y: box.y, width: box.width, height: box.height }
  } catch {
    return null
  }
}

function rectBounds(node: Element) {
  if (node.localName !== 'rect') return null
  const x = Number(node.getAttribute('x') ?? 0)
  const y = Number(node.getAttribute('y') ?? 0)
  const width = Number(node.getAttribute('width'))
  const height = Number(node.getAttribute('height'))
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  return { x, y, width, height }
}

/** El logo de un nombre dentro de una celda tiene que entrar en esa celda. */
function logoOverflowsOwningCell(
  text: SVGTextElement,
  box: { x: number; y: number; width: number; height: number },
  x: number,
  y: number,
  svgWidth: number,
  svgHeight: number,
) {
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  let node: Element | null = text.previousElementSibling

  while (node && node.localName !== 'text') {
    const rect = rectBounds(node)
    const ownsText =
      rect != null &&
      centerX >= rect.x &&
      centerX <= rect.x + rect.width &&
      centerY >= rect.y &&
      centerY <= rect.y + rect.height
    const isCell = rect != null && rect.width < svgWidth * 0.92 && rect.height < svgHeight * 0.92

    if (rect && ownsText && isCell) {
      return (
        x < rect.x + 2 ||
        y < rect.y + 2 ||
        x + PROVIDER_LOGO_SIZE > rect.x + rect.width - 2 ||
        y + PROVIDER_LOGO_SIZE > rect.y + rect.height - 2
      )
    }

    node = node.previousElementSibling
  }

  return false
}

/**
 * Dibuja el logo junto al texto que ya muestra el nombre.
 * `after` usa el hueco creado con `PROVIDER_AXIS_LOGO_DX`.
 * `before` lo pone a la izquierda del texto, si entra en el SVG.
 */
export function paintProviderLogos(
  svg: SVGSVGElement,
  logos: ReadonlyMap<string, string>,
  side: 'before' | 'after' = 'after',
) {
  svg.querySelectorAll('[data-provider-logo]').forEach((node) => node.remove())
  if (logos.size === 0) return

  const width = svg.viewBox.baseVal.width || Number(svg.getAttribute('width')) || 0
  const height = svg.viewBox.baseVal.height || Number(svg.getAttribute('height')) || 0

  for (const text of svg.querySelectorAll('text')) {
    const name = text.textContent?.replace(/\s+/g, ' ').trim()
    const href = name ? logos.get(name) : undefined
    if (!href) continue

    const box = visualTextBox(svg, text)
    if (!box) continue

    const x =
      side === 'before'
        ? box.x - PROVIDER_LOGO_SIZE - PROVIDER_LOGO_GAP
        : box.x + box.width + PROVIDER_LOGO_GAP
    const y = box.y + (box.height - PROVIDER_LOGO_SIZE) / 2
    if (x < 1 || y < 1) continue
    if (width > 0 && x + PROVIDER_LOGO_SIZE > width - 1) continue
    if (height > 0 && y + PROVIDER_LOGO_SIZE > height - 1) continue
    if (logoOverflowsOwningCell(text, box, x, y, width, height)) continue

    const image = document.createElementNS(SVG_NS, 'image')
    image.setAttribute('data-provider-logo', '')
    image.setAttribute('href', href)
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href)
    image.setAttribute('x', String(x))
    image.setAttribute('y', String(y))
    image.setAttribute('width', String(PROVIDER_LOGO_SIZE))
    image.setAttribute('height', String(PROVIDER_LOGO_SIZE))
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    image.style.pointerEvents = 'none'
    text.parentNode?.insertBefore(image, side === 'before' ? text : text.nextSibling)
  }
}

export function useProviderLogos(
  logos: MaybeRefOrGetter<ReadonlyMap<string, string>>,
  side: 'before' | 'after' = 'after',
) {
  function onRender(context: { svg: SVGSVGElement }) {
    paintProviderLogos(context.svg, toValue(logos), side)
  }

  return { onRender }
}

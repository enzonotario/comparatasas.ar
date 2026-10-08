import { describe, expect, it } from 'vitest'
import { overlappingYieldLabelIds, type YieldLabelBox } from './yield-label-collision'

function box(id: string, x: number, rank: number, width = 40): YieldLabelBox {
  return { id, x, y: 0, width, height: 20, rank }
}

describe('etiquetas de curvas sin superposición', () => {
  it('oculta la de menor tasa cuando dos etiquetas se pisan', () => {
    const hidden = overlappingYieldLabelIds([box('baja', 0, 1), box('alta', 10, 5)])

    expect([...hidden]).toEqual(['baja'])
  })

  it('deja las que no se tocan y, si empatan, la primera', () => {
    const hidden = overlappingYieldLabelIds([
      box('primera', 0, 3),
      box('segunda', 10, 3),
      box('lejos', 200, 1),
    ])

    expect(hidden.has('segunda')).toBe(true)
    expect(hidden.has('primera')).toBe(false)
    expect(hidden.has('lejos')).toBe(false)
  })

  it('en un grupo apretado conserva la tasa más alta', () => {
    const hidden = overlappingYieldLabelIds([box('a', 0, 2), box('b', 8, 9), box('c', 16, 4)])

    expect([...hidden].sort()).toEqual(['a', 'c'])
  })
})

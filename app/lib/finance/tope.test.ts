import { describe, expect, it } from 'vitest'
import { hasDeclaredTope, normalizeTope } from './tope'

describe('hasDeclaredTope', () => {
  it('acepta topes positivos', () => {
    expect(hasDeclaredTope(1)).toBe(true)
    expect(hasDeclaredTope(750_000)).toBe(true)
  })

  it('rechaza null, undefined, 0 y no finitos', () => {
    expect(hasDeclaredTope(null)).toBe(false)
    expect(hasDeclaredTope(undefined)).toBe(false)
    expect(hasDeclaredTope(0)).toBe(false)
    expect(hasDeclaredTope(-1)).toBe(false)
    expect(hasDeclaredTope(Number.NaN)).toBe(false)
  })
})

describe('normalizeTope', () => {
  it('deja topes positivos y convierte 0/null a null', () => {
    expect(normalizeTope(1_000_000)).toBe(1_000_000)
    expect(normalizeTope(0)).toBeNull()
    expect(normalizeTope(null)).toBeNull()
    expect(normalizeTope(undefined)).toBeNull()
  })
})

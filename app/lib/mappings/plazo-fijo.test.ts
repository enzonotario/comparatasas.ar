import { describe, expect, it } from 'vitest'
import { getPlazoFijoLogo, getPlazoFijoShortName, getPlazoFijoUrl } from './plazo-fijo'

describe('getPlazoFijoShortName', () => {
  it('returns the short name for a known bank', () => {
    expect(getPlazoFijoShortName('UALA')).toBe('Ualá')
  })

  it('does not throw when the API row has no entidad', () => {
    expect(getPlazoFijoShortName(undefined as unknown as string)).toBe('')
    expect(getPlazoFijoLogo(undefined as unknown as string)).toBeUndefined()
    expect(getPlazoFijoUrl(undefined as unknown as string)).toBeUndefined()
  })
})

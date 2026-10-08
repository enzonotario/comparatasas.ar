import { describe, expect, it } from 'vitest'
import { providerLogoMap, resolveProviderLogo } from './provider-logos'

describe('provider logos', () => {
  it('usa el logo explícito y descarta nombres vacíos', () => {
    const logos = providerLogoMap([
      { name: ' Galicia ', logo: 'https://example/galicia.svg' },
      { name: '   ', logo: 'https://example/vacio.svg' },
    ])

    expect(logos.get('Galicia')).toBe('https://example/galicia.svg')
    expect(logos.size).toBe(1)
  })

  it('resuelve un logo conocido cuando el dato no trae uno', () => {
    expect(resolveProviderLogo('Galicia')).toBeTruthy()
    expect(resolveProviderLogo('Ualá Plus 2')).toBeTruthy()
    expect(resolveProviderLogo('entidad que no existe')).toBeUndefined()
  })
})

import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { categoryIconUrl } from './category-icon-url'
import { readCategoryIconVersions } from './category-icons'

const NAV_ICONS = [
  'wallet.png',
  'safe.png',
  'criptopesos.png',
  'fondos.png',
  'cauciones.png',
  'letras.png',
  'bonos-cer.png',
  'credito-hipotecario.png',
  'credito-personal.png',
  'cobros.png',
  'brokers.png',
  'cuotas.png',
  'dolar.png',
  'dolar-baja.png',
  'usa.png',
  'bitcoin.png',
  'inversion.png',
  'mercado.png',
  'credito.png',
  'costos.png',
]

describe('iconos de navegación', () => {
  it('están en public/assets/icons', () => {
    for (const file of NAV_ICONS) {
      expect(existsSync(join('public/assets/icons', file)), file).toBe(true)
    }
  })
})

describe('categoryIconUrl', () => {
  it('sirve el archivo local sin versión en desarrollo', () => {
    expect(categoryIconUrl('wallet.png')).toBe('/assets/icons/wallet.png')
  })

  it('agrega el hash de contenido como query', () => {
    expect(categoryIconUrl('wallet.png', 'abc123def4')).toBe(
      '/assets/icons/wallet.png?v=abc123def4',
    )
  })
})

describe('readCategoryIconVersions', () => {
  it('no lee el disco cuando el hash está desactivado', () => {
    expect(readCategoryIconVersions('/no/existe', false)).toEqual({})
  })

  it('mantiene el hash si el archivo no cambia y lo cambia si el archivo cambia', () => {
    const dir = mkdtempSync(join(tmpdir(), 'category-icons-'))
    writeFileSync(join(dir, 'wallet.png'), 'v1')
    writeFileSync(join(dir, 'nota.txt'), 'ignorar')

    const first = readCategoryIconVersions(dir, true)
    const second = readCategoryIconVersions(dir, true)
    expect(first).toEqual(second)
    expect(first['wallet.png']).toMatch(/^[a-f0-9]{10}$/)
    expect(first['nota.txt']).toBeUndefined()

    writeFileSync(join(dir, 'wallet.png'), 'v2')
    const third = readCategoryIconVersions(dir, true)
    expect(third['wallet.png']).not.toBe(first['wallet.png'])
  })
})

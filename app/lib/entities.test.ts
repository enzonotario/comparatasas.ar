import { describe, expect, it } from 'vitest'
import { ENTITIES, getEntityBySlug, normalizeEntityName, resolveEntitySlug } from './entities'

describe('normalizeEntityName', () => {
  it('strips accents, case, spacing and punctuation', () => {
    expect(normalizeEntityName('  Crédito Regional Compañía Financiera S.A.U. ')).toBe(
      'creditoregionalcompaniafinancierasau',
    )
  })
})

describe('resolveEntitySlug', () => {
  it('matches accent, case and spacing variants', () => {
    expect(resolveEntitySlug('Ualá')).toBe('uala')
    expect(resolveEntitySlug('UALA')).toBe('uala')
    expect(resolveEntitySlug('naranjax')).toBe('naranja-x')
    expect(resolveEntitySlug('NARANJA  X')).toBe('naranja-x')
    expect(resolveEntitySlug('Rava Bursatil')).toBe('rava')
  })

  it('groups product variants under the same entity', () => {
    expect(resolveEntitySlug('UALA PLUS 1')).toBe('uala')
    expect(resolveEntitySlug('UALA PLUS 2')).toBe('uala')
    expect(resolveEntitySlug('Ualá Bis')).toBe('uala')
    expect(resolveEntitySlug('BICA CUENTA POSITIVA 3')).toBe('banco-bica')
  })

  it('maps BCRA legal names to the bank', () => {
    expect(resolveEntitySlug('BANCO DE LA NACION ARGENTINA')).toBe('banco-nacion')
    expect(resolveEntitySlug('BANCO DE GALICIA Y BUENOS AIRES S.A.')).toBe('banco-galicia')
    expect(resolveEntitySlug('BANCO DE LA PROVINCIA DE CORDOBA S.A.')).toBe('bancor')
  })

  it('keeps brokers apart from the bank with a similar name', () => {
    expect(resolveEntitySlug('Galicia')).toBe('banco-galicia')
    expect(resolveEntitySlug('Galicia Securities')).toBe('galicia-securities')
    expect(resolveEntitySlug('Wise')).toBe('wise')
    expect(resolveEntitySlug('Wise Capital')).toBe('wise-capital')
  })

  it('returns undefined for unknown or empty names', () => {
    expect(resolveEntitySlug('Banco Inexistente')).toBeUndefined()
    expect(resolveEntitySlug('')).toBeUndefined()
    expect(resolveEntitySlug(null)).toBeUndefined()
  })
})

describe('ENTITIES', () => {
  it('has unique slugs', () => {
    const slugs = ENTITIES.map((entity) => entity.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('never maps the same name to two entities', () => {
    const owners = new Map<string, string>()
    const conflicts: string[] = []
    for (const entity of ENTITIES) {
      const keys = new Set([entity.name, entity.slug, ...entity.aliases].map(normalizeEntityName))
      for (const key of keys) {
        const owner = owners.get(key)
        if (owner && owner !== entity.slug) conflicts.push(`${key}: ${owner} / ${entity.slug}`)
        owners.set(key, entity.slug)
      }
    }
    expect(conflicts).toEqual([])
  })

  it('finds entities by slug', () => {
    expect(getEntityBySlug('uala')?.name).toBe('Ualá')
    expect(getEntityBySlug('no-existe')).toBeUndefined()
  })
})

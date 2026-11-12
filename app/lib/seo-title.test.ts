import { describe, expect, it } from 'vitest'
import { fitPageTitle, SEO_TITLE_TEMPLATE_SUFFIX } from './seo-title'

describe('fitPageTitle', () => {
  it('keeps short titles unchanged', () => {
    expect(fitPageTitle('MEGAQM Pesos - Clase E')).toBe('MEGAQM Pesos - Clase E')
  })

  it('clips long fund names so full title stays within 60 chars', () => {
    const page = fitPageTitle('Balanz Capital Money Market - Clase L Ley N° 27.743')
    expect(`${page}${SEO_TITLE_TEMPLATE_SUFFIX}`.length).toBeLessThanOrEqual(60)
    expect(page.endsWith('…')).toBe(true)
  })

  it('keeps historico marker when clipping the fund name', () => {
    const page = fitPageTitle('Balanz Ahorro en Dolares RP D.596 - Clase A', 'Histórico')
    expect(page.endsWith(' · Histórico')).toBe(true)
    expect(`${page}${SEO_TITLE_TEMPLATE_SUFFIX}`.length).toBeLessThanOrEqual(60)
  })

  it('removes trailing separators before ellipsis', () => {
    const page = fitPageTitle('Nombre muy largo de un fondo con muchas palabras extras y más')
    expect(page).toMatch(/…$/)
    expect(page).not.toMatch(/[·\-|–—,:.\s]…$/)
  })
})

import { describe, expect, it } from 'vitest'
import {
  filterBySearchTokens,
  normalizeSearchText,
  sortByPriorityMap,
} from './global-search'

const plazosFijos = [
  { id: 'plazos-fijos-tradicional', label: 'Plazo Fijo / Tradicional (30+ días)', suffix: 'Plazos Fijos' },
  { id: 'plazos-fijos-uva-precancelable', label: 'Plazo Fijo / UVA precancelable', suffix: 'Plazos Fijos' },
  {
    id: 'plazos-fijos-uva-pago-periodico',
    label: 'Plazo Fijo / UVA pago periódico',
    suffix: 'Plazos Fijos',
  },
]

const priority = {
  'plazos-fijos-tradicional': 0,
  'plazos-fijos-uva-precancelable': 1,
  'plazos-fijos-uva-pago-periodico': 2,
}

describe('normalizeSearchText', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(normalizeSearchText('Periódico')).toBe('periodico')
  })
})

describe('filterBySearchTokens', () => {
  it('con "plazo fijo" devuelve los tres', () => {
    const ids = filterBySearchTokens('plazo fijo', plazosFijos).map((i) => i.id)
    expect(ids).toEqual([
      'plazos-fijos-tradicional',
      'plazos-fijos-uva-precancelable',
      'plazos-fijos-uva-pago-periodico',
    ])
  })

  it('con "plazo fijo t" deja solo tradicional', () => {
    const ids = filterBySearchTokens('plazo fijo t', plazosFijos).map((i) => i.id)
    expect(ids).toEqual(['plazos-fijos-tradicional'])
  })

  it('con "plazo fijo precanc" deja solo precancelable', () => {
    const ids = filterBySearchTokens('plazo fijo precanc', plazosFijos).map((i) => i.id)
    expect(ids).toEqual(['plazos-fijos-uva-precancelable'])
  })

  it('con "plazo fijo period" deja solo pago periódico (sin acento)', () => {
    const ids = filterBySearchTokens('plazo fijo period', plazosFijos).map((i) => i.id)
    expect(ids).toEqual(['plazos-fijos-uva-pago-periodico'])
  })

  it('respeta keywords', () => {
    const items = [
      { id: 'lecaps', label: 'LECAPs y BONCAPs', keywords: ['letras', 'boncap'] },
      { id: 'otros', label: 'Otra página' },
    ]
    expect(filterBySearchTokens('letras', items).map((i) => i.id)).toEqual(['lecaps'])
  })
})

describe('sortByPriorityMap', () => {
  it('ordena plazos fijos por prioridad canónica', () => {
    const shuffled = [plazosFijos[2], plazosFijos[0], plazosFijos[1]]
    const ids = sortByPriorityMap(shuffled, priority).map((i) => i.id)
    expect(ids).toEqual([
      'plazos-fijos-tradicional',
      'plazos-fijos-uva-precancelable',
      'plazos-fijos-uva-pago-periodico',
    ])
  })
})

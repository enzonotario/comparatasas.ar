import { describe, expect, it } from 'vitest'
import { compareClassLabels, parseFundClassName } from './fci-fund-class'

describe('parseFundClassName', () => {
  it('splits standard Clase suffix', () => {
    const parsed = parseFundClassName('Adcap Ahorro Pesos Fondo de Dinero - Clase A')
    expect(parsed.baseName).toBe('Adcap Ahorro Pesos Fondo de Dinero')
    expect(parsed.classLabel).toBe('Clase A')
    expect(parsed.groupKey).toBe('adcap ahorro pesos fondo de dinero')
  })

  it('keeps complex class labels', () => {
    const parsed = parseFundClassName('Adcap Ahorro Pesos Fondo de Dinero - Clase Ley Nº 27.743')
    expect(parsed.baseName).toBe('Adcap Ahorro Pesos Fondo de Dinero')
    expect(parsed.classLabel).toBe('Clase Ley Nº 27.743')
  })

  it('does not split non-class suffixes', () => {
    const parsed = parseFundClassName('Fondo Especial - Cobertura USD')
    expect(parsed.baseName).toBe('Fondo Especial - Cobertura USD')
    expect(parsed.classLabel).toBeNull()
  })

  it('handles names without suffix', () => {
    const parsed = parseFundClassName('Mercado Fondo')
    expect(parsed.baseName).toBe('Mercado Fondo')
    expect(parsed.classLabel).toBeNull()
  })

  it('groups accent-insensitive keys', () => {
    const a = parseFundClassName('Renta Fija - Clase A')
    const b = parseFundClassName('Renta Fija - Clase B')
    expect(a.groupKey).toBe(b.groupKey)
  })
})

describe('compareClassLabels', () => {
  it('sorts numerically within clase labels', () => {
    const labels = ['Clase H10', 'Clase H2', 'Clase A', 'Clase H1']
    expect([...labels].sort(compareClassLabels)).toEqual([
      'Clase A',
      'Clase H1',
      'Clase H2',
      'Clase H10',
    ])
  })
})

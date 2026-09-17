import { describe, expect, it } from 'vitest'
import { withOutboundUtm } from './outbound-url'

describe('withOutboundUtm', () => {
  it('agrega utm_source, utm_medium y ref', () => {
    expect(withOutboundUtm('https://argentinadatos.com/', 'cauciones')).toBe(
      'https://argentinadatos.com/?utm_source=comparatasas&utm_medium=cauciones&ref=comparatasas',
    )
  })

  it('preserva query y hash existentes', () => {
    expect(
      withOutboundUtm(
        'https://www.bancobica.com.ar/soluciones/cuentaspositivas.aspx?ref=comparatasas#C+1',
        'cuentas-billeteras',
      ),
    ).toBe(
      'https://www.bancobica.com.ar/soluciones/cuentaspositivas.aspx?ref=comparatasas&utm_source=comparatasas&utm_medium=cuentas-billeteras#C+1',
    )
  })

  it('idempotente si ya tiene utm de comparatasas', () => {
    const once = withOutboundUtm(
      'https://app.doctacapital.com.ar/?utm_source=comparatasas&utm_medium=bonos-cer',
      'bonos-cer',
    )
    expect(withOutboundUtm(once, 'bonos-cer')).toBe(once)
  })

  it('permite campaign y omitir ref', () => {
    expect(
      withOutboundUtm('https://www.dolarapp.com/es-AR', 'banner', {
        campaign: 'comparatasas_a',
        ref: false,
      }),
    ).toBe(
      'https://www.dolarapp.com/es-AR?utm_source=comparatasas&utm_medium=banner&utm_campaign=comparatasas_a',
    )
  })

  it('no modifica rutas internas ni #', () => {
    expect(withOutboundUtm('/fondos', 'fondos')).toBe('/fondos')
    expect(withOutboundUtm('#', 'fondos')).toBe('#')
  })
})

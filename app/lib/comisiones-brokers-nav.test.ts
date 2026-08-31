import { describe, expect, it } from 'vitest'
import {
  COMISIONES_BROKERS_DEFAULT_PRODUCTO,
  comisionesBrokersPrerenderRoutes,
  getComisionesBrokersProductoPath,
  isValidComisionesBrokersProducto,
} from './comisiones-brokers-nav'

describe('comisiones-brokers-nav', () => {
  it('maps default producto to index path', () => {
    expect(getComisionesBrokersProductoPath(COMISIONES_BROKERS_DEFAULT_PRODUCTO)).toBe(
      '/comisiones-brokers',
    )
  })

  it('maps other productos to nested paths', () => {
    expect(getComisionesBrokersProductoPath('acciones')).toBe('/comisiones-brokers/acciones')
  })

  it('validates known product slugs', () => {
    expect(isValidComisionesBrokersProducto('bonos')).toBe(true)
    expect(isValidComisionesBrokersProducto('invalido')).toBe(false)
  })

  it('prerenders all non-default product routes', () => {
    expect(comisionesBrokersPrerenderRoutes).toContain('/comisiones-brokers/acciones')
    expect(comisionesBrokersPrerenderRoutes).not.toContain('/comisiones-brokers')
  })
})

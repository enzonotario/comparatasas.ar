import {
  formatProductoLabel,
  PRODUCTO_BROKER_ORDER,
} from './finance/comision-caucion-broker'

export const COMISIONES_BROKERS_DEFAULT_PRODUCTO = 'cauciones'

export function getComisionesBrokersProductoPath(producto: string): string {
  if (producto === COMISIONES_BROKERS_DEFAULT_PRODUCTO) return '/comisiones-brokers'
  return `/comisiones-brokers/${producto}`
}

export function isValidComisionesBrokersProducto(producto: string): boolean {
  return (PRODUCTO_BROKER_ORDER as readonly string[]).includes(producto)
}

export function getComisionesBrokersProductoLabel(producto: string): string {
  return formatProductoLabel(producto)
}

/** Rutas estáticas para prerender (sin el producto default en index). */
export const comisionesBrokersPrerenderRoutes = PRODUCTO_BROKER_ORDER.filter(
  (producto) => producto !== COMISIONES_BROKERS_DEFAULT_PRODUCTO,
).map((producto) => getComisionesBrokersProductoPath(producto))

import { ACCOUNT_HISTORY_PROVIDER_SLUGS } from '../composables/useAccountHistory'
import { comparatasasFondos } from '../lib/mappings/funds'

const STATIC_PRERENDER_ROUTES = [
  '/',
  '/cuentas-billeteras',
  '/cuentas-billeteras/graficos',
  '/plazos-fijos',
  '/plazos-fijos/uva-pago-periodico',
  '/plazos-fijos/uva-precancelable',
  '/fondos',
  '/usd',
  '/criptomonedas',
  '/criptopesos',
  '/creditos-hipotecarios-uva',
  '/contado-cuotas',
  '/remesas',
  '/lecaps',
  '/bonos-cer',
  '/sumarse',
] as const

export async function getPrerenderRoutes(): Promise<string[]> {
  const routes = new Set<string>(STATIC_PRERENDER_ROUTES)

  for (const provider of ACCOUNT_HISTORY_PROVIDER_SLUGS) {
    routes.add(`/cuentas-billeteras/${provider}`)
  }

  for (const fondoSlug of comparatasasFondos) {
    routes.add(`/fondos/${fondoSlug}`)
  }

  return [...routes]
}

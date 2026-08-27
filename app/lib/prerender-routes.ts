import { ACCOUNT_HISTORY_PROVIDER_SLUGS } from '../composables/useAccountHistory'
import { comparatasasFondos } from '../lib/mappings/funds'
import { metodologiaNavTabs, METODOLOGIA_DEFAULT_CATEGORY } from '../lib/metodologia-nav'
import { sumarseNavTabs } from '../lib/sumarse-nav'
import { SUMARSE_DEFAULT_ENDPOINT } from '../lib/sumarse-endpoints'

const STATIC_PRERENDER_ROUTES = [
  '/',
  '/cuentas-billeteras',
  '/cuentas-billeteras/graficos',
  '/plazos-fijos',
  '/plazos-fijos/uva-pago-periodico',
  '/plazos-fijos/uva-precancelable',
  '/fondos',
  '/fondos/mercado',
  '/usd',
  '/criptomonedas',
  '/criptopesos',
  '/creditos-hipotecarios-uva',
  '/creditos-hipotecarios-uva/uva-dolar',
  '/creditos-hipotecarios-uva/simulador',
  '/prestamos-personales',
  '/prestamos-personales/bcra',
  '/comisiones-cobro',
  '/contado-cuotas',
  '/remesas',
  '/lecaps',
  '/cauciones',
  '/bonos-cer',
  '/metodologia',
  ...metodologiaNavTabs
    .filter((tab) => tab.id !== METODOLOGIA_DEFAULT_CATEGORY)
    .map((tab) => tab.to),
  '/sumarse',
  ...sumarseNavTabs
    .filter((tab) => tab.to !== '/sumarse')
    .map((tab) => tab.to),
] as const

export async function getPrerenderRoutes(): Promise<string[]> {
  const routes = new Set<string>(STATIC_PRERENDER_ROUTES)

  for (const provider of ACCOUNT_HISTORY_PROVIDER_SLUGS) {
    routes.add(`/cuentas-billeteras/${provider}`)
  }

  for (const fondoSlug of comparatasasFondos) {
    routes.add(`/fondos/${fondoSlug}`)
    routes.add(`/fondos/${fondoSlug}/historico`)
  }

  return [...routes]
}

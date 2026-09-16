import { ACCOUNT_HISTORY_PROVIDER_SLUGS } from '../composables/useAccountHistory'
import { comisionesBrokersPrerenderRoutes } from './comisiones-brokers-nav'
import { comparatasasFondos } from './mappings/funds'
import { metodologiaNavTabs } from './metodologia-nav'
import { sumarseNavTabs } from './sumarse-nav'

/** URLs con una representación Markdown curada que deben llegar siempre al Worker. */
export const AGENT_NEGOTIATED_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/metodologia',
  '/sumarse',
] as const

const CATALOG_ROUTES = [
  '/cuentas-billeteras',
  '/cuentas-billeteras/graficos',
  '/plazos-fijos',
  '/plazos-fijos/uva-pago-periodico',
  '/plazos-fijos/uva-precancelable',
  '/fondos',
  '/fondos/mercado',
  '/fondos/comparar',
  '/usd',
  '/criptomonedas',
  '/criptopesos',
  '/creditos-hipotecarios-uva',
  '/creditos-hipotecarios-uva/uva-dolar',
  '/creditos-hipotecarios-uva/simulador',
  '/prestamos-personales',
  '/prestamos-personales/bcra',
  '/comisiones-cobro',
  '/comisiones-brokers',
  ...comisionesBrokersPrerenderRoutes,
  '/contado-cuotas',
  '/remesas',
  '/lecaps',
  '/cauciones',
  '/bonos-cer',
] as const

const PUBLIC_ROUTES = new Set<string>([
  ...AGENT_NEGOTIATED_ROUTES,
  ...CATALOG_ROUTES,
  ...metodologiaNavTabs.map((tab) => tab.to),
  ...sumarseNavTabs.map((tab) => tab.to),
  ...ACCOUNT_HISTORY_PROVIDER_SLUGS.map((provider) => `/cuentas-billeteras/${provider}`),
  ...comparatasasFondos.flatMap((slug) => [`/fondos/${slug}`, `/fondos/${slug}/historico`]),
])

export function getPublicRoutes(): string[] {
  return [...PUBLIC_ROUTES]
}

export function getStaticPrerenderRoutes(): string[] {
  const negotiated = new Set<string>(AGENT_NEGOTIATED_ROUTES)
  return getPublicRoutes().filter((route) => !negotiated.has(route))
}

export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.has(path)
}

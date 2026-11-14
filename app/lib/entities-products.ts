import { ACCOUNT_HISTORY_PROVIDER_SLUGS, getProviderSlug } from '../composables/useAccountHistory'
import {
  getComisionesBrokersProductoPath,
  isValidComisionesBrokersProducto,
} from './comisiones-brokers-nav'
import { shouldShowCrypto } from './crypto-utils'
import { ENTITIES, resolveEntitySlug, type Entity } from './entities'
import { formatProductoLabel } from './finance/comision-caucion-broker'
import {
  getComparatasasReturnPercent,
  getComparatasasTnaAndTea,
  type FciComparatasasRendimientos,
} from './finance/fci-comparatasas-returns'
import { getFundDetailPath, normalizeFundSlug } from './funds-detail'
import {
  comparatasasFondos,
  getFundMapping,
  getFundMappingBySlug,
  getFundTypeInfo,
} from './mappings/funds'
import { getInstitutionShortName } from './mappings/institutions'

/**
 * `shortLabel` and `metricLabel` are used where space is tight (coverage table).
 * `direction` says which value is best: rates earned are `higher`, costs and
 * borrowing rates are `lower`.
 */
export const ENTITY_CATEGORIES = [
  {
    key: 'cuentas-remuneradas',
    label: 'Cuentas remuneradas',
    shortLabel: 'Cuentas',
    metricLabel: 'TNA',
    direction: 'higher',
    to: '/cuentas-billeteras',
  },
  {
    key: 'plazos-fijos',
    label: 'Plazos fijos',
    shortLabel: 'Plazo fijo',
    metricLabel: 'TNA',
    direction: 'higher',
    to: '/plazos-fijos',
  },
  {
    key: 'fondos',
    label: 'Fondos comunes de inversión',
    shortLabel: 'FCI',
    metricLabel: 'TNA',
    direction: 'higher',
    to: '/fondos',
  },
  {
    key: 'usd',
    label: 'Inversiones en USD',
    shortLabel: 'USD',
    metricLabel: 'TNA',
    direction: 'higher',
    to: '/usd',
  },
  {
    key: 'criptopesos',
    label: 'Criptopesos',
    shortLabel: 'Criptopesos',
    metricLabel: 'TNA',
    direction: 'higher',
    to: '/criptopesos',
  },
  {
    key: 'criptomonedas',
    label: 'Criptomonedas',
    shortLabel: 'Cripto',
    metricLabel: 'APY',
    direction: 'higher',
    to: '/criptomonedas',
  },
  {
    key: 'comisiones-cobro',
    label: 'Comisiones de cobro',
    shortLabel: 'Cobros',
    metricLabel: 'comisión',
    direction: 'lower',
    to: '/comisiones-cobro',
  },
  {
    key: 'comisiones-brokers',
    label: 'Comisiones de brokers',
    shortLabel: 'Brokers',
    metricLabel: 'comisión',
    direction: 'lower',
    to: '/comisiones-brokers',
  },
  {
    key: 'fal',
    label: 'Fondo de Asistencia Laboral',
    shortLabel: 'FAL',
    metricLabel: 'comisión',
    direction: 'lower',
    to: '/fal',
  },
  {
    key: 'creditos-hipotecarios-uva',
    label: 'Créditos hipotecarios UVA',
    shortLabel: 'Hipotecario',
    metricLabel: 'TNA',
    direction: 'lower',
    to: '/creditos-hipotecarios-uva',
  },
  {
    key: 'prestamos-personales',
    label: 'Préstamos personales',
    shortLabel: 'Préstamos',
    metricLabel: 'TNA',
    direction: 'lower',
    to: '/prestamos-personales',
  },
  // Remesas: the metric is the cost of receiving a payment from abroad, so
  // lower is better. Only percentage (or zero) costs get a numeric value; fixed
  // fees like "3 USD" are not comparable with a percentage and stay text-only.
  {
    key: 'remesas',
    label: 'Remesas',
    shortLabel: 'Remesas',
    metricLabel: 'costo',
    direction: 'lower',
    to: '/remesas',
  },
] as const satisfies ReadonlyArray<{
  key: string
  label: string
  shortLabel: string
  metricLabel: string
  direction: 'higher' | 'lower'
  to: string
}>

export type EntityCategoryKey = (typeof ENTITY_CATEGORIES)[number]['key']

export interface EntityProduct {
  entitySlug: string
  category: EntityCategoryKey
  categoryLabel: string
  /** Commercial or product name. */
  product: string
  /** Already formatted main metric, e.g. `TNA 32,5%`. */
  metric?: string
  /** Numeric main metric as a decimal rate (0.325 = 32,5%), when comparable. */
  value?: number
  /** Internal page for this product (category page or a more specific one). */
  to: string
}

export interface EntityProductsResult {
  products: EntityProduct[]
  /** Upstream names that did not resolve to a registry entity. */
  unmatched: string[]
}

export interface EntitySummary {
  slug: string
  name: string
  type: Entity['type']
  products: EntityProduct[]
}

export interface EntitiesResponse {
  updatedAt: string
  entities: EntitySummary[]
}

const API_BASE = 'https://api.argentinadatos.com/v1/finanzas'

/** Fixed upstream URLs, one per source. */
export const ENTITY_SOURCES = {
  cuentas: `${API_BASE}/fci/otros/ultimo`,
  plazosFijos: `${API_BASE}/tasas/plazoFijo`,
  plazosFijosPrecancelables: `${API_BASE}/tasas/plazoFijoPrecancelable`,
  plazosFijosUvaPagoPeriodico: `${API_BASE}/tasas/plazoFijoUvaPagoPeriodico`,
  fondos: `${API_BASE}/fci/comparatasas`,
  criptopesos: `${API_BASE}/criptopesos/`,
  criptomonedas: `${API_BASE}/rendimientos`,
  cuentasUsd: `${API_BASE}/cuentas-remuneradas-usd/`,
  comisionesCobro: `${API_BASE}/cobros/comisiones/`,
  comisionesBrokers: `${API_BASE}/brokers/comisiones/`,
  fal: `${API_BASE}/fal/`,
  hipotecarios: `${API_BASE}/creditos/hipotecariosUva/`,
  prestamos: `${API_BASE}/creditos/prestamosPersonales/`,
  remesas: `${API_BASE}/remesas`,
} as const

export type EntitySourceKey = keyof typeof ENTITY_SOURCES

const categoryByKey = new Map<string, (typeof ENTITY_CATEGORIES)[number]>(
  ENTITY_CATEGORIES.map((category) => [category.key, category]),
)

export function getEntityCategory(key: string) {
  return categoryByKey.get(key)
}

/** Decimal rate (0.325) → `32,5%`. */
export function formatRate(value: number): string {
  return `${(value * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`
}

/**
 * Numeric value plus its formatted metric (`TNA 32,5%`), so every mapper
 * formats the same way. Missing/non-finite values yield neither.
 */
function rated(
  label: string,
  value: number | null | undefined,
  prefix = '',
): Pick<EntityProduct, 'metric' | 'value'> {
  if (value == null || !Number.isFinite(value)) return {}
  return { value, metric: `${label} ${prefix}${formatRate(value)}` }
}

function isPositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function rowsOf<T>(raw: unknown, key?: string): T[] {
  const value = key && raw && typeof raw === 'object' ? (raw as Record<string, unknown>)[key] : raw
  return Array.isArray(value) ? (value as T[]) : []
}

type MappedProduct = Omit<EntityProduct, 'entitySlug' | 'categoryLabel'>

/** Collects products for rows whose names resolve; keeps the rest as unmatched. */
function collect<T, P extends MappedProduct>(
  rows: T[],
  names: (row: T) => Array<string | null | undefined>,
  toProduct: (row: T) => P,
): {
  products: Array<P & Pick<EntityProduct, 'entitySlug' | 'categoryLabel'>>
  unmatched: string[]
} {
  const products: Array<P & Pick<EntityProduct, 'entitySlug' | 'categoryLabel'>> = []
  const unmatched: string[] = []

  for (const row of rows) {
    const candidates = names(row).filter((name): name is string => Boolean(name?.trim()))
    const slug = candidates.map(resolveEntitySlug).find(Boolean)
    if (!slug) {
      if (candidates.length) unmatched.push([...new Set(candidates)].join(' / '))
      continue
    }
    const product = toProduct(row)
    products.push({
      ...product,
      entitySlug: slug,
      categoryLabel: getEntityCategory(product.category)?.label ?? product.category,
    })
  }

  return { products, unmatched }
}

/**
 * Many upstream rows per (entity, product) (plans, channels, terms): keep one
 * product with the lowest value, prefixed with "desde" when values vary.
 */
function lowestPerProduct(products: EntityProduct[], label: string): EntityProduct[] {
  const groups = new Map<string, EntityProduct[]>()
  for (const product of products) {
    const key = `${product.entitySlug}|${product.product}`
    groups.set(key, [...(groups.get(key) ?? []), product])
  }

  return [...groups.values()].map((group) => {
    const first = group[0]!
    const values = group
      .map((item) => item.value)
      .filter((value): value is number => value != null && Number.isFinite(value))
    const min = values.length ? Math.min(...values) : undefined
    const varies = values.some((value) => value !== min)
    return {
      entitySlug: first.entitySlug,
      category: first.category,
      categoryLabel: first.categoryLabel,
      product: first.product,
      ...rated(label, min, varies ? 'desde ' : ''),
      to: first.to,
    }
  })
}

// --- Per source mappers -------------------------------------------------------

interface CuentaRow {
  fondo: string
  tna: number
}

export function mapCuentas(raw: unknown): EntityProductsResult {
  const historySlugs = new Set<string>(ACCOUNT_HISTORY_PROVIDER_SLUGS)
  return collect(
    rowsOf<CuentaRow>(raw).filter((row) => isPositive(row.tna)),
    (row) => [row.fondo],
    (row) => {
      const providerSlug = getProviderSlug(row.fondo)
      return {
        category: 'cuentas-remuneradas',
        product: getInstitutionShortName(row.fondo),
        ...rated('TNA', row.tna),
        to: historySlugs.has(providerSlug)
          ? `/cuentas-billeteras/${providerSlug}`
          : '/cuentas-billeteras',
      }
    },
  )
}

interface PlazoFijoRow {
  entidad: string
  tnaClientes: number | null
  tasas?: Array<{ tna: number | null }> | null
}

export function mapPlazosFijos(raw: unknown): EntityProductsResult {
  return collect(
    rowsOf<PlazoFijoRow>(raw),
    (row) => [row.entidad],
    (row) => {
      const best = Math.max(0, ...(row.tasas ?? []).map((tasa) => tasa.tna ?? 0))
      return {
        category: 'plazos-fijos',
        product: 'Plazo fijo tradicional',
        ...(isPositive(row.tnaClientes)
          ? rated('TNA', row.tnaClientes)
          : rated('TNA', isPositive(best) ? best : undefined, 'hasta ')),
        to: '/plazos-fijos',
      }
    },
  )
}

interface PlazoFijoPrecancelableRow {
  entidad: string
  tna: number | null
}

export function mapPlazosFijosPrecancelables(raw: unknown): EntityProductsResult {
  return collect(
    rowsOf<PlazoFijoPrecancelableRow>(raw),
    (row) => [row.entidad],
    (row) => ({
      category: 'plazos-fijos',
      product: 'Plazo fijo UVA precancelable',
      ...rated('TNA', isPositive(row.tna) ? row.tna : undefined),
      to: '/plazos-fijos/uva-precancelable',
    }),
  )
}

interface PlazoFijoUvaPagoPeriodicoRow {
  entidad: string
  tasas?: Array<{ tna: number | null }> | null
}

export function mapPlazosFijosUvaPagoPeriodico(raw: unknown): EntityProductsResult {
  return collect(
    rowsOf<PlazoFijoUvaPagoPeriodicoRow>(raw),
    (row) => [row.entidad],
    (row) => {
      const best = Math.max(0, ...(row.tasas ?? []).map((tasa) => tasa.tna ?? 0))
      return {
        category: 'plazos-fijos',
        product: 'Plazo fijo UVA con pago periódico',
        ...rated('TNA', isPositive(best) ? best : undefined, 'hasta '),
        to: '/plazos-fijos/uva-pago-periodico',
      }
    },
  )
}

interface FondoRow {
  nombre: string
  tipoRenta?: string
  rendimientos: FciComparatasasRendimientos
}

/**
 * FCIs listed by comparatasas (`comparatasasFondos`), attributed to the
 * institutions in `mappings/funds.ts`. Only money market funds and funds shown
 * as accounts get a TNA: the 7-day annualized return of bond/equity funds is
 * too noisy for a summary.
 */
export function mapFondos(raw: unknown): EntityProductsResult {
  const listed = new Set(comparatasasFondos)
  const products: EntityProduct[] = []
  const unmatched: string[] = []

  for (const fondo of rowsOf<FondoRow>(raw, 'fondos')) {
    const slug = normalizeFundSlug(fondo.nombre ?? '')
    if (!listed.has(slug)) continue
    const mapping = getFundMapping(fondo.nombre) ?? getFundMappingBySlug(slug)
    if (!mapping) continue

    const isMoneyMarket = getFundTypeInfo(fondo.tipoRenta)?.type === 'mercadoDinero'
    const { tna } = fondo.rendimientos
      ? getComparatasasTnaAndTea(getComparatasasReturnPercent(fondo.rendimientos))
      : { tna: 0 }
    const result = collect(
      mapping.institutions,
      (inst) => [inst.institution, inst.displayName],
      (inst) => {
        const isUsd = inst.showInUsdFunds || inst.showInUsdMoneyMarket || inst.showInUsdHighRisk
        const category = isUsd ? 'usd' : inst.showInAccounts ? 'cuentas-remuneradas' : 'fondos'
        const showTna = isMoneyMarket || category === 'cuentas-remuneradas'
        return {
          category,
          product: fondo.nombre,
          ...rated('TNA', showTna && isPositive(tna) ? tna : undefined),
          to: getFundDetailPath(slug),
        }
      },
    )
    products.push(...result.products)
    unmatched.push(...result.unmatched)
  }

  return { products, unmatched }
}

interface CriptopesoRow {
  entidad: string
  token: string
  tna: number | null
}

export function mapCriptopesos(raw: unknown): EntityProductsResult {
  return collect(
    rowsOf<CriptopesoRow>(raw),
    (row) => [row.entidad],
    (row) => ({
      category: 'criptopesos',
      product: row.token,
      ...rated('TNA', isPositive(row.tna) ? row.tna : undefined),
      to: '/criptopesos',
    }),
  )
}

interface CryptoYieldRow {
  entidad: string
  rendimientos?: Array<{ moneda: string; apy: number }> | null
}

export function mapCriptomonedas(raw: unknown): EntityProductsResult {
  return collect(
    rowsOf<CryptoYieldRow>(raw),
    (row) => [row.entidad],
    (row) => {
      const yields = (row.rendimientos ?? []).filter(
        (item) => shouldShowCrypto(item.moneda) && isPositive(item.apy),
      )
      const coins = new Set(yields.map((item) => item.moneda)).size
      // `apy` comes in percent (6 = 6%).
      const best = coins ? Math.max(...yields.map((item) => item.apy)) / 100 : undefined
      return {
        category: 'criptomonedas',
        product: 'Rendimientos en cripto',
        value: best,
        metric:
          best != null
            ? `Hasta ${formatRate(best)} APY · ${coins} ${coins === 1 ? 'moneda' : 'monedas'}`
            : undefined,
        to: '/criptomonedas',
      }
    },
  )
}

interface CuentaUsdRow {
  entidad: string
  tasa: number | null
}

export function mapCuentasUsd(raw: unknown): EntityProductsResult {
  return collect(
    rowsOf<CuentaUsdRow>(raw),
    (row) => [row.entidad],
    (row) => ({
      category: 'usd',
      product: 'Cuenta remunerada en dólares',
      ...rated('TNA', isPositive(row.tasa) ? row.tasa : undefined),
      to: '/usd',
    }),
  )
}

interface ComisionCobroRow {
  entidad: string
  nombreComercial: string
  producto: string
  arancel: number | null
}

export function mapComisionesCobro(raw: unknown): EntityProductsResult {
  const result = collect(
    rowsOf<ComisionCobroRow>(raw, 'comisiones'),
    (row) => [row.nombreComercial, row.entidad],
    (row) => ({
      category: 'comisiones-cobro',
      product: row.producto,
      value: row.arancel ?? undefined,
      to: '/comisiones-cobro',
    }),
  )
  return {
    products: lowestPerProduct(result.products, 'Arancel'),
    unmatched: result.unmatched,
  }
}

interface ComisionBrokerRow {
  entidad: string
  nombreComercial: string
  producto: string
  tasa: number | null
}

export function mapComisionesBrokers(raw: unknown): EntityProductsResult {
  const result = collect(
    rowsOf<ComisionBrokerRow>(raw, 'comisiones'),
    (row) => [row.nombreComercial, row.entidad],
    (row) => ({
      category: 'comisiones-brokers',
      product: formatProductoLabel(row.producto),
      value: row.tasa ?? undefined,
      to: isValidComisionesBrokersProducto(row.producto)
        ? getComisionesBrokersProductoPath(row.producto)
        : '/comisiones-brokers',
    }),
  )
  return {
    products: lowestPerProduct(result.products, 'Comisión'),
    unmatched: result.unmatched,
  }
}

interface FalRow {
  entidad: string
  nombreComercial: string
  nombrePlan: string | null
  comisionAnual: number | null
}

export function mapFal(raw: unknown): EntityProductsResult {
  return collect(
    rowsOf<FalRow>(raw, 'alternativas'),
    (row) => [row.nombreComercial, row.entidad],
    (row) => ({
      category: 'fal',
      product: row.nombrePlan || 'FAL',
      ...rated('Comisión', row.comisionAnual),
      to: '/fal',
    }),
  )
}

interface HipotecarioRow {
  entidad: string
  nombreComercial: string
  tna: number | null
}

export function mapHipotecarios(raw: unknown): EntityProductsResult {
  return collect(
    rowsOf<HipotecarioRow>(raw),
    (row) => [row.nombreComercial, row.entidad],
    (row) => ({
      category: 'creditos-hipotecarios-uva',
      product: 'Crédito hipotecario UVA',
      ...rated('TNA', isPositive(row.tna) ? row.tna : undefined),
      to: '/creditos-hipotecarios-uva',
    }),
  )
}

interface PrestamoRow {
  entidad: string
  nombreComercial: string
  producto: string
  tna: number | null
}

export function mapPrestamos(raw: unknown): EntityProductsResult {
  const result = collect(
    rowsOf<PrestamoRow>(raw),
    (row) => [row.nombreComercial, row.entidad],
    (row) => ({
      category: 'prestamos-personales',
      product: row.producto,
      value: row.tna ?? undefined,
      to: '/prestamos-personales',
    }),
  )
  return {
    products: lowestPerProduct(result.products, 'TNA'),
    unmatched: result.unmatched,
  }
}

interface RemesaRow {
  compania: string
  costoRecibirPagos: string | null
}

/** `"0"` → 0, `"1.5%"` → 0.015; fixed fees (`"3 USD"`) and free text → undefined. */
export function parseRemesaCost(cost: string | null | undefined): number | undefined {
  const match = cost?.trim().match(/^(\d+(?:[.,]\d+)?)\s*(%?)$/)
  if (!match) return undefined
  const amount = Number(match[1]!.replace(',', '.'))
  if (match[2]) return amount / 100
  return amount === 0 ? 0 : undefined
}

export function mapRemesas(raw: unknown): EntityProductsResult {
  return collect(
    rowsOf<RemesaRow>(raw, 'remesas'),
    (row) => [row.compania],
    (row) => {
      const cost = row.costoRecibirPagos?.trim()
      return {
        category: 'remesas',
        product: 'Recibir pagos del exterior',
        value: parseRemesaCost(cost),
        metric: cost ? `Recibir pagos: ${cost === '0' ? 'sin costo' : cost}` : undefined,
        to: '/remesas',
      }
    },
  )
}

const MAPPERS: Record<EntitySourceKey, (raw: unknown) => EntityProductsResult> = {
  cuentas: mapCuentas,
  plazosFijos: mapPlazosFijos,
  plazosFijosPrecancelables: mapPlazosFijosPrecancelables,
  plazosFijosUvaPagoPeriodico: mapPlazosFijosUvaPagoPeriodico,
  fondos: mapFondos,
  criptopesos: mapCriptopesos,
  criptomonedas: mapCriptomonedas,
  cuentasUsd: mapCuentasUsd,
  comisionesCobro: mapComisionesCobro,
  comisionesBrokers: mapComisionesBrokers,
  fal: mapFal,
  hipotecarios: mapHipotecarios,
  prestamos: mapPrestamos,
  remesas: mapRemesas,
}

/**
 * Maps every available source response (missing keys = failed sources) and
 * groups products per registry entity. Only entities with products are kept.
 */
export function buildEntitiesFromSources(responses: Partial<Record<EntitySourceKey, unknown>>): {
  entities: EntitySummary[]
  unmatched: string[]
} {
  const products: EntityProduct[] = []
  const unmatched = new Set<string>()

  for (const [key, mapper] of Object.entries(MAPPERS) as Array<
    [EntitySourceKey, (raw: unknown) => EntityProductsResult]
  >) {
    if (!(key in responses)) continue
    try {
      const result = mapper(responses[key])
      products.push(...result.products)
      for (const name of result.unmatched) unmatched.add(name)
    } catch (error) {
      console.warn(`[entidades] could not map source "${key}"`, error)
    }
  }

  const categoryOrder = new Map<string, number>(
    ENTITY_CATEGORIES.map((category, index) => [category.key, index]),
  )
  const entities = ENTITIES.map((entity) => ({
    slug: entity.slug,
    name: entity.name,
    type: entity.type,
    products: products
      .filter((product) => product.entitySlug === entity.slug)
      .sort((a, b) => categoryOrder.get(a.category)! - categoryOrder.get(b.category)!),
  }))
    .filter((entity) => entity.products.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return { entities, unmatched: [...unmatched].sort() }
}

export interface CategoryBest {
  /** Best numeric value for the category direction; undefined if none is numeric. */
  value?: number
  /** Products the entity has in the category. */
  count: number
  /** Page of the best product (first product when none is numeric). */
  to: string
}

/**
 * Best value of one entity in one category (max for `higher`, min for
 * `lower`). Undefined when the entity has no product in the category.
 */
export function getCategoryBest(
  products: EntityProduct[],
  category: EntityCategoryKey,
): CategoryBest | undefined {
  const inCategory = products.filter((product) => product.category === category)
  if (!inCategory.length) return undefined
  const higher = getEntityCategory(category)?.direction === 'higher'
  let best: EntityProduct | undefined
  for (const product of inCategory) {
    if (product.value == null || !Number.isFinite(product.value)) continue
    if (!best || (higher ? product.value > best.value! : product.value < best.value!)) {
      best = product
    }
  }
  return {
    value: best?.value,
    count: inCategory.length,
    to: (best ?? inCategory[0]!).to,
  }
}

/** Compact cell text: `—` (no product), `Sí` (no numeric value) or `32,5%`. */
export function formatCategoryBest(best: CategoryBest | undefined): string {
  if (!best) return '—'
  return best.value == null ? 'Sí' : formatRate(best.value)
}

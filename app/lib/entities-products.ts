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

/** `shortLabel` is used where space is tight (coverage table headers). */
export const ENTITY_CATEGORIES = [
  {
    key: 'cuentas-remuneradas',
    label: 'Cuentas remuneradas',
    shortLabel: 'Cuentas',
    to: '/cuentas-billeteras',
  },
  { key: 'plazos-fijos', label: 'Plazos fijos', shortLabel: 'Plazo fijo', to: '/plazos-fijos' },
  { key: 'fondos', label: 'Fondos comunes de inversión', shortLabel: 'FCI', to: '/fondos' },
  { key: 'usd', label: 'Inversiones en USD', shortLabel: 'USD', to: '/usd' },
  { key: 'criptopesos', label: 'Criptopesos', shortLabel: 'Criptopesos', to: '/criptopesos' },
  { key: 'criptomonedas', label: 'Criptomonedas', shortLabel: 'Cripto', to: '/criptomonedas' },
  {
    key: 'comisiones-cobro',
    label: 'Comisiones de cobro',
    shortLabel: 'Cobros',
    to: '/comisiones-cobro',
  },
  {
    key: 'comisiones-brokers',
    label: 'Comisiones de brokers',
    shortLabel: 'Brokers',
    to: '/comisiones-brokers',
  },
  { key: 'fal', label: 'Fondo de Asistencia Laboral', shortLabel: 'FAL', to: '/fal' },
  {
    key: 'creditos-hipotecarios-uva',
    label: 'Créditos hipotecarios UVA',
    shortLabel: 'Hipotecario',
    to: '/creditos-hipotecarios-uva',
  },
  {
    key: 'prestamos-personales',
    label: 'Préstamos personales',
    shortLabel: 'Préstamos',
    to: '/prestamos-personales',
  },
  { key: 'remesas', label: 'Remesas', shortLabel: 'Remesas', to: '/remesas' },
] as const

export type EntityCategoryKey = (typeof ENTITY_CATEGORIES)[number]['key']

export interface EntityProduct {
  entitySlug: string
  category: EntityCategoryKey
  categoryLabel: string
  /** Commercial or product name. */
  product: string
  /** Already formatted main metric, e.g. `TNA 32,5%`. */
  metric?: string
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

function isPositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function rowsOf<T>(raw: unknown, key?: string): T[] {
  const value = key && raw && typeof raw === 'object' ? (raw as Record<string, unknown>)[key] : raw
  return Array.isArray(value) ? (value as T[]) : []
}

type MappedProduct = Omit<EntityProduct, 'entitySlug' | 'categoryLabel'>
type RatedProduct = EntityProduct & { value: number | null }

/** Collects products for rows whose names resolve; keeps the rest as unmatched. */
function collect<T, P extends Omit<MappedProduct, 'metric'> & { metric?: string }>(
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
function lowestPerProduct(products: RatedProduct[], label: string): EntityProduct[] {
  const groups = new Map<string, RatedProduct[]>()
  for (const product of products) {
    const key = `${product.entitySlug}|${product.product}`
    groups.set(key, [...(groups.get(key) ?? []), product])
  }

  return [...groups.values()].map((group) => {
    const first = group[0]!
    const values = group
      .map((item) => item.value)
      .filter((value): value is number => value != null && Number.isFinite(value))
    const min = Math.min(...values)
    const varies = values.some((value) => value !== min)
    return {
      entitySlug: first.entitySlug,
      category: first.category,
      categoryLabel: first.categoryLabel,
      product: first.product,
      metric: values.length ? `${label} ${varies ? 'desde ' : ''}${formatRate(min)}` : undefined,
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
        metric: `TNA ${formatRate(row.tna)}`,
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
      const metric = isPositive(row.tnaClientes)
        ? `TNA ${formatRate(row.tnaClientes)}`
        : isPositive(best)
          ? `TNA hasta ${formatRate(best)}`
          : undefined
      return {
        category: 'plazos-fijos',
        product: 'Plazo fijo tradicional',
        metric,
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
      metric: isPositive(row.tna) ? `TNA ${formatRate(row.tna)}` : undefined,
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
        metric: isPositive(best) ? `TNA hasta ${formatRate(best)}` : undefined,
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
          metric: showTna && isPositive(tna) ? `TNA ${formatRate(tna)}` : undefined,
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
      metric: isPositive(row.tna) ? `TNA ${formatRate(row.tna)}` : undefined,
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
      const best = Math.max(0, ...yields.map((item) => item.apy))
      return {
        category: 'criptomonedas',
        product: 'Rendimientos en cripto',
        metric: coins
          ? `Hasta ${formatRate(best / 100)} APY · ${coins} ${coins === 1 ? 'moneda' : 'monedas'}`
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
      metric: isPositive(row.tasa) ? `TNA ${formatRate(row.tasa)}` : undefined,
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
      value: row.arancel,
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
      value: row.tasa,
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
      metric:
        row.comisionAnual != null && Number.isFinite(row.comisionAnual)
          ? `Comisión ${formatRate(row.comisionAnual)}`
          : undefined,
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
      metric: isPositive(row.tna) ? `TNA ${formatRate(row.tna)}` : undefined,
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
      value: row.tna,
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

export function mapRemesas(raw: unknown): EntityProductsResult {
  return collect(
    rowsOf<RemesaRow>(raw, 'remesas'),
    (row) => [row.compania],
    (row) => {
      const cost = row.costoRecibirPagos?.trim()
      return {
        category: 'remesas',
        product: 'Recibir pagos del exterior',
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

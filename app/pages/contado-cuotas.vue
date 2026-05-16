<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { PlanInputMode, ProductScenario } from '~/types/product-scenarios'
import {
  compareContadoVsCuotas,
  effectiveAnnualRateFromMonthlyCurve,
  impliedTeaFromDiscount,
  impliedTeaFromRecargo,
} from '~/lib/finance/contado-cuotas'
import ContadoCuotasCarryAllocationChart from '~/components/charts/ContadoCuotasCarryAllocationChart.vue'
import ContadoCuotasCarryBalanceChart from '~/components/charts/ContadoCuotasCarryBalanceChart.vue'
import type { AccountItem } from '~/composables/useAccounts'
import type { FciVariableUltimoFund } from '~/composables/useFciVariablesUltimo'
import type { ProcessedFund } from '~/types/investments'
import { ogUpdatedAtDate } from '~/utils/og-data'
import {
  simulateInvestmentCarry,
  type InvestmentCarryOption,
} from '~/lib/finance/contado-cuotas-carry'

definePageMeta({
  pageTitle: 'Contado vs Cuotas',
  pageDescription:
    'Compará si conviene pagar al contado o en cuotas usando la inflación esperada REM de Argentina.',
})

useSeoMeta({
  title: 'Contado vs Cuotas',
  description:
    'Simulá una compra y compará contado contra cuotas con tasa implícita y valor presente usando la REM esperada.',
  ogTitle: 'Contado vs Cuotas - Compara Tasas',
  ogDescription:
    'Compará el costo implícito de pagar en cuotas contra el contado usando inflación esperada REM.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/contado-cuotas' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/contado-cuotas' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/contado-cuotas' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Contado vs Cuotas - Compara Tasas',
        description:
          'Simulador para comparar el costo de pagar al contado o en cuotas usando la inflación esperada REM.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
})

interface HeatmapRow {
  label: number
  cells: Array<{
    count: number
    tea: number
  }>
}

interface CarrySelectableOption extends InvestmentCarryOption {
  category: 'garantizado' | 'especial' | 'variable-muy-bajo' | 'variable-moderado'
}

interface CarryOptionGroup {
  key: CarrySelectableOption['category']
  title: string
  description: string
  options: CarrySelectableOption[]
}

const installmentCountOptions = [1, 3, 6, 9, 12, 18, 24]
const recargoRows = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36]
const recargoCounts = [1, 2, 6, 12, 18, 24]
const discountRows = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26]
const discountCounts = [1, 3, 6, 12, 18, 24]

const {
  inflacionREM,
  loading: loadingRem,
  error: errorRem,
  fetch: fetchInflacionRem,
  informeDate: remInformeDate,
} = useInflacionREM()
const {
  accounts,
  specialAccounts,
  loading: loadingAccounts,
  error: errorAccounts,
  fetch: fetchAccounts,
} = useAccounts()
const {
  funds: fciVariablesFunds,
  loading: loadingFciVariables,
  error: errorFciVariables,
  fetch: fetchFciVariablesUltimo,
} = useFciVariablesUltimo()
const { allFundsCache, data: fundsData, loading: loadingFunds, error: errorFunds } = useFunds()

await Promise.all([fetchInflacionRem(), fetchAccounts(), fetchFciVariablesUltimo()])

const carrySelectionInitialized = ref(false)

function getQueryString(value: string | string[] | null | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}

function parseQueryNumber(
  value: string | string[] | null | undefined,
  fallback: number,
  options: {
    integer?: boolean
    min?: number
  } = {},
): number {
  const normalized = getQueryString(value)
  const parsed = options.integer ? Number.parseInt(normalized ?? '', 10) : Number(normalized)

  if (!Number.isFinite(parsed)) return fallback

  const constrained = Math.max(options.min ?? Number.NEGATIVE_INFINITY, parsed)
  return options.integer ? Math.round(constrained) : constrained
}

function normalizePlanInputMode(value: string | string[] | null | undefined): PlanInputMode {
  return getQueryString(value) === 'total' ? 'total' : 'installment'
}

function sanitizeNumberForQuery(
  value: number | null | undefined,
  fallback: number,
  options: {
    integer?: boolean
    min?: number
  } = {},
): string {
  const parsed = Number(value)
  const nextValue = Number.isFinite(parsed) ? parsed : fallback
  const constrained = Math.max(options.min ?? Number.NEGATIVE_INFINITY, nextValue)
  return String(options.integer ? Math.round(constrained) : constrained)
}

const cashPriceQuery = useRouteQuery('contado', '999999')
const installmentCountQuery = useRouteQuery('cuotas', '18')
const inputModeQuery = useRouteQuery<PlanInputMode>('modo', 'installment')
const installmentAmountQuery = useRouteQuery('valorCuota', '55555.5')
const financedTotalQuery = useRouteQuery('totalFinanciado', '999999')
const carryQuery = useRouteQuery<string | undefined>('carry', undefined)
const productQuery = useRouteQuery<string | undefined>('producto', undefined)

const cashPrice = computed<number>({
  get: () => parseQueryNumber(cashPriceQuery.value, 1_000_000, { min: 0 }),
  set: (value) => {
    cashPriceQuery.value = sanitizeNumberForQuery(value, 1_000_000, { min: 0 })
  },
})

const installmentCount = computed<number>({
  get: () => parseQueryNumber(installmentCountQuery.value, 12, { integer: true, min: 1 }),
  set: (value) => {
    installmentCountQuery.value = sanitizeNumberForQuery(value, 12, { integer: true, min: 1 })
  },
})

const inputMode = computed<PlanInputMode>({
  get: () => normalizePlanInputMode(inputModeQuery.value),
  set: (value) => {
    inputModeQuery.value = value
  },
})

const installmentAmountInput = computed<number>({
  get: () => parseQueryNumber(installmentAmountQuery.value, 100_000, { min: 0 }),
  set: (value) => {
    installmentAmountQuery.value = sanitizeNumberForQuery(value, 100_000, { min: 0 })
  },
})

const financedTotalInput = computed<number>({
  get: () => parseQueryNumber(financedTotalQuery.value, 1_200_000, { min: 0 }),
  set: (value) => {
    financedTotalQuery.value = sanitizeNumberForQuery(value, 1_200_000, { min: 0 })
  },
})

const selectedCarryOptionIds = computed<string[]>({
  get: () => {
    const normalized = getQueryString(carryQuery.value)
    if (!normalized) return []

    return [
      ...new Set(
        normalized
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ]
  },
  set: (value) => {
    const normalized = [...new Set(value.map((item) => item.trim()).filter(Boolean))]
    carryQuery.value = normalized.length ? normalized.join(',') : undefined
  },
})

const { productScenarios, isSamePriceInstallmentLabel } = useProductScenarios()
const summarySectionRef = ref<HTMLElement | null>(null)
const productPanelReservedSpace = ref(220)

const selectedProductScenarioId = computed<string | undefined>({
  get: () => {
    const normalized = getQueryString(productQuery.value)
    if (!normalized) return undefined
    return productScenarios.some((product) => product.id === normalized) ? normalized : undefined
  },
  set: (value) => {
    productQuery.value = value || undefined
  },
})

const selectedProductScenario = computed(() => {
  return productScenarios.find((product) => product.id === selectedProductScenarioId.value) ?? null
})

const planInputTabs: TabsItem[] = [
  {
    label: 'Valor de cuota',
    value: 'installment',
    slot: 'installment' as const,
  },
  {
    label: 'Total financiado',
    value: 'total',
    slot: 'total' as const,
  },
]

const selectedPlanInputTab = computed({
  get: () => inputMode.value,
  set: (value: string | number) => {
    inputMode.value = value === 'total' ? 'total' : 'installment'
  },
})

function applyProductScenario(product: ProductScenario) {
  selectedProductScenarioId.value = product.id
  cashPrice.value = product.cashPrice
  installmentCount.value = product.installmentCount
  inputMode.value = product.inputMode

  const total =
    product.financedTotal ??
    (product.installmentAmount != null
      ? product.installmentAmount * Math.max(1, product.installmentCount)
      : product.cashPrice)

  const installment = product.installmentAmount ?? total / Math.max(1, product.installmentCount)

  installmentAmountInput.value = installment
  financedTotalInput.value = total
}

function scrollSummaryIntoViewIfNeeded() {
  if (!import.meta.client || !summarySectionRef.value) return

  const rect = summarySectionRef.value.getBoundingClientRect()
  const isVisible = rect.bottom > 0 && rect.top < window.innerHeight

  if (isVisible) return

  summarySectionRef.value.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

async function handleProductScenarioClick(product: ProductScenario) {
  applyProductScenario(product)
  await nextTick()
  scrollSummaryIntoViewIfNeeded()
}

function handleProductPanelHeightChange(height: number) {
  productPanelReservedSpace.value = Math.max(220, height + 32)
}

watch(
  selectedProductScenarioId,
  (id, previousId) => {
    if (!id || id === previousId) return

    const product = productScenarios.find((item) => item.id === id)
    if (product) applyProductScenario(product)
  },
  { immediate: true },
)

watch(inputMode, (newMode, oldMode) => {
  if (newMode === oldMode) return

  const previousInstallment =
    oldMode === 'installment'
      ? installmentAmountInput.value
      : financedTotalInput.value / Math.max(1, installmentCount.value)

  installmentAmountInput.value = previousInstallment
  financedTotalInput.value = previousInstallment * installmentCount.value
})

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return currencyFormatter.format(value)
}

function formatPercentFromFraction(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return (
    new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value * 100) + '%'
  )
}

function formatSignedCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : '-'}${formatCurrency(Math.abs(value))}`
}

function formatPercentLabel(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return (
    new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value) + '%'
  )
}

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function addMonthsToYearMonth(ym: string, delta: number): string {
  const [year, month] = ym.split('-').map(Number)
  const totalMonths = year * 12 + (month - 1) + delta
  const nextYear = Math.floor(totalMonths / 12)
  const nextMonth = (totalMonths % 12) + 1
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

const remByMonth = computed(() => {
  const map = new Map<string, number>()
  for (const item of inflacionREM.value) {
    map.set(item.fecha.slice(0, 7), item.valor / 100)
  }
  return map
})

const lastKnownRemMonthly = computed(() => {
  const last = inflacionREM.value[inflacionREM.value.length - 1]
  return last ? last.valor / 100 : null
})

function getFutureRemRates(months: number): number[] {
  const fallback = lastKnownRemMonthly.value
  if (months < 1 || fallback == null) return []

  const startYm = currentYearMonth()
  const out: number[] = []

  for (let i = 1; i <= months; i++) {
    const ym = addMonthsToYearMonth(startYm, i)
    out.push(remByMonth.value.get(ym) ?? fallback)
  }

  return out
}

const next12RemRates = computed(() => getFutureRemRates(12))

const remExpectedAnnual = computed(() => {
  return effectiveAnnualRateFromMonthlyCurve(next12RemRates.value)
})

const remExpectedMonthlyAvg = computed(() => {
  if (next12RemRates.value.length === 0) return null
  const avg =
    next12RemRates.value.reduce((acc, value) => acc + value, 0) / next12RemRates.value.length
  return avg
})

function formatRemInforme(value: string | null): string {
  if (!value) return ''
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return value

  const date = new Date(year, month - 1)
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const remInformeLabel = computed(() => formatRemInforme(remInformeDate.value))

const installmentAmount = computed(() => {
  if (inputMode.value === 'installment') return installmentAmountInput.value
  return financedTotalInput.value / Math.max(1, installmentCount.value)
})

const financedTotal = computed(() => installmentAmount.value * installmentCount.value)

const comparison = computed(() => {
  if (cashPrice.value <= 0 || installmentAmount.value <= 0 || installmentCount.value < 1)
    return null

  return compareContadoVsCuotas({
    cashPrice: cashPrice.value,
    installmentAmount: installmentAmount.value,
    installmentCount: installmentCount.value,
    monthlyInflationRates: getFutureRemRates(installmentCount.value),
  })
})

const neutralThreshold = computed(() => Math.max(cashPrice.value * 0.001, 1))

const recommendation = computed<'cuotas' | 'contado' | 'indiferente' | null>(() => {
  const delta = comparison.value?.ahorroVsContado
  if (delta == null) return null
  if (Math.abs(delta) <= neutralThreshold.value) return 'indiferente'
  return delta > 0 ? 'cuotas' : 'contado'
})

const recommendationColor = computed(() => {
  if (recommendation.value === 'cuotas') return 'success'
  if (recommendation.value === 'contado') return 'error'
  return 'warning'
})

const scenarioNominalLabel = computed(() => {
  const recargo = comparison.value?.recargoNominalFraction
  if (recargo == null) return '—'
  return recargo >= 0 ? 'Recargo nominal' : 'Descuento nominal'
})

const scenarioNominalValue = computed(() => {
  const recargo = comparison.value?.recargoNominalFraction
  return recargo == null ? null : Math.abs(recargo)
})

const explanationText = computed(() => {
  if (recommendation.value === 'cuotas') {
    return 'Con la REM actual, el valor presente de las cuotas queda por debajo del precio contado.'
  }
  if (recommendation.value === 'contado') {
    return 'Con la REM actual, el valor presente de las cuotas queda por encima del precio contado.'
  }
  if (recommendation.value === 'indiferente') {
    return 'Con la REM actual, ambas opciones quedan prácticamente empatadas en términos reales.'
  }
  return 'Necesitamos la REM para comparar en términos reales.'
})

const ogVerdict = computed(() => {
  if (recommendation.value === 'cuotas') return 'Convienen las cuotas'
  if (recommendation.value === 'contado') return 'Conviene pagar contado'
  if (recommendation.value === 'indiferente') return 'Quedan casi empatados'
  return 'Comparación con REM'
})

defineOgImage('ContadoCuotas.takumi', {
  title: 'Contado vs Cuotas',
  subtitle:
    'Simulá una compra, compará contado contra cuotas y descontá por inflación esperada REM.',
  updatedAt: ogUpdatedAtDate(),
  verdict: ogVerdict,
  explanation: explanationText,
  cashPrice: computed(() => formatCurrency(cashPrice.value)),
  installmentCount: computed(() => String(installmentCount.value)),
  installmentAmount: computed(() => formatCurrency(installmentAmount.value)),
  financedTotal: computed(() => formatCurrency(financedTotal.value)),
  nominalLabel: scenarioNominalLabel,
  nominalValue: computed(() => formatPercentFromFraction(scenarioNominalValue.value)),
  implicitTea: computed(() => formatPercentFromFraction(comparison.value?.implicitTea)),
  remAnnual: computed(() => formatPercentFromFraction(remExpectedAnnual.value)),
  presentValue: computed(() => formatCurrency(comparison.value?.presentValueAtInflation)),
})

function buildHeatmapRows(
  labels: number[],
  counts: number[],
  kind: 'recargo' | 'discount',
): HeatmapRow[] {
  return labels.map((label) => ({
    label,
    cells: counts.map((count) => ({
      count,
      tea:
        kind === 'recargo'
          ? impliedTeaFromRecargo(label, count)
          : impliedTeaFromDiscount(label, count),
    })),
  }))
}

const recargoHeatmap = computed(() => buildHeatmapRows(recargoRows, recargoCounts, 'recargo'))
const discountHeatmap = computed(() => buildHeatmapRows(discountRows, discountCounts, 'discount'))

function getHeatmapToneClass(tea: number): string {
  if (!Number.isFinite(tea)) {
    return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400'
  }

  if (tea < 0) {
    return 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-200'
  }

  const rem = remExpectedAnnual.value
  if (rem == null || rem <= 0) {
    if (tea <= 0.2)
      return 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-200'
    if (tea <= 0.4) return 'bg-lime-100 text-lime-950 dark:bg-lime-950/50 dark:text-lime-200'
    if (tea <= 0.7) return 'bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-200'
    return 'bg-rose-100 text-rose-950 dark:bg-rose-950/50 dark:text-rose-200'
  }

  const ratio = tea / rem
  if (ratio <= 0.8) {
    return 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-200'
  }
  if (ratio <= 1.05) {
    return 'bg-lime-100 text-lime-950 dark:bg-lime-950/50 dark:text-lime-200'
  }
  if (ratio <= 1.3) {
    return 'bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-200'
  }
  return 'bg-rose-100 text-rose-950 dark:bg-rose-950/50 dark:text-rose-200'
}

function mapAccountCarryOption(
  item: AccountItem,
  category: CarrySelectableOption['category'],
): CarrySelectableOption {
  return {
    id: `account:${item.fondo}`,
    label: item.fondo,
    tna: item.tna,
    tope: item.tope,
    typeLabel: item.typeLabel,
    logo: item.logo,
    category,
  }
}

function mapFundCarryOption(
  item: ProcessedFund | FciVariableUltimoFund,
  category: CarrySelectableOption['category'],
): CarrySelectableOption {
  const label = item.displayName || item.fondo
  return {
    id: `fund:${item.institution}:${label}:${item.type || 'fund'}`,
    label,
    tna: item.tna,
    tope: 'tope' in item ? (item.tope ?? null) : null,
    typeLabel: item.typeLabel,
    logo: item.logo,
    category,
  }
}

const resolvedFundsAccounts = computed<ProcessedFund[]>(() => {
  const accountsFunds = allFundsCache.value.filter((item) => item?.meta?.showInAccounts)
  const mercadoDineroFunds = fundsData.value.mercadoDinero.filter((item) => item?.meta?.showInFunds)
  const combined = [...accountsFunds, ...mercadoDineroFunds, ...fciVariablesFunds.value]

  const seen = new Set<string>()
  return combined
    .filter((item) => {
      const key = `${item.fondo}-${item.institution}-${item.displayName}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => b.tna - a.tna)
})

const carryOptionGroups = computed<CarryOptionGroup[]>(() => {
  const guaranteed = accounts.value.map((item) => mapAccountCarryOption(item, 'garantizado'))
  const special = specialAccounts.value.map((item) => mapAccountCarryOption(item, 'especial'))

  const veryLowRisk = resolvedFundsAccounts.value
    .filter((fund) => {
      const type = fund.type || ''
      return type === 'mercadoDinero' || type === 'fciVariablesUltimo' || type === ''
    })
    .map((fund) => mapFundCarryOption(fund, 'variable-muy-bajo'))

  const moderateRisk = resolvedFundsAccounts.value
    .filter((fund) => ['rentaFija', 'rentaMixta', 'retornoTotal'].includes(fund.type || ''))
    .map((fund) => mapFundCarryOption(fund, 'variable-moderado'))

  return [
    {
      key: 'garantizado',
      title: 'Rendimiento garantizado',
      description: 'Cuentas remuneradas y billeteras con tasa fija garantizada.',
      options: guaranteed,
    },
    {
      key: 'especial',
      title: 'Con condiciones especiales',
      description: 'Productos con requisitos o condiciones particulares para acceder.',
      options: special,
    },
    {
      key: 'variable-muy-bajo',
      title: 'Rendimiento variable · Riesgo muy bajo',
      description: 'Money market, billeteras y fondos de liquidez inmediata.',
      options: veryLowRisk,
    },
    {
      key: 'variable-moderado',
      title: 'Rendimiento variable · Riesgo moderado',
      description: 'Fondos conservadores con retorno variable según mercado.',
      options: moderateRisk,
    },
  ].filter((group) => group.options.length > 0)
})

function getCarryCategoryPriority(category: CarrySelectableOption['category']): number {
  switch (category) {
    case 'garantizado':
      return 0
    case 'especial':
      return 1
    case 'variable-muy-bajo':
      return 2
    case 'variable-moderado':
      return 3
    default:
      return 99
  }
}

const carryOptions = computed<CarrySelectableOption[]>(() => {
  const combined = carryOptionGroups.value.flatMap((group) => group.options)
  const unique = new Map<string, CarrySelectableOption>()

  for (const option of combined) {
    if (!unique.has(option.id)) {
      unique.set(option.id, option)
    }
  }

  return [...unique.values()].sort((a, b) => {
    if (b.tna !== a.tna) return b.tna - a.tna
    return a.label.localeCompare(b.label)
  })
})

function isPreferredCarryCategory(category: CarrySelectableOption['category']): boolean {
  return category === 'garantizado' || category === 'especial'
}

function sortPreferredCarryOptions(a: CarrySelectableOption, b: CarrySelectableOption): number {
  if (b.tna !== a.tna) return b.tna - a.tna

  const categoryPriorityDiff =
    getCarryCategoryPriority(a.category) - getCarryCategoryPriority(b.category)
  if (categoryPriorityDiff !== 0) return categoryPriorityDiff

  return a.label.localeCompare(b.label)
}

function sortVariableCarryOptions(a: CarrySelectableOption, b: CarrySelectableOption): number {
  const categoryPriorityDiff =
    getCarryCategoryPriority(a.category) - getCarryCategoryPriority(b.category)
  if (categoryPriorityDiff !== 0) return categoryPriorityDiff
  if (b.tna !== a.tna) return b.tna - a.tna
  return a.label.localeCompare(b.label)
}

function pushCarryOptionsUntilCovered(
  target: string[],
  options: CarrySelectableOption[],
  currentCovered: number,
): { covered: number; isComplete: boolean } {
  let covered = currentCovered

  for (const option of options) {
    target.push(option.id)

    if (option.tope == null) {
      return { covered, isComplete: true }
    }

    covered += Math.max(0, option.tope)

    if (covered >= cashPrice.value) {
      return { covered, isComplete: true }
    }
  }

  return { covered, isComplete: false }
}

function getSuggestedCarryOptionIds(): string[] {
  const preferredOptions = carryOptions.value
    .filter((option) => isPreferredCarryCategory(option.category))
    .sort(sortPreferredCarryOptions)

  const variableOptions = carryOptions.value
    .filter((option) => !isPreferredCarryCategory(option.category))
    .sort(sortVariableCarryOptions)

  const selected: string[] = []
  const preferredResult = pushCarryOptionsUntilCovered(selected, preferredOptions, 0)

  if (preferredResult.isComplete) {
    return selected
  }

  pushCarryOptionsUntilCovered(selected, variableOptions, preferredResult.covered)
  return selected
}

function applySuggestedCarrySelection() {
  selectedCarryOptionIds.value = getSuggestedCarryOptionIds()
}

function clearCarrySelection() {
  selectedCarryOptionIds.value = []
}

function toggleCarryOption(id: string) {
  if (selectedCarryOptionIds.value.includes(id)) {
    selectedCarryOptionIds.value = selectedCarryOptionIds.value.filter((item) => item !== id)
    return
  }
  selectedCarryOptionIds.value = [...selectedCarryOptionIds.value, id]
}

watch(
  carryOptions,
  (options) => {
    if (!carrySelectionInitialized.value && options.length > 0) {
      applySuggestedCarrySelection()
      carrySelectionInitialized.value = true
    }
  },
  { immediate: true },
)

const selectedCarryOptions = computed(() => {
  const selectedSet = new Set(selectedCarryOptionIds.value)
  return carryOptions.value.filter((option) => selectedSet.has(option.id))
})

const carrySimulation = computed(() => {
  if (
    selectedCarryOptions.value.length === 0 ||
    cashPrice.value <= 0 ||
    installmentAmount.value <= 0 ||
    installmentCount.value < 1
  ) {
    return null
  }

  return simulateInvestmentCarry({
    initialCash: cashPrice.value,
    installmentAmount: installmentAmount.value,
    installmentCount: installmentCount.value,
    selectedOptions: selectedCarryOptions.value,
  })
})

const carryWeightedTna = computed(() => {
  const allocations = carrySimulation.value?.allocations ?? []
  if (!allocations.length || cashPrice.value <= 0) return null

  const weighted = allocations.reduce((acc, allocation) => {
    return acc + allocation.initialAmount * allocation.tna
  }, 0)

  return weighted / cashPrice.value
})

const carryRecommendation = computed<'cuotas' | 'contado' | 'indiferente' | null>(() => {
  const net = carrySimulation.value?.netOutcome
  if (net == null) return null
  if (Math.abs(net) <= neutralThreshold.value) return 'indiferente'
  return net > 0 ? 'cuotas' : 'contado'
})

const carryRecommendationColor = computed(() => {
  if (carryRecommendation.value === 'cuotas') return 'success'
  if (carryRecommendation.value === 'contado') return 'error'
  return 'warning'
})

const carryExplanationText = computed(() => {
  if (selectedCarryOptions.value.length === 0) {
    return 'Elegí una o más opciones para simular qué pasa si invertís el efectivo mientras pagás.'
  }
  if (carryRecommendation.value === 'cuotas') {
    return 'Con esta combinación, el rendimiento estimado alcanza para pagar las cuotas y todavía dejar un sobrante.'
  }
  if (carryRecommendation.value === 'contado') {
    return 'Con esta combinación, el rendimiento no compensa del todo el costo del plan y terminás peor que pagando al contado.'
  }
  return 'Con esta combinación, el resultado queda casi empatado frente a pagar al contado hoy.'
})

const carrySectionLoading = computed(() => {
  return loadingAccounts.value || loadingFciVariables.value || loadingFunds.value
})
</script>

<template>
  <div class="space-y-6" :style="{ paddingBottom: `${productPanelReservedSpace}px` }">
    <UAlert
      v-if="errorRem"
      color="warning"
      variant="soft"
      title="No se pudo cargar la REM"
      description="Mostramos la simulación, pero la comparación real contra inflación puede no estar disponible."
    />

    <UAlert
      v-if="errorAccounts || errorFciVariables || errorFunds"
      color="warning"
      variant="soft"
      title="Algunas opciones de inversión no pudieron cargarse"
      description="La simulación de invertir el efectivo podría mostrar menos alternativas que las disponibles en cuentas y billeteras."
    />

    <ProductScenariosRail
      v-if="productScenarios.length"
      floating
      minimizable
      :selected-product-id="selectedProductScenarioId"
      subtitle="Elegí un producto para cargar automáticamente la simulación."
      action-label="Cargar simulación"
      @select="handleProductScenarioClick"
      @height-change="handleProductPanelHeightChange"
    />

    <div v-if="loadingRem" class="py-8">
      <FundsLoading />
    </div>

    <template v-else>
      <div class="space-y-4 2xl:space-y-5">
        <div class="grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <UCard class="overflow-visible">
            <template #header>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-sliders-horizontal"
                    class="size-5 text-primary-600 dark:text-primary-400"
                  />
                  <h2 class="text-lg font-semibold">Configurá la simulación</h2>
                </div>
                <p class="text-sm text-neutral-500">
                  Ingresá el escenario paso a paso: primero el contado, después las cuotas y por
                  último el plan financiado.
                </p>
              </div>
            </template>

            <div class="space-y-4">
              <div
                class="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold dark:bg-neutral-800"
                  >
                    1
                  </div>
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-neutral-900 dark:text-white">
                      Precio de contado
                    </p>
                    <p class="text-sm text-neutral-500">
                      Este es el valor base contra el que se compara todo el plan.
                    </p>
                  </div>
                </div>

                <UFormField label="Precio de contado">
                  <UInputNumber
                    v-model="cashPrice"
                    :min="0"
                    :step="1"
                    :format-options="{
                      useGrouping: true,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }"
                  />
                </UFormField>
              </div>

              <div
                class="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold dark:bg-neutral-800"
                  >
                    2
                  </div>
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-neutral-900 dark:text-white">
                      Cantidad de cuotas
                    </p>
                    <p class="text-sm text-neutral-500">
                      Elegí la duración del plan o escribí manualmente otra cantidad.
                    </p>
                  </div>
                </div>

                <UFormField label="Cantidad de cuotas">
                  <UInputNumber v-model="installmentCount" :min="1" :max="60" :step="1" />
                  <template #hint>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                      <UButton
                        v-for="count in installmentCountOptions"
                        :key="count"
                        size="xs"
                        color="neutral"
                        :variant="installmentCount === count ? 'solid' : 'outline'"
                        :label="`${count} cuotas`"
                        @click="installmentCount = count"
                      />
                    </div>
                  </template>
                </UFormField>
              </div>

              <div
                class="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold dark:bg-neutral-800"
                  >
                    3
                  </div>
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-neutral-900 dark:text-white">
                      Carga del plan financiado
                    </p>
                    <p class="text-sm text-neutral-500">
                      Podés ingresar el escenario por valor de cuota o por costo total financiado.
                    </p>
                  </div>
                </div>

                <UTabs
                  v-model="selectedPlanInputTab"
                  :items="planInputTabs"
                  color="neutral"
                  variant="pill"
                  size="sm"
                  class="w-full"
                >
                  <template #installment>
                    <div class="mt-3 grid gap-4 md:grid-cols-2">
                      <UFormField label="Valor de cada cuota">
                        <UInputNumber
                          v-model="installmentAmountInput"
                          :min="0"
                          :step="0.01"
                          :format-options="{
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          }"
                        />
                      </UFormField>

                      <UFormField label="Total financiado">
                        <UInput :model-value="formatCurrency(financedTotal)" readonly disabled />
                      </UFormField>
                    </div>
                  </template>

                  <template #total>
                    <div class="mt-3 grid gap-4 md:grid-cols-2">
                      <UFormField label="Costo total en cuotas">
                        <UInputNumber
                          v-model="financedTotalInput"
                          :min="0"
                          :step="0.01"
                          :format-options="{
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          }"
                        />
                      </UFormField>

                      <UFormField label="Valor de cada cuota">
                        <UInput
                          :model-value="formatCurrency(installmentAmount)"
                          readonly
                          disabled
                        />
                      </UFormField>
                    </div>
                  </template>
                </UTabs>
              </div>
            </div>
          </UCard>

          <div ref="summarySectionRef">
            <UCard class="overflow-hidden md:sticky md:top-24 md:self-start">
              <template #header>
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-layout-dashboard"
                      class="size-5 text-primary-600 dark:text-primary-400"
                    />
                    <h2 class="text-lg font-semibold">Resumen</h2>
                  </div>
                  <p class="text-sm text-neutral-500">
                    Acá ves el impacto nominal y real del escenario mientras cargás los datos.
                  </p>
                </div>
              </template>

              <div class="space-y-4">
                <div
                  class="rounded-2xl border p-4"
                  :class="
                    recommendation === 'cuotas'
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
                      : recommendation === 'contado'
                        ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30'
                        : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
                  "
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-xs uppercase tracking-wide text-neutral-500">Resultado</p>
                      <p class="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                        {{
                          recommendation === 'cuotas'
                            ? 'Convienen las cuotas'
                            : recommendation === 'contado'
                              ? 'Conviene el contado'
                              : 'Muy parejo'
                        }}
                      </p>
                    </div>
                    <UBadge :color="recommendationColor" variant="soft" size="lg">
                      {{
                        recommendation === 'cuotas'
                          ? 'Cuotas'
                          : recommendation === 'contado'
                            ? 'Contado'
                            : 'Empate'
                      }}
                    </UBadge>
                  </div>
                  <p class="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
                    {{ explanationText }}
                  </p>
                  <div
                    v-if="selectedProductScenario"
                    class="mt-4 overflow-hidden rounded-2xl border border-white/70 bg-white/80 dark:border-white/10 dark:bg-white/5"
                  >
                    <div class="flex items-stretch">
                      <div
                        class="flex h-24 w-28 shrink-0 items-center justify-center bg-white p-2 dark:bg-white"
                      >
                        <img
                          v-if="selectedProductScenario.imageUrl"
                          :src="selectedProductScenario.imageUrl"
                          :alt="selectedProductScenario.name"
                          class="h-full w-full object-contain"
                          loading="lazy"
                        />
                        <div
                          v-else
                          class="flex h-full w-full items-center justify-center text-neutral-400"
                        >
                          <UIcon name="i-lucide-image" class="size-8" />
                        </div>
                      </div>

                      <div class="min-w-0 flex-1 space-y-2 p-3">
                        <div class="space-y-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <p
                              v-if="selectedProductScenario.merchant"
                              class="text-xs text-neutral-500 dark:text-neutral-400"
                            >
                              {{ selectedProductScenario.merchant }}
                            </p>
                          </div>
                          <p
                            class="line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-white"
                          >
                            {{ selectedProductScenario.name }}
                          </p>
                        </div>

                        <div class="flex flex-wrap gap-1.5">
                          <UBadge color="neutral" variant="outline" size="sm">
                            {{
                              selectedProductScenario.priceLabel ||
                              formatCurrency(selectedProductScenario.cashPrice)
                            }}
                          </UBadge>
                          <UBadge
                            :color="
                              isSamePriceInstallmentLabel(selectedProductScenario.installmentLabel)
                                ? 'success'
                                : 'neutral'
                            "
                            :variant="
                              isSamePriceInstallmentLabel(selectedProductScenario.installmentLabel)
                                ? 'soft'
                                : 'outline'
                            "
                            size="sm"
                          >
                            {{
                              selectedProductScenario.installmentLabel ||
                              `${selectedProductScenario.installmentCount} cuotas`
                            }}
                          </UBadge>
                        </div>

                        <UButton
                          :to="selectedProductScenario.affiliateUrl"
                          external
                          target="_blank"
                          rel="noopener noreferrer"
                          size="xs"
                          color="neutral"
                          icon="i-lucide-arrow-up-right"
                        >
                          Ver producto
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4 xl:grid-cols-2">
                  <div
                    class="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
                  >
                    <div class="flex items-center gap-2">
                      <UIcon
                        name="i-lucide-banknote"
                        class="size-4 text-primary-600 dark:text-primary-400"
                      />
                      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        Contado
                      </p>
                    </div>

                    <div
                      class="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                    >
                      <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                        Pagás hoy
                      </p>
                      <p class="mt-1 text-2xl font-semibold">{{ formatCurrency(cashPrice) }}</p>
                    </div>

                    <div
                      class="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                    >
                      <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                        Referencia
                      </p>
                      <p class="mt-1 text-2xl font-semibold">100%</p>
                      <p class="mt-1 text-xs text-neutral-500">
                        Base de comparación frente a cualquier esquema financiado.
                      </p>
                    </div>

                    <div
                      class="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                    >
                      <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                        Ahorro / pérdida
                      </p>
                      <p class="mt-1 text-2xl font-semibold">
                        {{ formatSignedCurrency(comparison?.ahorroVsContado) }}
                      </p>
                      <p class="mt-1 text-xs text-neutral-500">
                        {{ formatPercentFromFraction(comparison?.ahorroVsContadoFraction) }} del
                        contado.
                      </p>
                    </div>
                  </div>

                  <div
                    class="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
                  >
                    <div class="flex items-center gap-2">
                      <UIcon
                        name="i-lucide-credit-card"
                        class="size-4 text-primary-600 dark:text-primary-400"
                      />
                      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        Cuotas
                      </p>
                    </div>

                    <div class="grid gap-3 lg:grid-cols-2">
                      <div
                        class="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                      >
                        <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                          Cuota
                        </p>
                        <p class="mt-1 text-2xl font-semibold">
                          {{ formatCurrency(installmentAmount) }}
                        </p>
                      </div>
                      <div
                        class="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                      >
                        <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                          Total financiado
                        </p>
                        <p class="mt-1 text-2xl font-semibold">
                          {{ formatCurrency(financedTotal) }}
                        </p>
                      </div>
                      <div
                        class="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                      >
                        <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                          {{ scenarioNominalLabel }}
                        </p>
                        <p class="mt-1 text-2xl font-semibold">
                          {{ formatPercentFromFraction(scenarioNominalValue) }}
                        </p>
                      </div>
                      <div
                        class="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                      >
                        <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                          Tasa implícita
                        </p>
                        <p class="mt-1 text-2xl font-semibold">
                          {{ formatPercentFromFraction(comparison?.implicitTea) }} TEA
                        </p>
                      </div>
                      <div
                        class="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                      >
                        <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                          Valor presente
                        </p>
                        <p class="mt-1 text-2xl font-semibold">
                          {{ formatCurrency(comparison?.presentValueAtInflation) }}
                        </p>
                      </div>
                      <div
                        class="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                      >
                        <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                          Cuota de equilibrio
                        </p>
                        <p class="mt-1 text-2xl font-semibold">
                          {{ formatCurrency(comparison?.cuotaEquilibrio) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                >
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                        REM 12 meses
                      </p>
                      <p class="mt-1 text-2xl font-semibold">
                        {{ formatPercentFromFraction(remExpectedAnnual) }}
                      </p>
                    </div>
                    <div>
                      <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                        REM mensual
                      </p>
                      <p class="mt-1 text-2xl font-semibold">
                        {{ formatPercentFromFraction(remExpectedMonthlyAvg) }}
                      </p>
                    </div>
                  </div>
                  <p v-if="remInformeLabel" class="mt-2 text-xs text-neutral-500">
                    Informe {{ remInformeLabel }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <UCard class="overflow-visible">
          <template #header>
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-piggy-bank"
                    class="size-5 text-primary-600 dark:text-primary-400"
                  />
                  <h3 class="text-lg font-semibold">
                    Carry: invertís el efectivo y pagás las cuotas
                  </h3>
                </div>
                <p class="text-sm text-neutral-500">
                  Combiná opciones de
                  <NuxtLink
                    to="/cuentas-billeteras"
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    cuentas y billeteras
                  </NuxtLink>
                  respetando topes para ver si el flujo cierra mejor que pagar contado hoy.
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge color="neutral" variant="outline" size="lg">
                  {{ selectedCarryOptions.length }} seleccionadas
                </UBadge>
                <UButton
                  size="sm"
                  color="primary"
                  variant="outline"
                  label="Combo sugerido"
                  @click="applySuggestedCarrySelection"
                />
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  label="Limpiar"
                  @click="clearCarrySelection"
                />
              </div>
            </div>
          </template>

          <div v-if="carrySectionLoading" class="py-6">
            <FundsLoading />
          </div>

          <div v-else class="space-y-4">
            <div
              class="items-start gap-4 md:grid md:grid-cols-[minmax(0,520px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,760px)_minmax(0,1fr)]"
            >
              <div class="max-w-3xl space-y-4">
                <div
                  class="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 p-3.5 dark:border-neutral-700 dark:bg-neutral-900/30"
                >
                  <div class="space-y-4">
                    <div v-for="group in carryOptionGroups" :key="group.key" class="space-y-2.5">
                      <div class="space-y-1">
                        <h4 class="text-sm font-semibold text-neutral-900 dark:text-white">
                          {{ group.title }}
                        </h4>
                        <p class="text-xs text-neutral-500">
                          {{ group.description }}
                        </p>
                      </div>

                      <div
                        class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
                      >
                        <button
                          v-for="option in group.options"
                          :key="option.id"
                          type="button"
                          class="flex w-full items-start gap-3 border-b border-neutral-200 px-3 py-3 text-left transition-all last:border-b-0 dark:border-neutral-800"
                          :class="
                            selectedCarryOptionIds.includes(option.id)
                              ? 'bg-primary-50 dark:bg-primary-950/30'
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70'
                          "
                          @click="toggleCarryOption(option.id)"
                        >
                          <div class="pt-0.5">
                            <div
                              class="flex size-5 items-center justify-center rounded-full border"
                              :class="
                                selectedCarryOptionIds.includes(option.id)
                                  ? 'border-primary-500 bg-primary-500 text-white dark:border-primary-400 dark:bg-primary-400 dark:text-neutral-900'
                                  : 'border-neutral-300 text-transparent dark:border-neutral-700'
                              "
                            >
                              <UIcon name="i-lucide-check" class="size-3" />
                            </div>
                          </div>

                          <img
                            v-if="option.logo"
                            :src="option.logo"
                            alt=""
                            class="size-9 rounded-full object-contain bg-white p-1 dark:bg-neutral-900"
                          />

                          <div class="min-w-0 flex-1">
                            <div
                              class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
                            >
                              <div class="min-w-0">
                                <p class="truncate font-medium text-neutral-900 dark:text-white">
                                  {{ option.label }}
                                </p>
                                <p class="text-xs text-neutral-500">
                                  {{ option.typeLabel || 'Opción de inversión' }}
                                </p>
                              </div>

                              <div class="flex flex-wrap gap-2 md:justify-end">
                                <UBadge color="primary" variant="soft" size="sm">
                                  {{ formatPercentLabel(option.tna * 100, 2) }} TNA
                                </UBadge>
                                <UBadge color="neutral" variant="outline" size="sm">
                                  {{
                                    option.tope == null
                                      ? 'Sin límite'
                                      : `Tope ${formatCurrency(option.tope)}`
                                  }}
                                </UBadge>
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="w-full space-y-3 md:sticky md:top-24 md:self-start">
                <div
                  v-if="carrySimulation"
                  class="rounded-2xl border p-4"
                  :class="
                    carryRecommendation === 'cuotas'
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
                      : carryRecommendation === 'contado'
                        ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30'
                        : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
                  "
                >
                  <div class="flex flex-col gap-3">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-xs uppercase tracking-wide text-neutral-500">
                          Resultado del carry
                        </p>
                        <p class="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                          {{
                            carryRecommendation === 'cuotas'
                              ? 'Cuotas + inversión ganan'
                              : carryRecommendation === 'contado'
                                ? 'El carry no alcanza'
                                : 'Carry muy parejo'
                          }}
                        </p>
                      </div>
                      <UBadge :color="carryRecommendationColor" variant="soft" size="lg">
                        {{
                          carryRecommendation === 'cuotas'
                            ? 'Carry positivo'
                            : carryRecommendation === 'contado'
                              ? 'Carry negativo'
                              : 'Empate'
                        }}
                      </UBadge>
                    </div>
                    <p class="text-sm text-neutral-700 dark:text-neutral-300">
                      {{ carryExplanationText }}
                    </p>
                  </div>
                </div>

                <UAlert
                  v-else
                  color="neutral"
                  variant="soft"
                  title="Elegí una combinación"
                  description="Seleccioná una o más opciones para simular cómo evoluciona el saldo mientras pagás las cuotas."
                />

                <div
                  v-if="carrySimulation"
                  class="grid gap-3 sm:grid-cols-2 md:grid-cols-1 2xl:grid-cols-2"
                >
                  <div
                    class="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/60"
                  >
                    <p class="text-xs text-neutral-500">Resultado neto final</p>
                    <p class="mt-1 text-xl font-bold">
                      {{ formatSignedCurrency(carrySimulation.netOutcome) }}
                    </p>
                  </div>
                  <div
                    class="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/60"
                  >
                    <p class="text-xs text-neutral-500">Saldo final</p>
                    <p class="mt-1 text-xl font-bold">
                      {{ formatCurrency(carrySimulation.finalBalance) }}
                    </p>
                  </div>
                  <div
                    class="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/60"
                  >
                    <p class="text-xs text-neutral-500">Interés total</p>
                    <p class="mt-1 text-xl font-bold">
                      {{ formatCurrency(carrySimulation.totalInterestEarned) }}
                    </p>
                    <p class="mt-1 text-xs text-neutral-500">
                      TNA ponderada {{ formatPercentFromFraction(carryWeightedTna) }}.
                    </p>
                  </div>
                  <div
                    class="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/60"
                  >
                    <p class="text-xs text-neutral-500">Aporte extra necesario</p>
                    <p class="mt-1 text-xl font-bold">
                      {{ formatCurrency(carrySimulation.cumulativeShortfall) }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="carrySimulation"
                  class="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800"
                >
                  <div class="mb-3 space-y-1">
                    <h3 class="text-lg font-semibold">Asignación inicial</h3>
                    <p class="text-sm text-neutral-500">
                      Se prioriza mayor TNA y se llena cada opción hasta su tope.
                    </p>
                  </div>

                  <ContadoCuotasCarryAllocationChart :allocations="carrySimulation.allocations" />

                  <div class="mt-4 space-y-2">
                    <div
                      v-for="allocation in carrySimulation.allocations"
                      :key="allocation.id"
                      class="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                    >
                      <div class="min-w-0">
                        <p class="truncate font-medium text-neutral-900 dark:text-white">
                          {{ allocation.label }}
                        </p>
                        <p class="text-xs text-neutral-500">
                          {{ formatPercentLabel(allocation.tna * 100, 2) }} TNA ·
                          {{
                            allocation.tope == null
                              ? 'sin límite'
                              : `tope ${formatCurrency(allocation.tope)}`
                          }}
                        </p>
                      </div>
                      <p class="font-medium">{{ formatCurrency(allocation.initialAmount) }}</p>
                    </div>
                  </div>
                </div>

                <div
                  v-if="carrySimulation"
                  class="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800"
                >
                  <div class="mb-3 space-y-1">
                    <h3 class="text-lg font-semibold">Evolución mes a mes</h3>
                    <p class="text-sm text-neutral-500">
                      Cada tramo capitaliza 30 días y después paga la cuota sacando primero del
                      saldo de menor tasa.
                    </p>
                  </div>

                  <ContadoCuotasCarryBalanceChart :points="carrySimulation.points" />
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <div class="grid gap-4 2xl:grid-cols-2 pb-12">
          <UCard>
            <template #header>
              <div class="space-y-1">
                <h3 class="text-lg font-semibold">Costo implícito por recargo en cuotas</h3>
                <p class="text-sm text-neutral-500">
                  Útil cuando el precio financiado tiene un recargo directo sobre el contado.
                </p>
              </div>
            </template>

            <div
              class="mb-4 grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/50"
            >
              <p class="font-medium text-neutral-900 dark:text-white">Cómo leerla</p>
              <ul class="space-y-1.5 text-neutral-600 dark:text-neutral-300">
                <li>
                  • La fila indica el <strong>recargo total</strong> sobre el precio de contado.
                </li>
                <li>• La columna indica la <strong>cantidad de cuotas</strong>.</li>
                <li>
                  • Cada celda muestra la <strong>TEA implícita</strong> de ese plan: cuanto más
                  alta, más caro es financiarse.
                </li>
                <li>
                  • El color compara esa tasa contra la <strong>REM esperada a 12 meses</strong>:
                  más verde, más favorable para cuotas; más rojo, más favorable para contado.
                </li>
              </ul>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr class="border-b border-neutral-200 dark:border-neutral-800">
                    <th class="px-3 py-2 text-left font-semibold">Recargo</th>
                    <th
                      v-for="count in recargoCounts"
                      :key="count"
                      class="px-3 py-2 text-center font-semibold"
                    >
                      {{ count }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in recargoHeatmap"
                    :key="`recargo-${row.label}`"
                    class="border-b border-neutral-100 dark:border-neutral-900"
                  >
                    <th class="px-3 py-2 text-left font-medium">
                      {{ decimalFormatter.format(row.label) }}%
                    </th>
                    <td
                      v-for="cell in row.cells"
                      :key="`recargo-${row.label}-${cell.count}`"
                      class="px-3 py-2 text-center font-medium"
                    >
                      <div class="rounded-md px-2 py-1" :class="getHeatmapToneClass(cell.tea)">
                        {{ formatPercentFromFraction(cell.tea) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <template #footer>
              <div class="space-y-1.5 text-xs text-neutral-500">
                <p>
                  Color contra REM 12 meses:
                  <strong>{{ formatPercentFromFraction(remExpectedAnnual) }}</strong
                  >.
                </p>
                <p>No considera sellos, costos fijos, envío ni beneficios extra.</p>
              </div>
            </template>
          </UCard>

          <UCard>
            <template #header>
              <div class="space-y-1">
                <h3 class="text-lg font-semibold">Costo implícito por descuento de contado</h3>
                <p class="text-sm text-neutral-500">
                  Útil cuando muestran precio de lista financiado y descuento por pago en un pago.
                </p>
              </div>
            </template>

            <div
              class="mb-4 grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/50"
            >
              <p class="font-medium text-neutral-900 dark:text-white">Cómo leerla</p>
              <ul class="space-y-1.5 text-neutral-600 dark:text-neutral-300">
                <li>
                  • La fila indica el <strong>descuento de contado</strong> sobre el precio
                  financiado.
                </li>
                <li>
                  • La columna indica la <strong>cantidad de cuotas</strong> del precio de lista.
                </li>
                <li>
                  • Cada celda muestra la <strong>TEA implícita</strong> de resignar ese descuento y
                  financiar la compra en cuotas iguales.
                </li>
                <li>
                  • Si la tasa implícita queda por debajo de la <strong>REM esperada</strong>, las
                  cuotas tienden a ser relativamente más convenientes; si queda arriba, pesa más
                  pagar de contado.
                </li>
              </ul>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr class="border-b border-neutral-200 dark:border-neutral-800">
                    <th class="px-3 py-2 text-left font-semibold">Descuento</th>
                    <th
                      v-for="count in discountCounts"
                      :key="count"
                      class="px-3 py-2 text-center font-semibold"
                    >
                      {{ count }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in discountHeatmap"
                    :key="`discount-${row.label}`"
                    class="border-b border-neutral-100 dark:border-neutral-900"
                  >
                    <th class="px-3 py-2 text-left font-medium">
                      {{ decimalFormatter.format(row.label) }}%
                    </th>
                    <td
                      v-for="cell in row.cells"
                      :key="`discount-${row.label}-${cell.count}`"
                      class="px-3 py-2 text-center font-medium"
                    >
                      <div class="rounded-md px-2 py-1" :class="getHeatmapToneClass(cell.tea)">
                        {{ formatPercentFromFraction(cell.tea) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <template #footer>
              <div class="space-y-1.5 text-xs text-neutral-500">
                <p>Replica la lógica de precio financiado vs precio especial de contado.</p>
                <p>La tasa mostrada es la TEA implícita, con cuotas iguales mensuales.</p>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </template>
  </div>
</template>

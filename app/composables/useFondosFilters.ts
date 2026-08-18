import type { FundCatalogRow } from '~/composables/useFondosCatalog'
import { isFundReportActive } from '~/lib/fci-fund-active'
import { parseFundClassName } from '~/lib/fci-fund-class'

export type PlazoFilter = '0' | '1' | '2+'

const FILTER_ALL = 'all'

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b, 'es'))
}

function isActiveFilter(value: string) {
  return Boolean(value) && value !== FILTER_ALL
}

function queryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return undefined
}

/** Lee siempre `useRoute().query` para seguir NuxtLink en la misma página. */
function useQueryParam(name: string, defaultValue = '') {
  const route = useRoute()
  const router = useRouter()

  return computed({
    get() {
      return queryString(route.query[name]) ?? defaultValue
    },
    set(value: string) {
      const current = queryString(route.query[name]) ?? defaultValue
      if (value === current) return

      const query = { ...route.query }
      if (value === defaultValue || value === '') {
        delete query[name]
      } else {
        query[name] = value
      }

      router.replace({ query })
    },
  })
}

export function useFondosFilters(allFunds: Ref<FundCatalogRow[]>) {
  const searchQuery = useQueryParam('q')
  const debouncedSearchQuery = refDebounced(searchQuery, 300)
  const selectedTipo = useQueryParam('tipo', FILTER_ALL)
  const selectedHorizonte = useQueryParam('horizonte', FILTER_ALL)
  const selectedMoneda = useQueryParam('moneda', FILTER_ALL)
  const selectedRegion = useQueryParam('region', FILTER_ALL)
  const selectedAdministradora = useQueryParam('admin', FILTER_ALL)
  const selectedDepositaria = useQueryParam('depositaria', FILTER_ALL)
  const selectedPlazo = useQueryParam('plazo', FILTER_ALL)
  const onlyActiveQuery = useQueryParam('activos', '1')
  const onlyActiveFunds = computed({
    get: () => onlyActiveQuery.value !== '0',
    set: (value: boolean) => {
      onlyActiveQuery.value = value ? '1' : '0'
    },
  })
  const pageQuery = useQueryParam('page', '1')
  const pageSizeQuery = useQueryParam('pageSize', '100')

  const pageSizeOptions = [
    { label: '50 por página', value: 50 },
    { label: '100 por página', value: 100 },
    { label: '200 por página', value: 200 },
  ]

  const currentPage = computed<number>({
    get: () => {
      const parsed = Number.parseInt(pageQuery.value, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    },
    set: (value) => {
      pageQuery.value = String(Math.max(1, Math.round(value)))
    },
  })

  const pageSize = computed<number>({
    get: () => {
      const parsed = Number.parseInt(pageSizeQuery.value, 10)
      const allowed = pageSizeOptions.map((option) => option.value)
      return allowed.includes(parsed) ? parsed : 100
    },
    set: (value) => {
      const allowed = pageSizeOptions.map((option) => option.value)
      pageSizeQuery.value = String(allowed.includes(value) ? value : 100)
    },
  })

  const tiposDisponibles = computed(() => {
    const map = new Map<string, string>()
    allFunds.value.forEach((fund) => {
      if (fund.tipoFilterKey) {
        map.set(fund.tipoFilterKey, fund.typeLabel)
      }
    })
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'))
  })

  const horizontesDisponibles = computed(() => uniqueSorted(allFunds.value.map((f) => f.horizonte)))
  const monedasDisponibles = computed(() =>
    uniqueSorted(allFunds.value.map((f) => f.monedaInversion)),
  )
  const regionesDisponibles = computed(() => uniqueSorted(allFunds.value.map((f) => f.region)))
  const administradorasDisponibles = computed(() =>
    uniqueSorted(allFunds.value.map((f) => f.administradora)),
  )
  const depositariasDisponibles = computed(() =>
    uniqueSorted(allFunds.value.map((f) => f.depositaria)),
  )

  const tipoItems = computed(() => [
    { label: 'Todos los tipos', value: FILTER_ALL },
    ...tiposDisponibles.value.map(({ value, label }) => ({ label, value })),
  ])

  const horizonteItems = computed(() => [
    { label: 'Todos los horizontes', value: FILTER_ALL },
    ...horizontesDisponibles.value.map((horizonte) => ({
      label: horizonte,
      value: horizonte,
    })),
  ])

  const monedaItems = computed(() => [
    { label: 'Todas las monedas', value: FILTER_ALL },
    ...monedasDisponibles.value.map((moneda) => ({ label: moneda, value: moneda })),
  ])

  const regionItems = computed(() => [
    { label: 'Todas las regiones', value: FILTER_ALL },
    ...regionesDisponibles.value.map((region) => ({ label: region, value: region })),
  ])

  const administradoraItems = computed(() => [
    { label: 'Todas las administradoras', value: FILTER_ALL },
    ...administradorasDisponibles.value.map((admin) => ({ label: admin, value: admin })),
  ])

  const depositariaItems = computed(() => [
    { label: 'Todas las depositarias', value: FILTER_ALL },
    ...depositariasDisponibles.value.map((depositaria) => ({
      label: depositaria,
      value: depositaria,
    })),
  ])

  const plazoItems: Array<{ label: string; value: PlazoFilter | typeof FILTER_ALL }> = [
    { label: 'Todos los plazos', value: FILTER_ALL },
    { label: 'T+0', value: '0' },
    { label: 'T+1', value: '1' },
    { label: 'T+2 o más', value: '2+' },
  ]

  const filteredFunds = computed(() => {
    let funds = [...allFunds.value]

    if (debouncedSearchQuery.value) {
      const query = String(debouncedSearchQuery.value).toLowerCase()
      funds = funds.filter((fund) => {
        const byFundName = fund.fondo.toLowerCase().includes(query)
        const byBaseName = parseFundClassName(fund.fondo).baseName.toLowerCase().includes(query)
        const byAdministradora = (fund.administradora ?? '').toLowerCase().includes(query)
        const byDepositaria = (fund.depositaria ?? '').toLowerCase().includes(query)
        return byFundName || byBaseName || byAdministradora || byDepositaria
      })
    }

    if (isActiveFilter(selectedTipo.value)) {
      funds = funds.filter((fund) => fund.tipoFilterKey === selectedTipo.value)
    }

    if (isActiveFilter(selectedHorizonte.value)) {
      funds = funds.filter((fund) => fund.horizonte === selectedHorizonte.value)
    }

    if (isActiveFilter(selectedMoneda.value)) {
      funds = funds.filter((fund) => fund.monedaInversion === selectedMoneda.value)
    }

    if (isActiveFilter(selectedRegion.value)) {
      funds = funds.filter((fund) => fund.region === selectedRegion.value)
    }

    if (isActiveFilter(selectedAdministradora.value)) {
      funds = funds.filter((fund) => fund.administradora === selectedAdministradora.value)
    }

    if (isActiveFilter(selectedDepositaria.value)) {
      funds = funds.filter((fund) => fund.depositaria === selectedDepositaria.value)
    }

    if (isActiveFilter(selectedPlazo.value)) {
      funds = funds.filter((fund) => {
        const days = fund.plazoLiquidacionDias
        if (days == null || !Number.isFinite(days)) return false
        if (selectedPlazo.value === '0') return days === 0
        if (selectedPlazo.value === '1') return days === 1
        return days >= 2
      })
    }

    if (onlyActiveFunds.value) {
      funds = funds.filter((fund) => isFundReportActive(fund.fecha))
    }

    return funds
  })

  const hasActiveFilters = computed(() => {
    return Boolean(
      searchQuery.value ||
      isActiveFilter(selectedTipo.value) ||
      isActiveFilter(selectedHorizonte.value) ||
      isActiveFilter(selectedMoneda.value) ||
      isActiveFilter(selectedRegion.value) ||
      isActiveFilter(selectedAdministradora.value) ||
      isActiveFilter(selectedDepositaria.value) ||
      isActiveFilter(selectedPlazo.value),
    )
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (searchQuery.value) count += 1
    if (isActiveFilter(selectedTipo.value)) count += 1
    if (isActiveFilter(selectedHorizonte.value)) count += 1
    if (isActiveFilter(selectedMoneda.value)) count += 1
    if (isActiveFilter(selectedRegion.value)) count += 1
    if (isActiveFilter(selectedAdministradora.value)) count += 1
    if (isActiveFilter(selectedDepositaria.value)) count += 1
    if (isActiveFilter(selectedPlazo.value)) count += 1
    return count
  })

  function clearFilters() {
    searchQuery.value = ''
    selectedTipo.value = FILTER_ALL
    selectedHorizonte.value = FILTER_ALL
    selectedMoneda.value = FILTER_ALL
    selectedRegion.value = FILTER_ALL
    selectedAdministradora.value = FILTER_ALL
    selectedDepositaria.value = FILTER_ALL
    selectedPlazo.value = FILTER_ALL
    onlyActiveFunds.value = true
    currentPage.value = 1
  }

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredFunds.value.length / pageSize.value)),
  )

  watch(
    [
      debouncedSearchQuery,
      selectedTipo,
      selectedHorizonte,
      selectedMoneda,
      selectedRegion,
      selectedAdministradora,
      selectedDepositaria,
      selectedPlazo,
      onlyActiveFunds,
    ],
    () => {
      currentPage.value = 1
    },
  )

  watch(pageSize, () => {
    currentPage.value = 1
  })

  watch(totalPages, (value) => {
    if (currentPage.value > value) {
      currentPage.value = value
    }
  })

  const pagination = computed({
    get: () => ({
      pageIndex: currentPage.value - 1,
      pageSize: pageSize.value,
    }),
    set: (value: { pageIndex?: number; pageSize?: number }) => {
      currentPage.value = (value.pageIndex ?? 0) + 1

      if (typeof value.pageSize === 'number') {
        pageSize.value = value.pageSize
      }
    },
  })

  const pageRange = computed(() => {
    if (!filteredFunds.value.length) {
      return { from: 0, to: 0 }
    }

    const from = (currentPage.value - 1) * pageSize.value + 1
    const to = Math.min(currentPage.value * pageSize.value, filteredFunds.value.length)

    return { from, to }
  })

  const stats = computed(() => {
    const funds = filteredFunds.value
    const withTna = funds.filter((fund) => fund.tna != null && Number.isFinite(fund.tna))
    const avgTna =
      withTna.length > 0
        ? withTna.reduce((sum, fund) => sum + (fund.tna as number), 0) / withTna.length
        : null
    const types = new Set(funds.map((fund) => fund.tipoFilterKey).filter(Boolean))

    return {
      total: allFunds.value.length,
      filtered: funds.length,
      avgTna,
      types: types.size,
    }
  })

  return {
    searchQuery,
    selectedTipo,
    selectedHorizonte,
    selectedMoneda,
    selectedRegion,
    selectedAdministradora,
    selectedDepositaria,
    selectedPlazo,
    onlyActiveFunds,
    pageSizeOptions,
    currentPage,
    pageSize,
    tipoItems,
    horizonteItems,
    monedaItems,
    regionItems,
    administradoraItems,
    depositariaItems,
    plazoItems,
    filteredFunds,
    hasActiveFilters,
    activeFilterCount,
    clearFilters,
    totalPages,
    pagination,
    pageRange,
    stats,
  }
}

import { useRouteQuery } from '@vueuse/router'
import type { FundCatalogRow } from '~/composables/useFondosCatalog'
import { parseFundClassName } from '~/lib/fci-fund-class'

export type PlazoFilter = '0' | '1' | '2+'

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))),
  ).sort((a, b) => a.localeCompare(b, 'es'))
}

export function useFondosFilters(allFunds: Ref<FundCatalogRow[]>) {
  const searchQuery = useRouteQuery('q', '')
  const debouncedSearchQuery = refDebounced(searchQuery, 300)
  const selectedTipo = useRouteQuery<string | undefined>('tipo', undefined)
  const selectedHorizonte = useRouteQuery<string | undefined>('horizonte', undefined)
  const selectedMoneda = useRouteQuery<string | undefined>('moneda', undefined)
  const selectedRegion = useRouteQuery<string | undefined>('region', undefined)
  const selectedAdministradora = useRouteQuery<string | undefined>('admin', undefined)
  const selectedDepositaria = useRouteQuery<string | undefined>('depositaria', undefined)
  const selectedPlazo = useRouteQuery<PlazoFilter | undefined>('plazo', undefined)
  const pageQuery = useRouteQuery('page', '1')
  const pageSizeQuery = useRouteQuery('pageSize', '100')

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
    { label: 'Todos los tipos', value: undefined as string | undefined },
    ...tiposDisponibles.value.map(({ value, label }) => ({ label, value })),
  ])

  const horizonteItems = computed(() => [
    { label: 'Todos los horizontes', value: undefined as string | undefined },
    ...horizontesDisponibles.value.map((horizonte) => ({
      label: horizonte,
      value: horizonte,
    })),
  ])

  const monedaItems = computed(() => [
    { label: 'Todas las monedas', value: undefined as string | undefined },
    ...monedasDisponibles.value.map((moneda) => ({ label: moneda, value: moneda })),
  ])

  const regionItems = computed(() => [
    { label: 'Todas las regiones', value: undefined as string | undefined },
    ...regionesDisponibles.value.map((region) => ({ label: region, value: region })),
  ])

  const administradoraItems = computed(() => [
    { label: 'Todas las administradoras', value: undefined as string | undefined },
    ...administradorasDisponibles.value.map((admin) => ({ label: admin, value: admin })),
  ])

  const depositariaItems = computed(() => [
    { label: 'Todas las depositarias', value: undefined as string | undefined },
    ...depositariasDisponibles.value.map((depositaria) => ({
      label: depositaria,
      value: depositaria,
    })),
  ])

  const plazoItems: Array<{ label: string; value: PlazoFilter | undefined }> = [
    { label: 'Todos los plazos', value: undefined },
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

    if (selectedTipo.value) {
      funds = funds.filter((fund) => fund.tipoFilterKey === selectedTipo.value)
    }

    if (selectedHorizonte.value) {
      funds = funds.filter((fund) => fund.horizonte === selectedHorizonte.value)
    }

    if (selectedMoneda.value) {
      funds = funds.filter((fund) => fund.monedaInversion === selectedMoneda.value)
    }

    if (selectedRegion.value) {
      funds = funds.filter((fund) => fund.region === selectedRegion.value)
    }

    if (selectedAdministradora.value) {
      funds = funds.filter((fund) => fund.administradora === selectedAdministradora.value)
    }

    if (selectedDepositaria.value) {
      funds = funds.filter((fund) => fund.depositaria === selectedDepositaria.value)
    }

    if (selectedPlazo.value) {
      funds = funds.filter((fund) => {
        const days = fund.plazoLiquidacionDias
        if (days == null || !Number.isFinite(days)) return false
        if (selectedPlazo.value === '0') return days === 0
        if (selectedPlazo.value === '1') return days === 1
        return days >= 2
      })
    }

    return funds
  })

  const hasActiveFilters = computed(() => {
    return Boolean(
      searchQuery.value ||
        selectedTipo.value ||
        selectedHorizonte.value ||
        selectedMoneda.value ||
        selectedRegion.value ||
        selectedAdministradora.value ||
        selectedDepositaria.value ||
        selectedPlazo.value,
    )
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (searchQuery.value) count += 1
    if (selectedTipo.value) count += 1
    if (selectedHorizonte.value) count += 1
    if (selectedMoneda.value) count += 1
    if (selectedRegion.value) count += 1
    if (selectedAdministradora.value) count += 1
    if (selectedDepositaria.value) count += 1
    if (selectedPlazo.value) count += 1
    return count
  })

  function clearFilters() {
    searchQuery.value = ''
    selectedTipo.value = undefined
    selectedHorizonte.value = undefined
    selectedMoneda.value = undefined
    selectedRegion.value = undefined
    selectedAdministradora.value = undefined
    selectedDepositaria.value = undefined
    selectedPlazo.value = undefined
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

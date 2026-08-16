<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { useRouteQuery } from '@vueuse/router'
import type { TableColumn, TabsItem } from '@nuxt/ui'
import { ogUpdatedAtDate, top3Funds } from '~/utils/og-data'
import { getFundDetailPath } from '~/lib/funds-detail'
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatDecimal,
  formatPercentAuto,
  metricTone,
} from '~/lib/fci-fund-formatters'
import {
  groupFundCatalogRows,
  toFlatFundCatalogRows,
  type FundCatalogGroupRow,
} from '~/lib/fci-fund-groups'
import type { FundCatalogRow } from '~/composables/useFondosCatalog'
import {
  summarizeFundsByEntity,
  isFundEntitySummary,
  type CatalogVista,
  type FundEntitySummary,
} from '~/lib/fci-fund-entity-views'

definePageMeta({
  layout: 'fondos',
  pageTitle: 'Fondos Comunes de Inversión (FCI)',
  pageDescription:
    'Consultá y compará todos los FCI disponibles en Argentina. Información actualizada diariamente con datos de rendimiento y patrimonio.',
})

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const table = useTemplateRef<{ tableApi?: any }>('table')

const groupByClassQuery = useRouteQuery<'1' | '0'>('agrupar', '1')
const groupByClass = computed({
  get: () => groupByClassQuery.value !== '0',
  set: (value: boolean) => {
    groupByClassQuery.value = value ? '1' : '0'
  },
})

const catalogVistaQuery = useRouteQuery<CatalogVista>('vista', 'fondos')
const catalogVista = computed({
  get: () => {
    const value = catalogVistaQuery.value
    if (value === 'administradoras' || value === 'depositarias') return value
    return 'fondos'
  },
  set: (value: CatalogVista) => {
    catalogVistaQuery.value = value === 'fondos' ? 'fondos' : value
  },
})

const vistaTabs = computed<TabsItem[]>(() => [
  { label: 'Fondos', value: 'fondos', icon: 'i-lucide-layout-list' },
  { label: 'Administradoras', value: 'administradoras', icon: 'i-lucide-briefcase' },
  { label: 'Depositarias', value: 'depositarias', icon: 'i-lucide-landmark' },
])

const isFondosVista = computed(() => catalogVista.value === 'fondos')

const expanded = ref<Record<string, boolean>>({})

function formatRatePercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function mutedDash() {
  return h('span', { class: 'text-muted' }, '—')
}

function finiteOrUndefined(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? undefined : value
}

const { allFundsCache, data: fundsData, fetch: fetchPageFunds } = useFunds()
const { allFunds, loading, error } = useFondosCatalog()
const { enrichFunds, applyRolling30d } = useCatalogRolling30d()
const {
  searchQuery,
  selectedTipo,
  selectedHorizonte,
  selectedMoneda,
  selectedRegion,
  selectedAdministradora,
  selectedDepositaria,
  selectedPlazo,
  tipoItems,
  horizonteItems,
  monedaItems,
  regionItems,
  administradoraItems,
  depositariaItems,
  plazoItems,
  hasActiveFilters,
  activeFilterCount,
  clearFilters,
  filteredFunds,
  pageSizeOptions,
  currentPage,
  pageSize,
  pagination,
  stats,
} = useFondosFilters(allFunds)

const filtersOpen = ref(false)

/** Catálogo con 30D rolling alineado al detalle (overlay sobre `unMes` CNV). */
const catalogFunds = computed(() => applyRolling30d(filteredFunds.value))

const tableData = computed(() => {
  if (groupByClass.value) {
    return groupFundCatalogRows(catalogFunds.value)
  }
  return toFlatFundCatalogRows(catalogFunds.value)
})

const entityTableData = computed(() => {
  if (catalogVista.value === 'administradoras') {
    return summarizeFundsByEntity(catalogFunds.value, 'administradora')
  }
  if (catalogVista.value === 'depositarias') {
    return summarizeFundsByEntity(catalogFunds.value, 'depositaria')
  }
  return [] as FundEntitySummary[]
})

const activeTableData = computed(() =>
  isFondosVista.value ? tableData.value : entityTableData.value,
)

function collectPageLeafFunds(pageRows: FundCatalogGroupRow[]): FundCatalogRow[] {
  const leaves: FundCatalogRow[] = []
  for (const row of pageRows) {
    if (row.children?.length) {
      leaves.push(...row.children)
    } else if (!row.isGroup) {
      leaves.push(row)
    }
  }
  return leaves
}

watch(
  [activeTableData, currentPage, pageSize, catalogVista],
  () => {
    if (catalogVista.value !== 'fondos') return

    const start = (currentPage.value - 1) * pageSize.value
    const pageRows = activeTableData.value.slice(
      start,
      start + pageSize.value,
    ) as FundCatalogGroupRow[]

    void enrichFunds(collectPageLeafFunds(pageRows).slice(0, CATALOG_ROLLING_30D_MAX_FUNDS))
  },
  { immediate: true },
)

const groupedFundsCount = computed(() => tableData.value.length)
const multiClassGroupsCount = computed(() => tableData.value.filter((row) => row.isGroup).length)

const tableTotalPages = computed(() =>
  Math.max(1, Math.ceil(activeTableData.value.length / pageSize.value)),
)

const tablePageRange = computed(() => {
  if (!activeTableData.value.length) {
    return { from: 0, to: 0 }
  }

  const from = (currentPage.value - 1) * pageSize.value + 1
  const to = Math.min(currentPage.value * pageSize.value, activeTableData.value.length)

  return { from, to }
})

watch(groupByClass, () => {
  expanded.value = {}
  currentPage.value = 1
})

watch(catalogVista, () => {
  expanded.value = {}
  currentPage.value = 1
  sorting.value = [{ id: 'patrimonio', desc: true }]
})

watch(tableTotalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})

const { data: ogItems } = await useAsyncData('og-fondos', async () => {
  await fetchPageFunds()
  const accountsFunds = allFundsCache.value.filter((i) => i?.meta?.showInAccounts)
  const mercadoDineroFunds = (fundsData.value?.mercadoDinero ?? []).filter(
    (i) => i?.meta?.showInFunds,
  )
  const combined = [...accountsFunds, ...mercadoDineroFunds]
  const seen = new Set<string>()
  const resolved = combined.filter((item) => {
    const key = `${item.fondo}-${item.institution}-${item.displayName}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const riesgoMuyBajo = resolved.filter(
    (f) =>
      (f.type ?? '') === 'mercadoDinero' ||
      !['rentaFija', 'rentaMixta', 'retornoTotal'].includes(f.type ?? ''),
  )
  return top3Funds(
    riesgoMuyBajo.map((f) => ({
      fondo: f.fondo,
      displayName: f.displayName,
      tna: f.tna,
      meta: f.meta,
    })),
  )
})

defineOgImage('ComparaTasas.takumi', {
  title: 'Top Fondos Money Market',
  items: ogItems.value ?? [],
  updatedAt: ogUpdatedAtDate(),
})

useSeoMeta({
  title: 'Fondos Comunes de Inversión',
  description:
    'Consultá y compará todos los fondos comunes de inversión (FCI) en Argentina. Información actualizada con datos de rendimiento y patrimonio.',
  ogTitle: 'Fondos Comunes de Inversión - Compara Tasas',
  ogDescription:
    'Consultá y compará todos los fondos comunes de inversión (FCI) en Argentina. Información actualizada con datos de rendimiento y patrimonio.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/fondos' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/fondos' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/fondos' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Fondos Comunes de Inversión - Compara Tasas',
        description: 'Comparativa de fondos comunes de inversión (FCI) en Argentina.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
})

function getSortableHeader(label: string, align: 'left' | 'right' | 'center' = 'left') {
  return ({ column }: { column: any }) => {
    const isSorted = column.getIsSorted()

    const button = h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      size: 'xs',
      label,
      icon: isSorted
        ? isSorted === 'asc'
          ? 'i-lucide-arrow-up-narrow-wide'
          : 'i-lucide-arrow-down-wide-narrow'
        : 'i-lucide-arrow-up-down',
      class: ['-mx-1.5', isSorted ? 'text-highlighted' : 'text-muted hover:text-highlighted'],
      ui: {
        label: 'font-medium',
        leadingIcon: 'size-3.5 opacity-70',
      },
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    })

    if (align === 'right') {
      return h('div', { class: 'text-right' }, button)
    }
    if (align === 'center') {
      return h('div', { class: 'text-center' }, button)
    }
    return button
  }
}

function handleFundRowSelect(row: any) {
  const original = row?.original as FundCatalogGroupRow | undefined
  const fundName = original?.primaryFondo || original?.fondo
  if (!fundName) return
  navigateTo(getFundDetailPath(fundName))
}

function handleEntityRowSelect(row: any) {
  const original = row?.original
  if (!original) return

  if (isFundEntitySummary(original)) {
    if (row.getCanExpand?.()) row.toggleExpanded()
    return
  }

  handleFundRowSelect(row)
}

function entityDepthClass(depth: number) {
  if (depth <= 0) return ''
  if (depth === 1) return 'pl-4'
  return 'pl-8'
}

const entityColumns: TableColumn<FundEntitySummary>[] = [
  {
    id: 'expand',
    enableHiding: false,
    enableSorting: false,
    header: () => null,
    cell: ({ row }) => {
      if (!row.getCanExpand()) return null

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        size: 'xs',
        square: true,
        icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
        onClick: (event: Event) => {
          event.stopPropagation()
          row.toggleExpanded()
        },
      })
    },
  },
  {
    id: 'name',
    accessorFn: (row) => (isFundEntitySummary(row) ? row.name : row.displayName || row.fondo),
    header: getSortableHeader('Nombre'),
    cell: ({ row }) => {
      const original = row.original as FundEntitySummary | FundCatalogGroupRow
      const depthClass = entityDepthClass(row.depth)

      if (isFundEntitySummary(original)) {
        return h('div', { class: `min-w-0 ${depthClass}` }, [
          h('div', { class: 'font-medium text-highlighted truncate' }, original.name),
        ])
      }

      return h('div', { class: `flex items-center gap-2 min-w-0 ${depthClass}` }, [
        h(
          'div',
          { class: 'font-medium text-highlighted truncate' },
          original.displayName || original.fondo,
        ),
        original.isGroup
          ? h(
              UBadge,
              { color: 'neutral', variant: 'subtle', size: 'sm' },
              () => `${original.classCount} clases`,
            )
          : original.classLabel && row.depth === 1
            ? h(
                UBadge,
                { color: 'neutral', variant: 'outline', size: 'sm' },
                () => original.classLabel,
              )
            : null,
      ])
    },
  },
  {
    id: 'fondos',
    accessorFn: (row) => (isFundEntitySummary(row) ? row.fondos : undefined),
    header: getSortableHeader('Fondos', 'right'),
    cell: ({ row }) => {
      const original = row.original as FundEntitySummary | FundCatalogGroupRow
      if (!isFundEntitySummary(original)) return mutedDash()
      return h('div', { class: 'text-right text-sm tabular-nums' }, String(original.fondos))
    },
    sortUndefined: 'last',
    sortingFn: 'basic',
  },
  {
    id: 'clases',
    accessorFn: (row) => (isFundEntitySummary(row) ? row.clases : row.isGroup ? row.classCount : 1),
    header: getSortableHeader('Clases', 'right'),
    cell: ({ row }) => {
      const original = row.original as FundEntitySummary | FundCatalogGroupRow
      const value = isFundEntitySummary(original)
        ? original.clases
        : original.isGroup
          ? original.classCount
          : 1
      return h('div', { class: 'text-right text-sm tabular-nums' }, String(value))
    },
  },
  {
    id: 'typeLabel',
    accessorFn: (row) => (isFundEntitySummary(row) ? undefined : row.typeLabel),
    header: getSortableHeader('Tipo'),
    cell: ({ row }) => {
      const original = row.original as FundEntitySummary | FundCatalogGroupRow
      if (isFundEntitySummary(original)) {
        return h('div', { class: 'text-sm text-muted' }, `${original.tipos} tipos`)
      }
      if (!original.typeLabel || original.typeLabel === '—') return mutedDash()
      return h('div', { class: 'text-sm' }, original.typeLabel)
    },
    sortUndefined: 'last',
    sortingFn: 'basic',
  },
  {
    id: 'patrimonio',
    accessorFn: (row) =>
      finiteOrUndefined(
        isFundEntitySummary(row)
          ? row.patrimonio
          : row.isGroup
            ? row.patrimonioTotal
            : row.patrimonio,
      ),
    header: getSortableHeader('Patrimonio', 'right'),
    cell: ({ row }) => {
      const original = row.original as FundEntitySummary | FundCatalogGroupRow
      const value = isFundEntitySummary(original)
        ? original.patrimonio
        : original.isGroup
          ? original.patrimonioTotal
          : original.patrimonio
      const formatted = formatCompactNumber(value)
      if (formatted === '—') return mutedDash()
      return h(
        'div',
        {
          class: `text-right text-sm ${isFundEntitySummary(original) || original.isGroup ? 'font-medium' : ''}`,
        },
        formatted,
      )
    },
    sortUndefined: 'last',
    sortingFn: 'basic',
  },
]

const columns: TableColumn<FundCatalogGroupRow>[] = [
  {
    id: 'expand',
    enableHiding: false,
    enableSorting: false,
    header: () => null,
    cell: ({ row }) => {
      if (!row.getCanExpand()) return null

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        size: 'xs',
        square: true,
        icon: row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
        onClick: (event: Event) => {
          event.stopPropagation()
          row.toggleExpanded()
        },
      })
    },
  },
  {
    accessorKey: 'displayName',
    header: getSortableHeader('Fondo'),
    cell: ({ row }) => {
      const original = row.original
      const depthClass = row.depth === 1 ? 'pl-4' : row.depth > 1 ? 'pl-8' : ''

      return h('div', { class: `flex items-center gap-2 min-w-0 ${depthClass}` }, [
        h(
          'div',
          { class: 'font-medium text-highlighted truncate' },
          original.displayName || original.fondo,
        ),
        original.isGroup
          ? h(
              UBadge,
              { color: 'neutral', variant: 'subtle', size: 'sm' },
              () => `${original.classCount} clases`,
            )
          : original.classLabel && row.depth === 0
            ? h(
                UBadge,
                { color: 'neutral', variant: 'outline', size: 'sm' },
                () => original.classLabel,
              )
            : null,
      ])
    },
    meta: {
      class: {
        th: 'whitespace-nowrap',
        td: 'max-w-xs whitespace-nowrap',
      },
    },
  },
  {
    accessorKey: 'typeLabel',
    header: getSortableHeader('Tipo'),
    cell: ({ row }) => {
      const label = row.original.typeLabel
      if (!label || label === '—') return mutedDash()
      return h('div', { class: 'text-sm' }, label)
    },
  },
  {
    accessorKey: 'horizonte',
    header: getSortableHeader('Horizonte'),
    cell: ({ row }) => {
      const horizonte = row.original.horizonte
      if (!horizonte) return mutedDash()
      return h('div', { class: 'text-sm' }, horizonte)
    },
  },
  {
    accessorKey: 'administradora',
    header: getSortableHeader('Administradora'),
    cell: ({ row }) => {
      const value = row.original.administradora
      if (!value) return mutedDash()
      return h('div', { class: 'text-sm truncate max-w-[10rem]', title: value }, value)
    },
  },
  {
    accessorKey: 'depositaria',
    header: getSortableHeader('Depositaria'),
    cell: ({ row }) => {
      const value = row.original.depositaria
      if (!value) return mutedDash()
      return h('div', { class: 'text-sm truncate max-w-[10rem]', title: value }, value)
    },
  },
  {
    id: 'retorno1d',
    accessorFn: (row) => finiteOrUndefined(row.retorno1d),
    header: getSortableHeader('1d', 'right'),
    cell: ({ row }) => {
      const value = row.original.retorno1d
      const formatted = formatPercentAuto(value)
      if (formatted === '—') return mutedDash()
      return h('div', { class: `text-right font-medium text-sm ${metricTone(value)}` }, formatted)
    },
    sortUndefined: 'last',
    sortingFn: 'basic',
  },
  {
    id: 'retorno30d',
    accessorFn: (row) => finiteOrUndefined(row.retorno30d),
    header: getSortableHeader('30d', 'right'),
    cell: ({ row }) => {
      const value = row.original.retorno30d
      const formatted = formatPercentAuto(value)
      if (formatted === '—') return mutedDash()
      return h('div', { class: `text-right font-medium text-sm ${metricTone(value)}` }, formatted)
    },
    sortUndefined: 'last',
    sortingFn: 'basic',
  },
  {
    id: 'retornoYtd',
    accessorFn: (row) => finiteOrUndefined(row.retornoYtd),
    header: getSortableHeader('YTD', 'right'),
    cell: ({ row }) => {
      const value = row.original.retornoYtd
      const formatted = formatPercentAuto(value)
      if (formatted === '—') return mutedDash()
      return h('div', { class: `text-right font-medium text-sm ${metricTone(value)}` }, formatted)
    },
    sortUndefined: 'last',
    sortingFn: 'basic',
  },
  {
    id: 'vcp',
    accessorFn: (row) => finiteOrUndefined(row.vcp),
    header: getSortableHeader('VCP', 'right'),
    cell: ({ row }) => {
      const formatted = formatDecimal(row.original.vcp)
      if (formatted === '—') return mutedDash()
      return h('div', { class: 'text-right font-mono text-sm' }, formatted)
    },
    sortUndefined: 'last',
    sortingFn: 'basic',
  },
  {
    id: 'patrimonio',
    accessorFn: (row) => finiteOrUndefined(row.isGroup ? row.patrimonioTotal : row.patrimonio),
    header: getSortableHeader('Patrimonio', 'right'),
    cell: ({ row }) => {
      const value = row.original.isGroup ? row.original.patrimonioTotal : row.original.patrimonio
      const formatted = formatCompactNumber(value)
      if (formatted === '—') return mutedDash()
      return h(
        'div',
        {
          class: `text-right text-sm ${row.original.isGroup ? 'font-medium' : ''}`,
        },
        [
          formatted,
          row.original.isGroup
            ? h('span', { class: 'block text-[10px] text-muted font-normal' }, 'suma clases')
            : null,
        ],
      )
    },
    sortUndefined: 'last',
    sortingFn: 'basic',
  },
  {
    id: 'inversionMinima',
    accessorFn: (row) => finiteOrUndefined(row.inversionMinima),
    header: getSortableHeader('Inversión mínima', 'right'),
    cell: ({ row }) => {
      const formatted = formatCurrency(
        row.original.inversionMinima,
        row.original.monedaInversion ?? 'ARS',
      )
      if (formatted === '—') return mutedDash()
      return h('div', { class: 'text-right text-sm' }, formatted)
    },
    sortUndefined: 'last',
    sortingFn: 'basic',
  },
  {
    id: 'plazoLiquidacionDias',
    accessorFn: (row) => finiteOrUndefined(row.plazoLiquidacionDias),
    header: getSortableHeader('Plazo liquidación', 'center'),
    cell: ({ row }) => {
      const days = row.original.plazoLiquidacionDias
      if (days == null || !Number.isFinite(days)) return mutedDash()
      const label = days === 1 ? 'día' : 'días'
      return h('div', { class: 'text-center text-sm' }, `${days} ${label}`)
    },
    sortUndefined: 'last',
    sortingFn: 'basic',
  },
  {
    accessorKey: 'region',
    header: getSortableHeader('Región'),
    cell: ({ row }) => {
      const value = row.original.region
      if (!value) return mutedDash()
      return h('div', { class: 'text-sm' }, value)
    },
  },
  {
    accessorKey: 'fecha',
    header: getSortableHeader('Fecha'),
    cell: ({ row }) => {
      const formatted = formatDate(row.original.fecha)
      if (formatted === '—') return mutedDash()
      return h('div', { class: 'text-sm' }, formatted)
    },
  },
]

const sortQuery = useRouteQuery<string>('sort', '[{"id":"patrimonio","desc":true}]')
const columnVisibility = ref<Record<string, boolean>>({
  expand: true,
  administradora: true,
  depositaria: true,
  retorno1d: true,
  retorno30d: true,
  retornoYtd: true,
  inversionMinima: false,
  plazoLiquidacionDias: false,
  vcp: false,
  fecha: false,
  region: false,
})

type SortingState = Array<{ id: string; desc: boolean }>

function parseSorting(value: string): SortingState {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [{ id: 'patrimonio', desc: true }]
  }
}

const sorting = ref<SortingState>(parseSorting(sortQuery.value))

watch(sortQuery, (value) => {
  const next = parseSorting(value)
  if (JSON.stringify(next) !== JSON.stringify(sorting.value)) {
    sorting.value = next
  }
})

watch(
  sorting,
  (value) => {
    const serialized = JSON.stringify(value ?? [])
    if (sortQuery.value !== serialized) {
      sortQuery.value = serialized
    }
  },
  { deep: true },
)

const columnLabelMap: Record<string, string> = {
  displayName: 'Fondo',
  typeLabel: 'Tipo',
  horizonte: 'Horizonte',
  retorno1d: '1d',
  retorno30d: '30d',
  retornoYtd: 'YTD',
  vcp: 'VCP',
  patrimonio: 'Patrimonio',
  inversionMinima: 'Inversión mínima',
  plazoLiquidacionDias: 'Plazo liquidación',
  region: 'Región',
  fecha: 'Fecha',
  administradora: 'Administradora',
  depositaria: 'Depositaria',
}

const displayMenuItems = computed(() => {
  const api = table.value?.tableApi
  if (!api) return []

  return api
    .getAllColumns()
    .filter((column: any) => column.getCanHide())
    .map((column: any) => ({
      label: columnLabelMap[column.id] ?? column.id,
      type: 'checkbox' as const,
      checked: column.getIsVisible(),
      onUpdateChecked(checked: boolean) {
        column.toggleVisibility(!!checked)
      },
      onSelect(e?: Event) {
        e?.preventDefault()
      },
    }))
})

const avgTnaLabel = computed(() => formatRatePercent(stats.value.avgTna) ?? '—')
const isDesktopLayout = useMediaQuery('(min-width: 1024px)')
</script>

<template>
  <UDashboardPanel
    id="fondos-catalog"
    class="max-lg:h-auto max-lg:min-h-0 lg:h-full lg:min-h-0"
    :ui="{
      root: 'max-lg:!min-h-0 max-lg:h-auto lg:h-full lg:min-h-0 lg:!min-h-0',
      body: 'max-lg:!overflow-visible max-lg:!flex-none lg:overflow-hidden lg:min-h-0 p-0! gap-0!',
    }"
  >
    <template #header>
      <div
        class="max-lg:sticky max-lg:top-[var(--ui-header-height)] max-lg:z-40 max-lg:bg-default/95 max-lg:backdrop-blur-md max-lg:border-b max-lg:border-default"
      >
        <UDashboardNavbar
          :ui="{
            root: 'bg-transparent',
          }"
        >
          <template #trailing>
            <UBadge
              v-if="activeFilterCount"
              color="neutral"
              variant="subtle"
              :label="`${activeFilterCount} filtros`"
            />
          </template>

          <template #right>
            <UTabs
              v-model="catalogVista"
              :items="vistaTabs"
              :content="false"
              color="neutral"
              size="xs"
              variant="link"
              class="w-auto"
            />
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar
          :ui="{
            root: 'bg-transparent',
          }"
        >
          <template #left>
            <UInput
              v-model="searchQuery"
              color="neutral"
              icon="i-lucide-search"
              placeholder="Buscar por nombre, administradora o depositaria..."
              class="w-full max-w-sm"
            />

            <USelect
              v-model="selectedTipo"
              color="neutral"
              :items="tipoItems"
              value-key="value"
              placeholder="Tipo"
              class="w-44 hidden lg:block"
              size="sm"
            />

            <USelect
              v-model="selectedHorizonte"
              color="neutral"
              :items="horizonteItems"
              value-key="value"
              placeholder="Horizonte"
              class="w-44 hidden xl:block"
              size="sm"
            />
          </template>

          <template #right>
            <UButton
              v-if="isFondosVista"
              color="neutral"
              :variant="groupByClass ? 'soft' : 'outline'"
              icon="i-lucide-layers"
              :label="groupByClass ? 'Agrupado' : 'Todas las clases'"
              size="sm"
              @click="groupByClass = !groupByClass"
            />

            <USlideover v-model:open="filtersOpen" title="Filtros del catálogo">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-sliders-horizontal"
                label="Filtros"
                size="sm"
              >
                <template v-if="activeFilterCount" #trailing>
                  <UKbd>{{ activeFilterCount }}</UKbd>
                </template>
              </UButton>

              <template #body>
                <div class="flex flex-col gap-4">
                  <div class="space-y-1.5">
                    <p class="text-xs text-muted">Tipo</p>
                    <USelect
                      v-model="selectedTipo"
                      color="neutral"
                      :items="tipoItems"
                      value-key="value"
                      placeholder="Tipo"
                      class="w-full"
                    />
                  </div>

                  <div class="space-y-1.5">
                    <p class="text-xs text-muted">Horizonte</p>
                    <USelect
                      v-model="selectedHorizonte"
                      color="neutral"
                      :items="horizonteItems"
                      value-key="value"
                      placeholder="Horizonte"
                      class="w-full"
                    />
                  </div>

                  <div class="space-y-1.5">
                    <p class="text-xs text-muted">Moneda</p>
                    <USelect
                      v-model="selectedMoneda"
                      color="neutral"
                      :items="monedaItems"
                      value-key="value"
                      placeholder="Moneda"
                      class="w-full"
                    />
                  </div>

                  <div class="space-y-1.5">
                    <p class="text-xs text-muted">Región</p>
                    <USelect
                      v-model="selectedRegion"
                      color="neutral"
                      :items="regionItems"
                      value-key="value"
                      placeholder="Región"
                      class="w-full"
                    />
                  </div>

                  <div class="space-y-1.5">
                    <p class="text-xs text-muted">Administradora</p>
                    <USelect
                      v-model="selectedAdministradora"
                      color="neutral"
                      :items="administradoraItems"
                      value-key="value"
                      placeholder="Administradora"
                      class="w-full"
                    />
                  </div>

                  <div class="space-y-1.5">
                    <p class="text-xs text-muted">Depositaria</p>
                    <USelect
                      v-model="selectedDepositaria"
                      color="neutral"
                      :items="depositariaItems"
                      value-key="value"
                      placeholder="Depositaria"
                      class="w-full"
                    />
                  </div>

                  <div class="space-y-1.5">
                    <p class="text-xs text-muted">Plazo de liquidación</p>
                    <USelect
                      v-model="selectedPlazo"
                      color="neutral"
                      :items="plazoItems"
                      value-key="value"
                      placeholder="Plazo"
                      class="w-full"
                    />
                  </div>
                </div>
              </template>

              <template #footer>
                <div class="flex items-center justify-between gap-2 w-full">
                  <UButton
                    color="neutral"
                    variant="outline"
                    label="Limpiar"
                    :disabled="!hasActiveFilters"
                    @click="clearFilters"
                  />
                  <UButton label="Aplicar" color="neutral" @click="filtersOpen = false" />
                </div>
              </template>
            </USlideover>

            <UButton
              v-if="hasActiveFilters"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              label="Limpiar"
              size="sm"
              @click="clearFilters"
            />

            <UDropdownMenu
              v-if="isFondosVista"
              :items="displayMenuItems"
              :content="{ align: 'end' }"
            >
              <UButton
                label="Columnas"
                color="neutral"
                variant="outline"
                trailing-icon="i-lucide-settings-2"
                size="sm"
              />
            </UDropdownMenu>

            <USelect
              v-model="pageSize"
              color="neutral"
              :items="pageSizeOptions"
              value-key="value"
              class="w-36"
              size="sm"
            />
          </template>
        </UDashboardToolbar>
      </div>
    </template>

    <template #body>
      <div class="shrink-0 grid gap-2 sm:grid-cols-4 p-2">
        <UPageCard
          title="Clases cargadas"
          icon="i-lucide-database"
          variant="subtle"
          :ui="{
            container: 'relative flex flex-col flex-1 gap-y-0 p-2.5 sm:p-3',
            header: 'mb-0.5',
            leading: 'inline-flex items-center mb-1',
            title: 'font-normal text-muted text-[10px] uppercase tracking-wide',
            leadingIcon: 'size-3.5 shrink-0 text-muted',
          }"
        >
          <p class="text-lg font-semibold text-highlighted leading-tight">{{ stats.total }}</p>
        </UPageCard>
        <UPageCard
          :title="groupByClass ? 'Fondos en vista' : 'Clases filtradas'"
          icon="i-lucide-filter"
          variant="subtle"
          :ui="{
            container: 'relative flex flex-col flex-1 gap-y-0 p-2.5 sm:p-3',
            header: 'mb-0.5',
            leading: 'inline-flex items-center mb-1',
            title: 'font-normal text-muted text-[10px] uppercase tracking-wide',
            leadingIcon: 'size-3.5 shrink-0 text-muted',
          }"
        >
          <p class="text-lg font-semibold text-highlighted leading-tight">
            {{ groupByClass ? groupedFundsCount : stats.filtered }}
          </p>
          <p v-if="groupByClass" class="text-[10px] text-muted leading-tight">
            {{ stats.filtered }} clases · {{ multiClassGroupsCount }} con varias clases
          </p>
        </UPageCard>
        <UPageCard
          title="TNA promedio"
          icon="i-lucide-percent"
          variant="subtle"
          :ui="{
            container: 'relative flex flex-col flex-1 gap-y-0 p-2.5 sm:p-3',
            header: 'mb-0.5',
            leading: 'inline-flex items-center mb-1',
            title: 'font-normal text-muted text-[10px] uppercase tracking-wide',
            leadingIcon: 'size-3.5 shrink-0 text-muted',
          }"
        >
          <p class="text-lg font-semibold text-highlighted leading-tight">{{ avgTnaLabel }}</p>
        </UPageCard>
        <UPageCard
          title="Tipos en vista"
          icon="i-lucide-layers"
          variant="subtle"
          :ui="{
            container: 'relative flex flex-col flex-1 gap-y-0 p-2.5 sm:p-3',
            header: 'mb-0.5',
            leading: 'inline-flex items-center mb-1',
            title: 'font-normal text-muted text-[10px] uppercase tracking-wide',
            leadingIcon: 'size-3.5 shrink-0 text-muted',
          }"
        >
          <p class="text-lg font-semibold text-highlighted leading-tight">{{ stats.types }}</p>
        </UPageCard>
      </div>

      <UAlert
        v-if="error"
        class="shrink-0"
        color="error"
        variant="soft"
        title="Error cargando fondos"
      >
        No se pudieron cargar los fondos. Por favor, intenta nuevamente.
      </UAlert>

      <UTable
        ref="table"
        v-model:sorting="sorting"
        v-model:pagination="pagination"
        v-model:column-visibility="columnVisibility"
        v-model:expanded="expanded"
        :sticky="isDesktopLayout ? 'header' : false"
        :data="activeTableData"
        :columns="isFondosVista ? columns : entityColumns"
        :loading="loading"
        :get-sub-rows="
          isFondosVista
            ? (row: FundCatalogGroupRow) => row.children
            : (row: FundEntitySummary | FundCatalogGroupRow) => row.children
        "
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        :on-select="isFondosVista ? handleFundRowSelect : handleEntityRowSelect"
        class="w-full shrink-0 lg:flex-1 lg:min-h-0 lg:shrink"
        :ui="{
          root: 'relative overflow-x-auto overflow-y-visible lg:overflow-auto',
          base: 'table-fixed border-separate border-spacing-0',
          thead:
            '!bg-default/95 backdrop-blur-md [&>tr]:bg-transparent [&>tr]:after:content-none shadow-[inset_0_-1px_0_0_var(--ui-border)]',
          tbody:
            '[&>tr]:last:[&>td]:border-b-0 [&>tr[data-expanded=true]+tr:has(>td[colspan]:only-child)]:hidden',
          th: 'py-1.5 px-3 bg-default/95 backdrop-blur-md border-0 text-muted font-medium',
          td: 'py-2.5 border-b border-default',
          separator: 'h-0',
          tr: 'cursor-pointer',
        }"
      >
        <template #expanded />
        <template #empty>
          <div class="py-12 text-center">
            <UIcon name="i-lucide-search-x" class="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 class="text-lg font-medium mb-2">
              {{ isFondosVista ? 'No se encontraron fondos' : 'No se encontraron resultados' }}
            </h3>
            <p class="text-muted">
              {{
                searchQuery || selectedTipo || selectedHorizonte
                  ? 'Intenta ajustar los filtros'
                  : 'No hay datos disponibles en este momento'
              }}
            </p>
          </div>
        </template>
      </UTable>

      <div
        class="shrink-0 flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-1 p-2 border-t border-default"
      >
        <p class="text-sm text-muted">
          Mostrando {{ tablePageRange.from }}-{{ tablePageRange.to }} de
          <template v-if="isFondosVista">
            {{ groupedFundsCount }}
            {{ groupByClass ? 'fondos' : 'clases' }}
            <span v-if="groupByClass"> ({{ stats.filtered }} clases)</span>
          </template>
          <template v-else>
            {{ entityTableData.length }}
            {{ catalogVista === 'administradoras' ? 'administradoras' : 'depositarias' }}
          </template>
          <span v-if="tableTotalPages > 1">
            · Página {{ currentPage }} de {{ tableTotalPages }}
          </span>
        </p>

        <UPagination
          v-if="activeTableData.length > pageSize"
          v-model:page="currentPage"
          :items-per-page="pageSize"
          :total="activeTableData.length"
          :sibling-count="1"
          show-edges
          size="sm"
          color="neutral"
          active-color="neutral"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

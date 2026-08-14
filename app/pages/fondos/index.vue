<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { useRouteQuery } from '@vueuse/router'
import type { TableColumn } from '@nuxt/ui'
import { ogUpdatedAtDate, top3Funds } from '~/utils/og-data'
import { getFundDetailPath } from '~/lib/funds-detail'
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatDecimal,
  metricTone,
} from '~/lib/fci-fund-formatters'
import {
  getComparatasasReturnPercent,
  getComparatasasTnaAndTea,
} from '~/lib/finance/fci-comparatasas-returns'
import { sanitizeAnnualizedReturnPercent } from '~/lib/finance/fci-history-returns'
import { getFundTypeInfo, type FundType } from '~/lib/mappings/funds'
import {
  fetchFciFundsCatalog,
  type FciFundDetail,
  type FciFundsDetailsResponse,
} from '~/composables/useFciFundDetails'

definePageMeta({
  pageTitle: 'Fondos Comunes de Inversión (FCI)',
  pageDescription:
    'Consultá y compará todos los FCI disponibles en Argentina. Información actualizada diariamente con datos de rendimiento y patrimonio.',
})

const UButton = resolveComponent('UButton')

const CNV_CUOTAPARTES_URL =
  'https://www.cnv.gov.ar/SitioWeb/FondosComunesInversion/CuotaPartes'

interface FundCatalogRow {
  fondo: string
  tipoFondo?: FundType
  typeLabel: string
  tipoFilterKey?: string
  tipoRenta: string | null
  horizonte: string | null
  administradora: string | null
  depositaria: string | null
  tna: number | null
  tea: number | null
  vcp: number | null
  patrimonio: number | null
  inversionMinima: number | null
  monedaInversion: string | null
  plazoLiquidacionDias: number | null
  region: string | null
  fecha: string | null
}

function hasComparatasasReturn(fund: FciFundDetail) {
  const rendimientos = fund.rendimientos
  if (!rendimientos) return false

  if (fund.tipoRenta === 'Mercado de Dinero') {
    return rendimientos.unMes != null || rendimientos.ultimos7Dias != null
  }

  return rendimientos.unMes != null
}

function mapCatalogToRows(response: FciFundsDetailsResponse): FundCatalogRow[] {
  return (response.fondos ?? [])
    .filter((fund) => Boolean(fund.nombre?.trim()))
    .map((fund) => {
      const typeInfo = getFundTypeInfo(fund.tipoRenta)
      const typeLabel = typeInfo?.typeLabel ?? fund.tipoRenta ?? '—'
      const tipoFilterKey = typeInfo?.type ?? fund.tipoRenta ?? undefined

      let tna: number | null = null
      let tea: number | null = null

      if (hasComparatasasReturn(fund) && fund.rendimientos) {
        const returnPercent = sanitizeAnnualizedReturnPercent(
          getComparatasasReturnPercent(fund.rendimientos, fund.tipoRenta ?? ''),
        )

        if (returnPercent != null) {
          const rates = getComparatasasTnaAndTea(returnPercent)
          tna = rates.tna
          tea = rates.tea
        }
      }

      return {
        fondo: fund.nombre,
        tipoFondo: typeInfo?.type,
        typeLabel,
        tipoFilterKey,
        tipoRenta: fund.tipoRenta,
        horizonte: fund.horizonte,
        administradora: fund.administradora,
        depositaria: fund.depositaria,
        tna,
        tea,
        vcp: fund.rendimientos?.valorCuotaparte ?? null,
        patrimonio: fund.patrimonio,
        inversionMinima: fund.inversionMinima,
        monedaInversion: fund.monedaInversion,
        plazoLiquidacionDias: fund.plazoLiquidacionDias,
        region: fund.region,
        fecha: fund.fecha,
      }
    })
}

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

function sortNullableNumber(
  a: number | null | undefined,
  b: number | null | undefined,
) {
  if (a == null || !Number.isFinite(a)) return 1
  if (b == null || !Number.isFinite(b)) return -1
  return a - b
}

// Create single useFunds instance for both OG and page data
const { allFundsCache, data: fundsData, fetch: fetchPageFunds } = useFunds()

const {
  data: allFunds,
  pending: loading,
  error,
} = await useAsyncData(
  'fci-funds-catalog',
  async () => mapCatalogToRows(await fetchFciFundsCatalog()),
  {
    default: () => [] as FundCatalogRow[],
  },
)

const { data: ogItems } = await useAsyncData('og-fondos', async () => {
  await fetchPageFunds({ forceBySeries: true })
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

// Filtros
const searchQuery = useRouteQuery('q', '')
const debouncedSearchQuery = refDebounced(searchQuery, 300)
const selectedTipo = useRouteQuery<string | undefined>('tipo', undefined)
const selectedHorizonte = useRouteQuery<string | undefined>('horizonte', undefined)
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

const horizontesDisponibles = computed(() => {
  const horizontes = new Set<string>()
  allFunds.value.forEach((fund) => {
    if (fund.horizonte) {
      horizontes.add(fund.horizonte)
    }
  })
  return Array.from(horizontes).sort((a, b) => a.localeCompare(b, 'es'))
})

const tipoItems = computed(() => {
  const items: Array<{ label: string; value: string | undefined }> = [
    {
      label: 'Todos los tipos',
      value: undefined,
    },
  ]
  tiposDisponibles.value.forEach(({ value, label }) => {
    items.push({ label, value })
  })
  return items
})

const horizonteItems = computed(() => {
  const items: Array<{ label: string; value: string | undefined }> = [
    {
      label: 'Todos los horizontes',
      value: undefined,
    },
  ]
  horizontesDisponibles.value.forEach((horizonte) => {
    items.push({
      label: horizonte,
      value: horizonte,
    })
  })
  return items
})

const filteredFunds = computed(() => {
  let funds = [...allFunds.value]

  if (debouncedSearchQuery.value) {
    const query = String(debouncedSearchQuery.value).toLowerCase()
    funds = funds.filter((fund) => {
      const byFundName = fund.fondo.toLowerCase().includes(query)
      const byAdministradora = (fund.administradora ?? '').toLowerCase().includes(query)
      const byDepositaria = (fund.depositaria ?? '').toLowerCase().includes(query)
      return byFundName || byAdministradora || byDepositaria
    })
  }

  if (selectedTipo.value) {
    funds = funds.filter((fund) => fund.tipoFilterKey === selectedTipo.value)
  }

  if (selectedHorizonte.value) {
    funds = funds.filter((fund) => fund.horizonte === selectedHorizonte.value)
  }

  return funds
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredFunds.value.length / pageSize.value)),
)

watch([debouncedSearchQuery, selectedTipo, selectedHorizonte], () => {
  currentPage.value = 1
})

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

function getSortableHeader(label: string, align: 'left' | 'right' | 'center' = 'left') {
  return ({ column }: { column: any }) => {
    const isSorted = column.getIsSorted()

    const button = h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label,
      icon: isSorted
        ? isSorted === 'asc'
          ? 'i-lucide-arrow-up-narrow-wide'
          : 'i-lucide-arrow-down-wide-narrow'
        : 'i-lucide-arrow-up-down',
      class: '-mx-2.5',
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
  const fundName = row?.original?.fondo
  if (!fundName) return

  navigateTo(getFundDetailPath(fundName))
}

const columns: TableColumn<FundCatalogRow>[] = [
  {
    accessorKey: 'fondo',
    header: getSortableHeader('Fondo'),
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.fondo),
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
    accessorKey: 'tna',
    header: getSortableHeader('TNA', 'right'),
    cell: ({ row }) => {
      const formatted = formatRatePercent(row.original.tna)
      if (!formatted) return mutedDash()
      return h(
        'div',
        { class: `text-right font-medium text-sm ${metricTone(row.original.tna)}` },
        formatted,
      )
    },
    sortingFn: (rowA, rowB) =>
      sortNullableNumber(rowA.original.tna, rowB.original.tna),
  },
  {
    accessorKey: 'tea',
    header: getSortableHeader('TEA', 'right'),
    cell: ({ row }) => {
      const formatted = formatRatePercent(row.original.tea)
      if (!formatted) return mutedDash()
      return h(
        'div',
        { class: `text-right font-medium text-sm ${metricTone(row.original.tea)}` },
        formatted,
      )
    },
    sortingFn: (rowA, rowB) =>
      sortNullableNumber(rowA.original.tea, rowB.original.tea),
  },
  {
    accessorKey: 'vcp',
    header: getSortableHeader('VCP', 'right'),
    cell: ({ row }) => {
      const formatted = formatDecimal(row.original.vcp)
      if (formatted === '—') return mutedDash()
      return h('div', { class: 'text-right font-mono text-sm' }, formatted)
    },
    sortingFn: (rowA, rowB) =>
      sortNullableNumber(rowA.original.vcp, rowB.original.vcp),
  },
  {
    accessorKey: 'patrimonio',
    header: getSortableHeader('Patrimonio', 'right'),
    cell: ({ row }) => {
      const formatted = formatCompactNumber(row.original.patrimonio)
      if (formatted === '—') return mutedDash()
      return h('div', { class: 'text-right text-sm' }, formatted)
    },
    sortingFn: (rowA, rowB) =>
      sortNullableNumber(rowA.original.patrimonio, rowB.original.patrimonio),
  },
  {
    accessorKey: 'inversionMinima',
    header: getSortableHeader('Inversión mínima', 'right'),
    cell: ({ row }) => {
      const formatted = formatCurrency(
        row.original.inversionMinima,
        row.original.monedaInversion ?? 'ARS',
      )
      if (formatted === '—') return mutedDash()
      return h('div', { class: 'text-right text-sm' }, formatted)
    },
    sortingFn: (rowA, rowB) =>
      sortNullableNumber(rowA.original.inversionMinima, rowB.original.inversionMinima),
  },
  {
    accessorKey: 'plazoLiquidacionDias',
    header: getSortableHeader('Plazo liquidación', 'center'),
    cell: ({ row }) => {
      const days = row.original.plazoLiquidacionDias
      if (days == null || !Number.isFinite(days)) return mutedDash()
      const label = days === 1 ? 'día' : 'días'
      return h('div', { class: 'text-center text-sm' }, `${days} ${label}`)
    },
    sortingFn: (rowA, rowB) =>
      sortNullableNumber(
        rowA.original.plazoLiquidacionDias,
        rowB.original.plazoLiquidacionDias,
      ),
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
  {
    accessorKey: 'administradora',
    header: getSortableHeader('Administradora'),
    cell: ({ row }) => {
      const value = row.original.administradora
      if (!value) return mutedDash()
      return h('div', { class: 'text-sm' }, value)
    },
  },
  {
    accessorKey: 'depositaria',
    header: getSortableHeader('Depositaria'),
    cell: ({ row }) => {
      const value = row.original.depositaria
      if (!value) return mutedDash()
      return h('div', { class: 'text-sm' }, value)
    },
  },
]

const sortQuery = useRouteQuery<string>('sort', '[{"id":"fondo","desc":false}]')

type SortingState = Array<{ id: string; desc: boolean }>

function parseSorting(value: string): SortingState {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [{ id: 'fondo', desc: false }]
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
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3">
      <div>
        <p class="text-xs text-muted mt-1">
          Fuente de datos:
          <NuxtLink
            :to="CNV_CUOTAPARTES_URL"
            external
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-600 dark:text-primary-400 hover:underline"
          >
            CNV - Cuotapartes
          </NuxtLink>
          (vía Argentina Datos)
        </p>
      </div>

      <!-- Filtros -->
      <div class="flex flex-col sm:flex-row gap-4">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Buscar por nombre, administradora o depositaria..."
          class="flex-1"
        />

        <USelect
          v-model="selectedTipo"
          :items="tipoItems"
          placeholder="Filtrar por tipo"
          value-key="value"
          class="flex-1"
        >
          <template #item-label="{ item }">
            {{ item.label }}
          </template>
        </USelect>

        <USelect
          v-model="selectedHorizonte"
          :items="horizonteItems"
          placeholder="Filtrar por horizonte"
          value-key="value"
          class="flex-1"
        >
          <template #item-label="{ item }">
            {{ item.label }}
          </template>
        </USelect>
      </div>

      <!-- Información de resultados -->
      <div
        class="flex flex-col gap-3 text-sm text-muted md:flex-row md:items-center md:justify-between"
      >
        <div class="flex flex-wrap items-center gap-3">
          <span>
            Mostrando {{ pageRange.from }}-{{ pageRange.to }} de {{ filteredFunds.length }} fondos
          </span>
          <span class="hidden md:inline">·</span>
          <span>Total cargados: {{ allFunds.length }}</span>
          <span v-if="searchQuery || selectedTipo || selectedHorizonte" class="text-primary">
            Filtros activos
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs uppercase tracking-wide text-muted">Filas</span>
          <USelect
            v-model="pageSize"
            :items="pageSizeOptions"
            value-key="value"
            class="w-36"
            size="sm"
          >
            <template #item-label="{ item }">
              {{ item.label }}
            </template>
          </USelect>
        </div>
      </div>

      <!-- Error -->
      <UAlert v-if="error" color="error" variant="soft" title="Error cargando fondos">
        No se pudieron cargar los fondos. Por favor, intenta nuevamente.
      </UAlert>

      <!-- Tabla -->
      <div class="border border-default rounded-lg overflow-hidden">
        <div v-if="loading" class="overflow-hidden">
          <div
            class="grid grid-cols-4 gap-3 border-b border-default bg-elevated/50 px-4 py-3 text-sm font-medium text-muted lg:grid-cols-6 xl:grid-cols-8"
          >
            <span>Fondo</span>
            <span>Tipo</span>
            <span class="hidden lg:block">Horizonte</span>
            <span class="text-right">TNA</span>
            <span class="hidden lg:block text-right">TEA</span>
            <span class="text-right">Patrimonio</span>
            <span class="hidden xl:block">Fecha</span>
            <span class="hidden xl:block">Administradora</span>
          </div>

          <div class="space-y-3 p-4">
            <div
              v-for="row in 12"
              :key="`row-${row}`"
              class="grid grid-cols-4 gap-3 lg:grid-cols-6 xl:grid-cols-8"
            >
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="hidden h-10 w-full lg:block" />
              <USkeleton class="hidden h-10 w-full xl:block" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="hidden h-10 w-full lg:block" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="hidden h-10 w-full xl:block" />
            </div>
          </div>
        </div>

        <UTable
          v-else
          v-model:sorting="sorting"
          v-model:pagination="pagination"
          :data="filteredFunds"
          :columns="columns"
          :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
          :on-select="handleFundRowSelect"
          :ui="{ tr: 'cursor-pointer' }"
        >
          <template #empty>
            <div class="py-12 text-center">
              <UIcon name="i-lucide-search-x" class="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 class="text-lg font-medium mb-2">No se encontraron fondos</h3>
              <p class="text-muted">
                {{
                  searchQuery
                    ? 'Intenta ajustar la búsqueda por nombre, administradora o depositaria'
                    : 'No hay fondos disponibles en este momento'
                }}
              </p>
            </div>
          </template>
        </UTable>
      </div>

      <div
        v-if="!loading && filteredFunds.length > pageSize"
        class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <p class="text-sm text-muted">
          Página {{ currentPage }} de {{ totalPages }} · {{ filteredFunds.length }} fondos
          encontrados
        </p>

        <UPagination
          v-model:page="currentPage"
          :items-per-page="pageSize"
          :total="filteredFunds.length"
          :sibling-count="1"
          show-edges
          size="sm"
        />
      </div>

      <div class="text-center text-xs text-muted pt-4 border-t border-default">
        <p>
          Los datos provienen de la
          <NuxtLink
            :to="CNV_CUOTAPARTES_URL"
            external
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Comisión Nacional de Valores (CNV) — Cuotapartes
          </NuxtLink>
          , publicados vía Argentina Datos. La información puede estar desactualizada y no
          garantizamos que estos sean los últimos rendimientos vigentes.
        </p>
      </div>
    </div>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto">
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            ¿Qué es un Fondo Común de Inversión (FCI)?
          </h3>
          <p>
            Un <strong>Fondo Común de Inversión (FCI)</strong> es un patrimonio formado por los
            aportes de muchas personas que tienen objetivos de inversión similares. Este dinero es
            administrado por profesionales que lo invierten en distintos activos como acciones,
            bonos o plazos fijos.
          </p>
          <p>
            En Argentina, los FCI son una alternativa ideal para pequeños y medianos ahorristas, ya
            que permiten diversificar la inversión de manera eficiente y acceder a mercados que, de
            forma individual, serían más difíciles de alcanzar.
          </p>
        </div>
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            Tipos Principales de FCI
          </h3>
          <ul class="list-disc list-inside space-y-2">
            <li>
              <strong>Mercado de Dinero (Money Market):</strong> De bajo riesgo y liquidez
              inmediata, ideal para el efectivo de corto plazo.
            </li>
            <li>
              <strong>Renta Fija:</strong> Invierten mayormente en bonos y otros instrumentos de
              deuda con una tasa predeterminada.
            </li>
            <li>
              <strong>Renta Mixta:</strong> Combinan acciones y bonos para buscar un equilibrio
              entre riesgo y potencial de ganancia.
            </li>
            <li>
              <strong>Renta Variable:</strong> Invierten en acciones de empresas, ofreciendo mayor
              potencial de ganancia a cambio de un mayor riesgo.
            </li>
            <li>
              <strong>Retorno Total:</strong> Buscan maximizar el rendimiento total combinando
              instrumentos de renta fija, cobertura, duration y manejo más flexible de la cartera.
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

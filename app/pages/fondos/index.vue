<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { useRouteQuery } from '@vueuse/router'
import type { TableColumn } from '@nuxt/ui'
import { ogUpdatedAtDate, top3Funds } from '~/utils/og-data'
import { getFundDetailPath } from '~/lib/funds-detail'

definePageMeta({
  pageTitle: 'Fondos Comunes de Inversión (FCI)',
  pageDescription:
    'Consultá y compará todos los FCI disponibles en Argentina. Información actualizada diariamente con datos de rendimiento y patrimonio.',
})

const UButton = resolveComponent('UButton')

// Create single useFunds instance for both OG and page data
const { allFundsCache, data: fundsData, fetch: fetchPageFunds, fetchFundsSeriesLatest } = useFunds()

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

interface FundSeriesRow {
  fondo: string
  horizonte: string
  fecha: string
  vcp: number
  ccp: number
  patrimonio: number
  displayName?: string
  institution?: string
  fechaAnterior?: string
  vcpAnterior?: number
  ccpAnterior?: number
  patrimonioAnterior?: number
  tipoFondo?: 'rentaFija' | 'mercadoDinero' | 'rentaMixta' | 'rentaVariable' | 'retornoTotal'
  typeLabel?: string
}

const loading = ref(true)
const error = ref<unknown>(null)
const allFunds = ref<FundSeriesRow[]>([])

// Función helper para calcular días entre fechas
function daysBetween(a: string, b: string) {
  const d1 = new Date(a)
  const d2 = new Date(b)
  return Math.abs(Math.round((+d1 - +d2) / (1000 * 60 * 60 * 24)))
}

function formatDateArUtc(dateInput: string) {
  const date = new Date(`${dateInput}T00:00:00.000Z`)
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

// Función para calcular rendimiento efectivo (sin anualizar)
function calculateRendimientoEfectivo(newerVCP: number, olderVCP: number): number | null {
  if (olderVCP <= 0 || Number.isNaN(newerVCP) || Number.isNaN(olderVCP)) {
    return null
  }
  const rendimiento = (newerVCP - olderVCP) / olderVCP
  return rendimiento
}

// Función para calcular TNA (anualizado)
function calculateTNA(newerVCP: number, olderVCP: number, daysBetween: number): number | null {
  if (daysBetween <= 0 || olderVCP <= 0 || Number.isNaN(newerVCP) || Number.isNaN(olderVCP)) {
    return null
  }
  const totalReturn = (newerVCP - olderVCP) / olderVCP
  const dailyReturn = totalReturn / daysBetween
  const tna = dailyReturn * 365
  return tna
}

async function fetchFundsBySeries() {
  loading.value = true
  error.value = null

  try {
    allFunds.value = await fetchFundsSeriesLatest()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchFundsBySeries()
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

// Obtener tipos únicos para el filtro
const tiposDisponibles = computed(() => {
  const tipos = new Set<string>()
  allFunds.value.forEach((fund) => {
    if (fund.tipoFondo) {
      tipos.add(fund.tipoFondo)
    }
  })
  return Array.from(tipos).sort()
})

// Obtener horizontes únicos para el filtro
const horizontesDisponibles = computed(() => {
  const horizontes = new Set<string>()
  allFunds.value.forEach((fund) => {
    if (fund.horizonte) {
      horizontes.add(fund.horizonte)
    }
  })
  return Array.from(horizontes).sort()
})

// Items para el select de tipos
const tipoItems = computed(() => {
  const items: Array<{ label: string; value: string | undefined }> = [
    {
      label: 'Todos los tipos',
      value: undefined,
    },
  ]
  tiposDisponibles.value.forEach((tipo) => {
    const tipoLabels: Record<string, string> = {
      rentaFija: 'Renta Fija',
      mercadoDinero: 'Mercado Dinero',
      rentaMixta: 'Renta Mixta',
      rentaVariable: 'Renta Variable',
      retornoTotal: 'Retorno Total',
    }
    items.push({
      label: tipoLabels[tipo] || tipo,
      value: tipo,
    })
  })
  return items
})

// Items para el select de horizontes
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

// Filtrar fondos
const filteredFunds = computed(() => {
  let funds = [...allFunds.value]

  // Filtrar valores NaN
  funds = funds.filter((fund) => {
    const vcp = Number.parseFloat(String(fund.vcp))
    const ccp = Number.parseFloat(String(fund.ccp))
    const patrimonio = Number.parseFloat(String(fund.patrimonio))
    return !Number.isNaN(vcp) && !Number.isNaN(ccp) && !Number.isNaN(patrimonio)
  })

  // Filtro por búsqueda
  if (debouncedSearchQuery.value) {
    const query = String(debouncedSearchQuery.value).toLowerCase()
    funds = funds.filter((fund) => {
      const byFundName = fund.fondo.toLowerCase().includes(query)
      const byDisplayName = (fund.displayName ?? '').toLowerCase().includes(query)
      return byFundName || byDisplayName
    })
  }

  // Filtro por tipo
  if (selectedTipo.value) {
    funds = funds.filter((fund) => fund.tipoFondo === selectedTipo.value)
  }

  // Filtro por horizonte
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

// Función helper para crear headers ordenables
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

// Columnas de la tabla
const columns: TableColumn<FundSeriesRow>[] = [
  {
    accessorKey: 'fondo',
    header: getSortableHeader('Fondo'),
    cell: ({ row }) => {
      const displayName = row.original.displayName
      const fundName = String(row.getValue('fondo') ?? '')

      if (displayName && displayName !== fundName) {
        return h('div', { class: 'space-y-0.5' }, [
          h('div', { class: 'font-medium' }, fundName),
          h('div', { class: 'text-xs text-muted' }, displayName),
        ])
      }

      return h('div', { class: 'font-medium' }, fundName)
    },
  },
  {
    accessorKey: 'tipoFondo',
    header: getSortableHeader('Tipo'),
    cell: ({ row }) => {
      const tipoFondo = row.original.tipoFondo
      const typeLabel = row.original.typeLabel
      if (!tipoFondo) return h('span', { class: 'text-muted' }, '-')
      const tipoLabels: Record<string, string> = {
        rentaFija: 'Renta Fija',
        mercadoDinero: 'Money Market',
        rentaMixta: 'Renta Mixta',
        rentaVariable: 'Renta Variable',
        retornoTotal: 'Retorno Total',
      }
      const label = typeLabel || tipoLabels[tipoFondo] || tipoFondo
      return h('div', { class: 'text-sm' }, label)
    },
  },
  {
    accessorKey: 'horizonte',
    header: getSortableHeader('Horizonte'),
    cell: ({ row }) => {
      const horizonte = row.getValue('horizonte') as string
      return h('div', { class: 'text-sm' }, horizonte || '-')
    },
  },
  {
    accessorKey: 'fecha',
    header: getSortableHeader('Último Cierre'),
    cell: ({ row }) => {
      const fecha = row.getValue('fecha') as string
      if (!fecha) return h('span', { class: 'text-muted' }, '-')
      const formatted = formatDateArUtc(fecha)
      return h('div', { class: 'text-sm' }, formatted)
    },
  },
  {
    accessorKey: 'fechaAnterior',
    header: getSortableHeader('Cierre Base'),
    cell: ({ row }) => {
      const fechaAnterior = row.original.fechaAnterior
      if (!fechaAnterior) return h('span', { class: 'text-muted' }, '-')
      const formatted = formatDateArUtc(fechaAnterior)
      return h('div', { class: 'text-sm text-muted' }, formatted)
    },
  },
  {
    id: 'dias',
    accessorFn: (row: FundSeriesRow) => {
      const fecha = row.fecha
      const fechaAnterior = row.fechaAnterior
      if (!fecha || !fechaAnterior) return null
      const date1 = new Date(fecha)
      const date2 = new Date(fechaAnterior)
      const diffTime = Math.abs(date1.getTime() - date2.getTime())
      return Math.round(diffTime / (1000 * 60 * 60 * 24))
    },
    header: getSortableHeader('Días', 'center'),
    cell: ({ row }) => {
      const fecha = row.original.fecha
      const fechaAnterior = row.original.fechaAnterior
      if (!fecha || !fechaAnterior) return h('span', { class: 'text-muted' }, '-')
      const date1 = new Date(fecha)
      const date2 = new Date(fechaAnterior)
      const diffTime = Math.abs(date1.getTime() - date2.getTime())
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
      const label = diffDays === 1 ? 'día' : 'días'
      return h('div', { class: 'text-center text-sm font-medium' }, `${diffDays} ${label}`)
    },
    sortingFn: (rowA: any, rowB: any) => {
      const fechaA = rowA.original.fecha
      const fechaAnteriorA = rowA.original.fechaAnterior
      const fechaB = rowB.original.fecha
      const fechaAnteriorB = rowB.original.fechaAnterior

      if (!fechaA || !fechaAnteriorA) return 1
      if (!fechaB || !fechaAnteriorB) return -1

      const date1A = new Date(fechaA)
      const date2A = new Date(fechaAnteriorA)
      const diffTimeA = Math.abs(date1A.getTime() - date2A.getTime())
      const diffDaysA = Math.round(diffTimeA / (1000 * 60 * 60 * 24))

      const date1B = new Date(fechaB)
      const date2B = new Date(fechaAnteriorB)
      const diffTimeB = Math.abs(date1B.getTime() - date2B.getTime())
      const diffDaysB = Math.round(diffTimeB / (1000 * 60 * 60 * 24))

      return diffDaysA - diffDaysB
    },
  },
  {
    id: 'rendimientoEfectivo',
    accessorFn: (row: FundSeriesRow) => {
      const vcp = Number.parseFloat(String(row.vcp))
      const vcpAnterior = row.vcpAnterior
      if (vcpAnterior === undefined || Number.isNaN(vcp) || Number.isNaN(vcpAnterior)) {
        return null
      }
      const rendimiento = calculateRendimientoEfectivo(vcp, vcpAnterior)
      return rendimiento ?? null
    },
    header: getSortableHeader('Variación VCP', 'right'),
    cell: ({ row }) => {
      const vcp = Number.parseFloat(String(row.original.vcp))
      const vcpAnterior = row.original.vcpAnterior

      if (vcpAnterior === undefined || Number.isNaN(vcp) || Number.isNaN(vcpAnterior)) {
        return h('span', { class: 'text-muted' }, '-')
      }

      const rendimiento = calculateRendimientoEfectivo(vcp, vcpAnterior)

      if (rendimiento === null) {
        return h('span', { class: 'text-muted' }, '-')
      }

      const formatted = new Intl.NumberFormat('es-AR', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rendimiento)

      const colorClass =
        rendimiento > 0
          ? 'text-green-600 dark:text-green-400'
          : rendimiento < 0
            ? 'text-red-600 dark:text-red-400'
            : ''

      return h('div', { class: `text-right font-medium text-sm ${colorClass}` }, formatted)
    },
    sortingFn: (rowA: { original: FundSeriesRow }, rowB: { original: FundSeriesRow }) => {
      const vcpA = Number.parseFloat(String(rowA.original.vcp))
      const vcpAnteriorA = rowA.original.vcpAnterior
      const vcpB = Number.parseFloat(String(rowB.original.vcp))
      const vcpAnteriorB = rowB.original.vcpAnterior

      if (vcpAnteriorA === undefined || Number.isNaN(vcpA) || Number.isNaN(vcpAnteriorA)) {
        return 1
      }
      if (vcpAnteriorB === undefined || Number.isNaN(vcpB) || Number.isNaN(vcpAnteriorB)) {
        return -1
      }

      const rendimientoA = calculateRendimientoEfectivo(vcpA, vcpAnteriorA)
      const rendimientoB = calculateRendimientoEfectivo(vcpB, vcpAnteriorB)

      if (rendimientoA === null) return 1
      if (rendimientoB === null) return -1

      return (rendimientoA || 0) - (rendimientoB || 0)
    },
  },
  {
    id: 'tna',
    accessorFn: (row: FundSeriesRow) => {
      const fecha = row.fecha
      const fechaAnterior = row.fechaAnterior
      const vcp = Number.parseFloat(String(row.vcp))
      const vcpAnterior = row.vcpAnterior

      if (
        !fecha ||
        !fechaAnterior ||
        vcpAnterior === undefined ||
        Number.isNaN(vcp) ||
        Number.isNaN(vcpAnterior)
      ) {
        return null
      }

      const days = daysBetween(fecha, fechaAnterior)
      const tna = calculateTNA(vcp, vcpAnterior, days)
      return tna ?? null
    },
    header: getSortableHeader('TNA Estimada', 'right'),
    cell: ({ row }) => {
      const fecha = row.original.fecha
      const fechaAnterior = row.original.fechaAnterior
      const vcp = Number.parseFloat(String(row.original.vcp))
      const vcpAnterior = row.original.vcpAnterior

      if (
        !fecha ||
        !fechaAnterior ||
        vcpAnterior === undefined ||
        Number.isNaN(vcp) ||
        Number.isNaN(vcpAnterior)
      ) {
        return h('span', { class: 'text-muted' }, '-')
      }

      const days = daysBetween(fecha, fechaAnterior)
      const tna = calculateTNA(vcp, vcpAnterior, days)

      if (tna === null) {
        return h('span', { class: 'text-muted' }, '-')
      }

      const formatted = new Intl.NumberFormat('es-AR', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(tna)

      const colorClass =
        tna > 0
          ? 'text-green-600 dark:text-green-400'
          : tna < 0
            ? 'text-red-600 dark:text-red-400'
            : ''

      return h('div', { class: `text-right font-medium text-sm ${colorClass}` }, formatted)
    },
    sortingFn: (rowA: { original: FundSeriesRow }, rowB: { original: FundSeriesRow }) => {
      const fechaA = rowA.original.fecha
      const fechaAnteriorA = rowA.original.fechaAnterior
      const vcpA = Number.parseFloat(String(rowA.original.vcp))
      const vcpAnteriorA = rowA.original.vcpAnterior

      const fechaB = rowB.original.fecha
      const fechaAnteriorB = rowB.original.fechaAnterior
      const vcpB = Number.parseFloat(String(rowB.original.vcp))
      const vcpAnteriorB = rowB.original.vcpAnterior

      if (
        !fechaA ||
        !fechaAnteriorA ||
        vcpAnteriorA === undefined ||
        Number.isNaN(vcpA) ||
        Number.isNaN(vcpAnteriorA)
      ) {
        return 1
      }
      if (
        !fechaB ||
        !fechaAnteriorB ||
        vcpAnteriorB === undefined ||
        Number.isNaN(vcpB) ||
        Number.isNaN(vcpAnteriorB)
      ) {
        return -1
      }

      const daysA = daysBetween(fechaA, fechaAnteriorA)
      const tnaA = calculateTNA(vcpA, vcpAnteriorA, daysA)

      const daysB = daysBetween(fechaB, fechaAnteriorB)
      const tnaB = calculateTNA(vcpB, vcpAnteriorB, daysB)

      if (tnaA === null) return 1
      if (tnaB === null) return -1

      return (tnaA || 0) - (tnaB || 0)
    },
  },
  {
    accessorKey: 'vcp',
    header: getSortableHeader('VCP Último Cierre', 'right'),
    cell: ({ row }) => {
      const vcp = Number.parseFloat(row.getValue('vcp') as string)
      if (Number.isNaN(vcp)) return h('span', { class: 'text-muted' }, '-')
      const formatted = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }).format(vcp)
      return h('div', { class: 'text-right font-mono text-sm' }, formatted)
    },
  },
  {
    accessorKey: 'vcpAnterior',
    header: getSortableHeader('VCP Cierre Base', 'right'),
    cell: ({ row }) => {
      const vcpAnterior = row.original.vcpAnterior
      if (vcpAnterior === undefined || Number.isNaN(vcpAnterior)) {
        return h('span', { class: 'text-muted' }, '-')
      }
      const formatted = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }).format(vcpAnterior)
      return h('div', { class: 'text-right font-mono text-sm text-muted' }, formatted)
    },
  },
  {
    accessorKey: 'ccp',
    header: getSortableHeader('CCP Último Cierre', 'right'),
    cell: ({ row }) => {
      const ccp = Number.parseFloat(row.getValue('ccp') as string)
      if (Number.isNaN(ccp)) return h('span', { class: 'text-muted' }, '-')
      const formatted = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }).format(ccp)
      return h('div', { class: 'text-right font-mono text-sm' }, formatted)
    },
  },
  {
    accessorKey: 'ccpAnterior',
    header: getSortableHeader('CCP Cierre Base', 'right'),
    cell: ({ row }) => {
      const ccpAnterior = row.original.ccpAnterior
      if (ccpAnterior === undefined || Number.isNaN(ccpAnterior)) {
        return h('span', { class: 'text-muted' }, '-')
      }
      const formatted = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }).format(ccpAnterior)
      return h('div', { class: 'text-right font-mono text-sm text-muted' }, formatted)
    },
  },
  {
    accessorKey: 'patrimonio',
    header: getSortableHeader('Patrimonio Último Cierre', 'right'),
    cell: ({ row }) => {
      const patrimonio = row.getValue('patrimonio') as number
      if (Number.isNaN(patrimonio)) return h('span', { class: 'text-muted' }, '-')
      const formatted = new Intl.NumberFormat('es-AR', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(patrimonio)
      return h('div', { class: 'text-right text-sm' }, formatted)
    },
  },
  {
    accessorKey: 'patrimonioAnterior',
    header: getSortableHeader('Patrimonio Cierre Base', 'right'),
    cell: ({ row }) => {
      const patrimonioAnterior = row.original.patrimonioAnterior
      if (patrimonioAnterior === undefined || Number.isNaN(patrimonioAnterior)) {
        return h('span', { class: 'text-muted' }, '-')
      }
      const formatted = new Intl.NumberFormat('es-AR', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(patrimonioAnterior)
      return h('div', { class: 'text-right text-sm text-muted' }, formatted)
    },
  },
]

// Estado de ordenamiento
const sorting = useRouteQuery(
  'sort',
  [
    {
      id: 'fondo',
      desc: false,
    },
  ],
  {
    transform: (value: any) => {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return value
      }
    },
  },
)
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3">
      <div>
        <p class="text-xs text-muted mt-1">
          Fuente de datos:
          <NuxtLink
            to="https://www.cafci.org.ar/"
            external
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-600 dark:text-primary-400 hover:underline"
          >
            CAFCI - Cámara Argentina de Fondos Comunes de Inversión
          </NuxtLink>
        </p>
      </div>

      <!-- Filtros -->
      <div class="flex flex-col sm:flex-row gap-4">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Buscar por nombre de fondo..."
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
            class="grid grid-cols-4 gap-3 border-b border-default bg-elevated/50 px-4 py-3 text-sm font-medium text-muted lg:grid-cols-6 xl:grid-cols-12"
          >
            <span>Fondo</span>
            <span>Tipo</span>
            <span>Horizonte</span>
            <span>Último Cierre</span>
            <span class="hidden xl:block">Cierre Base</span>
            <span class="hidden xl:block text-center">Días</span>
            <span class="text-right">Variación VCP</span>
            <span class="hidden lg:block text-right">TNA Estimada</span>
            <span class="hidden xl:block text-right">VCP Último Cierre</span>
            <span class="hidden xl:block text-right">VCP Cierre Base</span>
            <span class="hidden xl:block text-right">CCP Último Cierre</span>
            <span class="hidden xl:block text-right">Patrimonio Último Cierre</span>
          </div>

          <div class="space-y-3 p-4">
            <div
              v-for="row in 12"
              :key="`row-${row}`"
              class="grid grid-cols-4 gap-3 lg:grid-cols-6 xl:grid-cols-12"
            >
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="hidden h-10 w-full xl:block" />
              <USkeleton class="hidden h-10 w-full xl:block" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="hidden h-10 w-full lg:block" />
              <USkeleton class="hidden h-10 w-full xl:block" />
              <USkeleton class="hidden h-10 w-full xl:block" />
              <USkeleton class="hidden h-10 w-full xl:block" />
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
                    ? 'Intenta ajustar la búsqueda por nombre'
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
            to="https://www.cafci.org.ar/"
            external
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Cámara Argentina de Fondos Comunes de Inversión (CAFCI)
          </NuxtLink>
          . La información puede estar desactualizada y no garantizamos que estos sean los últimos
          rendimientos vigentes.
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

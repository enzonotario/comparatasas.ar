<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const UButton = resolveComponent('UButton')

useSeoMeta({
  title: 'Fondos de Inversión - Compara Tasas',
  description:
    'Consultá y compará todos los fondos comunes de inversión (FCI) disponibles en Argentina. Información actualizada diariamente con datos de rendimiento, patrimonio y características.',
  ogTitle: 'Fondos de Inversión - Compara Tasas',
  ogDescription:
    'Consultá y compará todos los fondos comunes de inversión (FCI) disponibles en Argentina. Información actualizada diariamente con datos de rendimiento, patrimonio y características.',
})

interface FundRaw {
  fondo: string
  horizonte: string
  fecha: string
  vcp: number
  ccp: number
  patrimonio: number
}

interface FundWithPrevious extends FundRaw {
  fechaAnterior?: string
  vcpAnterior?: number
  ccpAnterior?: number
  patrimonioAnterior?: number
  tipoFondo?: 'rentaFija' | 'mercadoDinero' | 'rentaMixta' | 'rentaVariable'
}

const loading = ref(true)
const error = ref<unknown>(null)
const allFunds = ref<FundWithPrevious[]>([])

// Función helper para calcular días entre fechas
function daysBetween(a: string, b: string) {
  const d1 = new Date(a)
  const d2 = new Date(b)
  return Math.abs(Math.round((+d1 - +d2) / (1000 * 60 * 60 * 24)))
}

// Obtener datos anteriores de RentaFija para una fecha específica
async function getRentaFijaPreviousData(targetDate: Date): Promise<FundRaw[]> {
  const dateCopy = new Date(targetDate)
  const isoString = dateCopy.toISOString().split('T')[0]
  if (!isoString) {
    throw new Error('Invalid date')
  }
  const targetDateString = isoString.replace(/-/g, '/')

  try {
    const response = await $fetch<FundRaw[]>(
      `https://api.argentinadatos.com/v1/finanzas/fci/rentaFija/${targetDateString}`,
    )

    if (!response || response.length === 0) {
      throw new Error(`No data for date ${targetDateString}`)
    }

    return response
  } catch {
    const newDate = new Date(targetDate)
    newDate.setDate(newDate.getDate() - 1)
    return await getRentaFijaPreviousData(newDate)
  }
}

// Obtener datos anteriores de RentaFija (30 días antes o la fecha más cercana disponible)
async function getLatestAndPreviousRentaFija() {
  const latest = await $fetch<FundRaw[]>(
    'https://api.argentinadatos.com/v1/finanzas/fci/rentaFija/ultimo',
  ).catch(() => [] as FundRaw[])

  const responses: Record<string, FundRaw[]> = {}
  const previous: FundRaw[] = []

  for (const fund of latest) {
    if (!fund.fecha) continue

    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    if (!todayString) continue

    const daysDiff = daysBetween(fund.fecha, todayString)
    if (daysDiff > 30) continue

    const fundName = fund.fondo
    const targetDate = new Date(fund.fecha)
    targetDate.setDate(targetDate.getDate() - 30)
    const targetDateString = targetDate.toISOString().split('T')[0]?.replace(/-/g, '/')
    if (!targetDateString) continue

    let fundPrevious = responses[targetDateString]
    if (!fundPrevious) {
      try {
        fundPrevious = await getRentaFijaPreviousData(new Date(targetDate))
        responses[targetDateString] = fundPrevious
      } catch (e) {
        console.warn(`No data for date ${targetDateString}`, fund.fondo, e)
        fundPrevious = []
        responses[targetDateString] = fundPrevious
      }
    }

    if (fundPrevious && fundPrevious.length > 0) {
      // find the closest date before or equal to target date
      const sortedPrevious = fundPrevious
        .filter((f) => f.fondo === fundName && f.fecha && new Date(f.fecha) <= targetDate)
        .sort((a, b) => {
          const dateA = a.fecha ? new Date(a.fecha).getTime() : 0
          const dateB = b.fecha ? new Date(b.fecha).getTime() : 0
          return dateB - dateA
        })

      if (sortedPrevious.length > 0 && sortedPrevious[0]) {
        previous.push(sortedPrevious[0])
      }
    }
  }

  return { latest, previous }
}

// Obtener datos directamente de la API (actuales y anteriores)
async function fetchFunds() {
  loading.value = true
  error.value = null

  try {
    // Obtener datos actuales y anteriores de cada categoría
    const [
      rentaFijaData,
      mercadoDineroLatest,
      mercadoDineroPrevious,
      rentaMixtaLatest,
      rentaMixtaPrevious,
      rentaVariableLatest,
      rentaVariablePrevious,
    ] = await Promise.all([
      getLatestAndPreviousRentaFija(),
      $fetch<FundRaw[]>(
        'https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/ultimo',
      ).catch(() => [] as FundRaw[]),
      $fetch<FundRaw[]>(
        'https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/penultimo',
      ).catch(() => [] as FundRaw[]),
      $fetch<FundRaw[]>('https://api.argentinadatos.com/v1/finanzas/fci/rentaMixta/ultimo').catch(
        () => [] as FundRaw[],
      ),
      $fetch<FundRaw[]>(
        'https://api.argentinadatos.com/v1/finanzas/fci/rentaMixta/penultimo',
      ).catch(() => [] as FundRaw[]),
      $fetch<FundRaw[]>(
        'https://api.argentinadatos.com/v1/finanzas/fci/rentaVariable/ultimo',
      ).catch(() => [] as FundRaw[]),
      $fetch<FundRaw[]>(
        'https://api.argentinadatos.com/v1/finanzas/fci/rentaVariable/penultimo',
      ).catch(() => [] as FundRaw[]),
    ])

    // Combinar datos actuales con anteriores
    const combineWithPrevious = (
      latest: FundRaw[],
      previous: FundRaw[],
      tipoFondo: 'rentaFija' | 'mercadoDinero' | 'rentaMixta' | 'rentaVariable',
    ): FundWithPrevious[] => {
      return latest.map((fund) => {
        const previousFund = previous.find((p) => p.fondo === fund.fondo)
        return {
          ...fund,
          fechaAnterior: previousFund?.fecha,
          vcpAnterior: previousFund?.vcp,
          ccpAnterior: previousFund?.ccp,
          patrimonioAnterior: previousFund?.patrimonio,
          tipoFondo,
        }
      })
    }

    const combinedFunds = [
      ...combineWithPrevious(rentaFijaData.latest, rentaFijaData.previous, 'rentaFija'),
      ...combineWithPrevious(mercadoDineroLatest, mercadoDineroPrevious, 'mercadoDinero'),
      ...combineWithPrevious(rentaMixtaLatest, rentaMixtaPrevious, 'rentaMixta'),
      ...combineWithPrevious(rentaVariableLatest, rentaVariablePrevious, 'rentaVariable'),
    ]

    allFunds.value = combinedFunds
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

// Cargar datos al montar
onMounted(() => {
  fetchFunds()
})

// Filtros
const searchQuery = ref('')
const debouncedSearchQuery = refDebounced(searchQuery, 300)
const selectedTipo = ref<undefined | string>(undefined)
const selectedHorizonte = ref<undefined | string>(undefined)

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
    const query = debouncedSearchQuery.value.toLowerCase()
    funds = funds.filter((fund) => fund.fondo.toLowerCase().includes(query))
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

// Columnas de la tabla
const columns: TableColumn<FundWithPrevious>[] = [
  {
    accessorKey: 'fondo',
    header: getSortableHeader('Fondo'),
    cell: ({ row }) => {
      return h('div', { class: 'font-medium' }, row.getValue('fondo'))
    },
  },
  {
    accessorKey: 'tipoFondo',
    header: getSortableHeader('Tipo'),
    cell: ({ row }) => {
      const tipoFondo = row.original.tipoFondo
      if (!tipoFondo) return h('span', { class: 'text-muted' }, '-')
      const tipoLabels: Record<string, string> = {
        rentaFija: 'Renta Fija',
        mercadoDinero: 'Mercado Dinero',
        rentaMixta: 'Renta Mixta',
        rentaVariable: 'Renta Variable',
      }
      const label = tipoLabels[tipoFondo] || tipoFondo
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
      const date = new Date(fecha)
      const formatted = date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      return h('div', { class: 'text-sm' }, formatted)
    },
  },
  {
    accessorKey: 'fechaAnterior',
    header: getSortableHeader('Cierre Base'),
    cell: ({ row }) => {
      const fechaAnterior = row.original.fechaAnterior
      if (!fechaAnterior) return h('span', { class: 'text-muted' }, '-')
      const date = new Date(fechaAnterior)
      const formatted = date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      return h('div', { class: 'text-sm text-muted' }, formatted)
    },
  },
  {
    id: 'dias',
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
const sorting = ref([
  {
    id: 'fondo',
    desc: false,
  },
])
</script>

<template>
  <div class="space-y-3">
    <div>
      <h1 class="text-2xl font-bold mb-2">Fondos Comunes de Inversión</h1>
      <p class="text-muted">
        Consultá y compará todos los FCI disponibles en Argentina. Información actualizada
        diariamente con datos de rendimiento, patrimonio y características de cada fondo.
      </p>
      <p class="text-xs text-muted mt-1">
        Fuente de datos:
        <NuxtLink
          to="https://www.cafci.org.ar/index.html"
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
    <div class="flex items-center justify-between text-sm text-muted">
      <span> Mostrando {{ filteredFunds.length }} de {{ allFunds.length }} fondos </span>
      <span v-if="searchQuery || selectedTipo || selectedHorizonte" class="text-primary">
        Filtros activos
      </span>
    </div>

    <!-- Error -->
    <UAlert v-if="error" color="error" variant="soft" title="Error cargando fondos">
      No se pudieron cargar los fondos. Por favor, intenta nuevamente.
    </UAlert>

    <!-- Tabla -->
    <div class="border border-default rounded-lg overflow-hidden">
      <UTable
        v-model:sorting="sorting"
        :data="filteredFunds"
        :columns="columns"
        :loading="loading"
        virtualize
        class="h-[600px]"
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

    <div class="text-center text-xs text-muted pt-4 border-t border-default">
      <p>
        Los datos provienen de la
        <NuxtLink
          to="https://www.cafci.org.ar/index.html"
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
</template>

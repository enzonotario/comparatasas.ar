<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { FundCatalogRow } from '~/composables/useFondosCatalog'

const props = defineProps<{
  allFunds: FundCatalogRow[]
  collapsed?: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const route = useRoute()
const isDetailPage = computed(() => route.name === 'fondos-nombre')

const CNV_CUOTAPARTES_URL = 'https://www.cnv.gov.ar/SitioWeb/FondosComunesInversion/CuotaPartes'

const PRESERVED_KEYS = ['agrupar', 'sort', 'pageSize'] as const

const TIPO_ICONS: Record<string, string> = {
  mercadoDinero: 'i-lucide-wallet',
  rentaFija: 'i-lucide-landmark',
  rentaMixta: 'i-lucide-scale',
  rentaVariable: 'i-lucide-trending-up',
  retornoTotal: 'i-lucide-chart-line',
  asg: 'i-lucide-leaf',
  pymes: 'i-lucide-building-2',
  infraestructura: 'i-lucide-hard-hat',
  fondosCerrados: 'i-lucide-lock',
}

function closeSidebar() {
  emit('select')
}

function queryValue(key: string) {
  const value = route.query[key]
  return typeof value === 'string' ? value : undefined
}

function catalogQuery(patch: Record<string, string | undefined>) {
  const query: Record<string, string> = {}

  for (const key of PRESERVED_KEYS) {
    const value = queryValue(key)
    if (value) query[key] = value
  }

  const tipo = Object.prototype.hasOwnProperty.call(patch, 'tipo') ? patch.tipo : queryValue('tipo')
  if (tipo) query.tipo = tipo

  for (const [key, value] of Object.entries(patch)) {
    if (key === 'tipo') continue
    if (value == null || value === '') delete query[key]
    else query[key] = value
  }

  delete query.page

  return { path: '/fondos' as const, query }
}

function clearTipoQuery() {
  return catalogQuery({ tipo: undefined })
}

const selectedTipo = computed(() => queryValue('tipo'))

const tipoChildren = computed<NavigationMenuItem[]>(() => {
  const map = new Map<string, string>()
  for (const fund of props.allFunds) {
    if (!fund.tipoFilterKey) continue
    map.set(fund.tipoFilterKey, fund.typeLabel)
  }

  const types = Array.from(map.entries())
    .map(([value, label]) => ({
      label,
      icon: TIPO_ICONS[value] || 'i-lucide-circle-dot',
      to: catalogQuery({ tipo: value }),
      active: route.path === '/fondos' && selectedTipo.value === value,
      onSelect: closeSidebar,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))

  return [
    {
      label: 'Todos los tipos',
      icon: 'i-lucide-layout-list',
      to: clearTipoQuery(),
      exact: true,
      active: route.path === '/fondos' && !selectedTipo.value,
      onSelect: closeSidebar,
    },
    ...types,
  ]
})

const mainLinks = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = []

  if (isDetailPage.value) {
    items.push({
      label: 'Volver al catálogo',
      icon: 'i-lucide-arrow-left',
      to: '/fondos',
      onSelect: closeSidebar,
    })
  }

  items.push({
    label: 'Tipos de fondo',
    icon: 'i-lucide-layers',
    type: 'trigger',
    defaultOpen: true,
    children: tipoChildren.value,
  })

  return items
})

const secondaryLinks = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Metodología',
    icon: 'i-lucide-book-open',
    to: '/metodologia',
    onSelect: closeSidebar,
  },
])
</script>

<template>
  <UNavigationMenu
    :collapsed="collapsed"
    :items="mainLinks"
    orientation="vertical"
    tooltip
    popover
    color="neutral"
  />

  <UNavigationMenu
    :collapsed="collapsed"
    :items="secondaryLinks"
    orientation="vertical"
    tooltip
    color="neutral"
    class="mt-auto"
  />
</template>

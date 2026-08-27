<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { FundCatalogRow } from '~/composables/useFondosCatalog'
import { formatCompactPatrimonio, normalizeCurrencyCode } from '~/lib/fci-fund-formatters'
import { findSiblingFundClasses } from '~/lib/fci-fund-groups'
import { getFundDetailTo, getFundDetailToOptionsFromRoute, normalizeFundSlug } from '~/lib/funds-detail'

const props = defineProps<{
  allFunds: FundCatalogRow[]
}>()

const emit = defineEmits<{
  select: []
}>()

const route = useRoute()
const isDetailPage = computed(
  () => route.name === 'fondos-nombre' || route.name === 'fondos-nombre-historico',
)
const isMarketPage = computed(() => route.path === '/fondos/mercado')
const detailSlug = computed(() => String(route.params.nombre || ''))
const detailToOptions = computed(() => getFundDetailToOptionsFromRoute(route))

const PRESERVED_KEYS = ['agrupar', 'sort', 'pageSize', 'vista'] as const

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

const currentCatalogFund = computed(() => {
  if (!isDetailPage.value || !detailSlug.value) return null
  return (
    props.allFunds.find((fund) => normalizeFundSlug(fund.fondo) === detailSlug.value) ?? null
  )
})

const detailSiblingInfo = computed(() => {
  const fund = currentCatalogFund.value
  if (!fund) return null

  return findSiblingFundClasses(props.allFunds, fund.fondo, {
    fondoId: fund.fondoId,
  })
})

const claseChildren = computed<NavigationMenuItem[]>(() => {
  const info = detailSiblingInfo.value
  if (!info?.siblings.length) return []

  return info.siblings.map((row) => {
    const isActive = normalizeFundSlug(row.fondo) === detailSlug.value
    const patrimonio = formatCompactPatrimonio(row.patrimonio, row.monedaInversion || row.moneda)
    const currency = normalizeCurrencyCode(row.monedaInversion || row.moneda)

    return {
      label: row.classLabel || row.fondo,
      icon: isActive ? 'i-lucide-circle-dot' : 'i-lucide-circle',
      to: isActive ? undefined : getFundDetailTo(row.fondo, detailToOptions.value),
      active: isActive,
      badge: patrimonio !== '—' ? `${currency} · ${patrimonio}` : currency,
      onSelect: closeSidebar,
    }
  })
})

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
  if (isDetailPage.value) {
    const items: NavigationMenuItem[] = [
      {
        label: 'Volver al catálogo',
        icon: 'i-lucide-arrow-left',
        to: '/fondos',
        onSelect: closeSidebar,
      },
    ]

    const siblings = claseChildren.value
    if (siblings.length) {
      const baseName = detailSiblingInfo.value?.baseName
      items.push(
        {
          label: baseName || 'Clases del fondo',
          type: 'label',
        },
        ...siblings,
      )
    }

    return items
  }

  return [
    {
      label: 'Explorar',
      type: 'label',
    },
    {
      label: 'Catálogo',
      icon: 'i-lucide-layout-list',
      to: '/fondos',
      exact: true,
      active: route.path === '/fondos' && !selectedTipo.value,
      onSelect: closeSidebar,
    },
    {
      label: 'Mercado',
      icon: 'i-lucide-chart-pie',
      to: '/fondos/mercado',
      active: isMarketPage.value,
      onSelect: closeSidebar,
    },
    {
      label: 'Tipos de fondo',
      type: 'label',
    },
    ...tipoChildren.value,
  ]
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
    :items="mainLinks"
    orientation="vertical"
    color="neutral"
  />

  <UNavigationMenu
    :items="secondaryLinks"
    orientation="vertical"
    color="neutral"
    class="mt-auto"
  />
</template>

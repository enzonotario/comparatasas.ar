<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useMediaQuery } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import {
  getComisionesBrokersProductoLabel,
  getComisionesBrokersProductoPath,
} from '~/lib/comisiones-brokers-nav'
import {
  filterComisionesBrokers,
  formatMembresiaMensual,
  formatOperacionLabel,
  formatPlanLabel,
  formatProductoLabel,
  formatTasaAnualComparable,
  formatTasaPublicada,
  hasTasaAnualComparable,
  PRODUCTO_BROKER_ORDER,
  sortKeyComisionBroker,
  type ComisionBrokerApi,
} from '~/lib/finance/comision-caucion-broker'
import { formatCurrency, formatPercentAuto } from '~/lib/fci-fund-formatters'
import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'
import { withOutboundUtm } from '~/lib/outbound-url'
import { ogUpdatedAtDate } from '~/utils/og-data'

const props = defineProps<{
  producto: string
}>()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const { trackProviderClick } = useAnalytics()
const {
  comisiones,
  fechaActualizacion,
  loading,
  error,
  fetch: fetchComisiones,
} = useComisionesBrokers()

await fetchComisiones().catch(() => undefined)

interface ComisionRow extends ComisionBrokerApi {
  displayName: string
  initials: string
  logo?: string
  providerUrl?: string
  tasaPublicada: string
  tasaAnualLabel: string
  tasaSort: number
  membresiaLabel: string | null
  planLabel: string | null
  operacionLabel: string
  productoLabel: string
  ivaLabel: string
  minimoLabel: string
  derechoLabel: string
}

const isDesktop = useMediaQuery('(min-width: 1024px)')
const monedaFilter = useRouteQuery('moneda', 'ARS')
const operacionFilter = useRouteQuery('operacion', 'all')
const sortQuery = useRouteQuery('sort', '[{"id":"tasaSort","desc":false}]')
const DEFAULT_SORT = '[{"id":"tasaSort","desc":false}]'

const sorting = computed({
  get: () => {
    try {
      return JSON.parse(sortQuery.value || '[]')
    } catch {
      return [{ id: 'tasaSort', desc: false }]
    }
  },
  set: (value) => {
    sortQuery.value = JSON.stringify(value)
  },
})

function productNavigationQuery(): Record<string, string> {
  const query: Record<string, string> = {}
  if (monedaFilter.value !== 'ARS') query.moneda = monedaFilter.value
  if (sortQuery.value && sortQuery.value !== DEFAULT_SORT) query.sort = sortQuery.value
  return query
}

function productoTo(producto: string) {
  return {
    path: getComisionesBrokersProductoPath(producto),
    query: productNavigationQuery(),
  }
}

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase()
}

const productoOptions = computed(() => {
  const present = new Set(comisiones.value.map((row) => row.producto).filter(Boolean))
  const ordered = PRODUCTO_BROKER_ORDER.filter((id) => present.has(id))
  const extras = [...present].filter((id) => !PRODUCTO_BROKER_ORDER.includes(id as never)).sort()
  return [...ordered, ...extras].map((value) => ({
    value,
    label: formatProductoLabel(value),
  }))
})

const monedaOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
] as const

const operacionOptions = computed(() => {
  const present = new Set(
    comisiones.value
      .filter((row) => row.producto === props.producto)
      .map((row) => row.operacion)
      .filter(Boolean),
  )
  return [...present]
    .sort((a, b) => formatOperacionLabel(a).localeCompare(formatOperacionLabel(b), 'es'))
    .map((value) => ({
      value,
      label: formatOperacionLabel(value),
    }))
})

const showOperacionFilter = computed(() => operacionOptions.value.length > 1)

const effectiveOperacionFilter = computed(() => {
  const operacion = operacionFilter.value || 'all'
  if (operacion === 'all') return 'all'
  if (operacionOptions.value.some((option) => option.value === operacion)) return operacion
  return 'all'
})

watch(
  [() => props.producto, operacionOptions, operacionFilter],
  () => {
    if (effectiveOperacionFilter.value !== operacionFilter.value) {
      operacionFilter.value = 'all'
    }
  },
  { flush: 'post', immediate: true },
)

const rows = computed<ComisionRow[]>(() => {
  const filtered = filterComisionesBrokers(comisiones.value, {
    producto: props.producto,
    moneda: (monedaFilter.value as 'all' | 'ARS' | 'USD') || 'ARS',
    operacion: effectiveOperacionFilter.value,
  })

  return filtered.map((item) => {
    const displayName =
      getInstitutionShortName(item.entidad) ||
      getInstitutionShortName(item.nombreComercial) ||
      item.nombreComercial ||
      item.entidad
    const logo =
      getInstitutionLogo(item.entidad) || getInstitutionLogo(item.nombreComercial) || undefined
    const providerUrl = withOutboundUtm(
      getInstitutionUrl(item.entidad, 'comisiones-brokers') ||
        getInstitutionUrl(item.nombreComercial, 'comisiones-brokers') ||
        item.enlace ||
        '#',
      'comisiones-brokers',
    )

    return {
      ...item,
      displayName,
      initials: getInitials(displayName),
      logo,
      providerUrl: providerUrl !== '#' ? providerUrl : undefined,
      enlace: item.enlace ? withOutboundUtm(item.enlace, 'comisiones-brokers') : item.enlace,
      tasaPublicada: formatTasaPublicada(item),
      tasaAnualLabel: formatTasaAnualComparable(item),
      tasaSort: sortKeyComisionBroker(item),
      membresiaLabel: formatMembresiaMensual(item),
      planLabel: formatPlanLabel(item.plan),
      operacionLabel: formatOperacionLabel(item.operacion),
      productoLabel: formatProductoLabel(item.producto),
      ivaLabel: item.ivaAdicional ? '+ IVA' : item.incluyeIva ? 'Incluye IVA' : 'Sin IVA',
      minimoLabel:
        item.comisionMinima != null ? formatCurrency(item.comisionMinima, item.moneda) : '—',
      derechoLabel:
        item.derechoMercado != null ? formatPercentAuto(item.derechoMercado * 100) : '—',
    }
  })
})

const showEquivAnual = computed(() => rows.value.some((row) => hasTasaAnualComparable(row)))

const sortedRows = computed(() => {
  const sort = sorting.value?.[0]
  if (!sort) return rows.value

  const dir = sort.desc ? -1 : 1
  const id = sort.id as keyof ComisionRow

  return [...rows.value].sort((a, b) => {
    const av = a[id]
    const bv = b[id]
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * dir
    }
    return String(av ?? '').localeCompare(String(bv ?? ''), 'es') * dir
  })
})

function formatUpdatedAt(value: string | null): string {
  if (!value) return ogUpdatedAtDate()

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value))
}

const formattedUpdatedAt = computed(() => formatUpdatedAt(fechaActualizacion.value))

const productoLabel = computed(() => getComisionesBrokersProductoLabel(props.producto))

const seoTitle = computed(() =>
  props.producto === 'cauciones'
    ? 'Comisiones de brokers'
    : `Comisiones de brokers — ${productoLabel.value}`,
)

const seoDescription = computed(() =>
  props.producto === 'cauciones'
    ? 'Compará comisiones de brokers argentinos por producto, moneda y operación. Incluye membresía de plan cuando aplica.'
    : `Compará comisiones de ALyC para ${productoLabel.value.toLowerCase()} en ARS y USD.`,
)

const canonicalUrl = computed(
  () => `https://comparatasas.ar${getComisionesBrokersProductoPath(props.producto)}`,
)

const ogItems = computed(() => {
  return [...sortedRows.value].slice(0, 3).map((item) => ({
    name: `${item.displayName}${item.planLabel ? ` · ${item.planLabel}` : ''}`,
    rate: item.membresiaLabel
      ? `${item.tasaPublicada} · membresía ${item.membresiaLabel}`
      : item.tasaPublicada,
  }))
})

defineOgImage('ComparaTasas.takumi', {
  title: seoTitle,
  items: ogItems.value ?? [],
  updatedAt: formattedUpdatedAt.value,
})

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: computed(() => `${seoTitle.value} - Compara Tasas`),
  ogDescription: seoDescription,
})

useHead({
  link: computed(() => [
    { rel: 'canonical', href: canonicalUrl.value },
    { rel: 'alternate', hreflang: 'es-AR', href: canonicalUrl.value },
    { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl.value },
  ]),
})

function sortableHeader(label: string) {
  return ({
    column,
  }: {
    column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void }
  }) => {
    const isSorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label,
      icon: isSorted
        ? isSorted === 'asc'
          ? 'i-lucide-arrow-up-narrow-wide'
          : 'i-lucide-arrow-down-wide-narrow'
        : 'i-lucide-arrow-up-down',
      class: '-mx-2.5 font-semibold',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    })
  }
}

function renderBrokerCell(row: ComisionRow) {
  const avatar = row.logo
    ? h('img', {
        src: row.logo,
        alt: `${row.displayName} logo`,
        class: 'size-9 rounded-full object-contain',
        loading: 'lazy',
      })
    : h(
        'div',
        {
          class:
            'flex size-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
        },
        row.initials,
      )

  const title = h(
    'p',
    {
      class: row.providerUrl
        ? 'font-medium text-primary-600 group-hover:underline dark:text-primary-400'
        : 'font-medium text-neutral-900 dark:text-white',
    },
    row.displayName,
  )

  const content = h('div', { class: 'min-w-0' }, [
    title,
    row.planLabel ? h('p', { class: 'text-xs text-neutral-500' }, row.planLabel) : null,
  ])

  if (!row.providerUrl) {
    return h('div', { class: 'flex items-center gap-3' }, [avatar, content])
  }

  return h(
    'a',
    {
      href: row.providerUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      class: 'group flex items-center gap-3',
      onClick: () =>
        trackProviderClick({
          section: 'comisiones-brokers',
          provider: row.entidad,
          url: row.providerUrl!,
        }),
    },
    [avatar, content],
  )
}

function renderComisionCell(row: ComisionRow) {
  const badges = []
  if (row.tasaEsTope) {
    badges.push(h(UBadge, { color: 'warning', variant: 'subtle', size: 'sm' }, () => 'Tope'))
  }
  if (row.ivaAdicional) {
    badges.push(h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () => '+ IVA'))
  }

  return h('div', { class: 'space-y-1' }, [
    h('p', { class: 'font-semibold tabular-nums' }, row.tasaPublicada),
    badges.length ? h('div', { class: 'flex flex-wrap gap-1' }, badges) : null,
  ])
}

const columns = computed<TableColumn<ComisionRow>[]>(() => {
  const cols: TableColumn<ComisionRow>[] = [
    {
      accessorKey: 'displayName',
      header: sortableHeader('Broker'),
      cell: ({ row }) => renderBrokerCell(row.original),
    },
    {
      accessorKey: 'planLabel',
      header: 'Plan',
      cell: ({ row }) => row.original.planLabel ?? '—',
    },
    {
      accessorKey: 'operacionLabel',
      header: sortableHeader('Operación'),
    },
    {
      accessorKey: 'tasaSort',
      header: sortableHeader('Comisión'),
      cell: ({ row }) => renderComisionCell(row.original),
    },
  ]

  if (showEquivAnual.value) {
    cols.push({
      accessorKey: 'tasaAnualLabel',
      header: 'Equiv. anual',
      cell: ({ row }) => h('p', { class: 'tabular-nums text-sm' }, row.original.tasaAnualLabel),
    })
  }

  cols.push({
    accessorKey: 'membresiaLabel',
    header: 'Membresía',
    cell: ({ row }) => {
      const label = row.original.membresiaLabel
      if (!label) return h('span', { class: 'text-muted' }, '—')
      return h('div', { class: 'space-y-0.5' }, [
        h('p', { class: 'tabular-nums text-sm font-medium' }, label),
        h('p', { class: 'text-xs text-muted' }, 'si operás ese mes'),
      ])
    },
  })

  cols.push(
    {
      accessorKey: 'ivaLabel',
      header: 'IVA',
      cell: ({ row }) => {
        if (row.original.ivaAdicional) {
          return h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () => '+ IVA')
        }
        return h('span', { class: 'text-sm text-muted' }, row.original.ivaLabel)
      },
    },
    {
      accessorKey: 'derechoMercado',
      header: 'Derecho mercado',
      cell: ({ row }) => h('span', { class: 'tabular-nums text-sm' }, row.original.derechoLabel),
    },
    {
      accessorKey: 'comisionMinima',
      header: 'Mínimo',
      cell: ({ row }) => h('span', { class: 'tabular-nums text-sm' }, row.original.minimoLabel),
    },
    {
      accessorKey: 'enlace',
      header: 'Tarifario',
      cell: ({ row }) => {
        if (!row.original.enlace) return '—'
        return h(
          'a',
          {
            href: row.original.enlace,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'text-primary-600 hover:underline dark:text-primary-400',
          },
          'Ver',
        )
      },
    },
  )

  return cols
})

function clearFilters() {
  monedaFilter.value = 'ARS'
  operacionFilter.value = 'all'
}

const hasActiveFilters = computed(
  () => monedaFilter.value !== 'ARS' || operacionFilter.value !== 'all',
)
</script>

<template>
  <UContainer class="w-full mx-auto space-y-6 max-w-7xl px-0">
    <UAlert
      v-if="error"
      color="error"
      title="No se pudieron cargar las comisiones"
      description="Reintentá en unos minutos. Si el problema sigue, avisanos."
      :actions="[{ label: 'Reintentar', onClick: () => fetchComisiones() }]"
    />

    <div v-if="loading && rows.length === 0" class="py-12 text-center text-neutral-500">
      Cargando comisiones…
    </div>

    <template v-else>
      <div class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div class="min-w-0 space-y-0.5">
            <h2 class="text-lg font-medium scroll-mt-16 text-neutral-900 dark:text-white">
              Comisiones — {{ productoLabel }}
            </h2>
            <p class="text-xs text-muted">
              Ordenado por menor comisión
              <template v-if="showEquivAnual"> (equiv. anual cuando aplica)</template>.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <UButton
              v-if="hasActiveFilters"
              color="neutral"
              variant="ghost"
              size="sm"
              label="Limpiar filtros"
              @click="clearFilters"
            />
            <div class="text-xs text-muted text-right">
              <p v-if="formattedUpdatedAt">Act. {{ formattedUpdatedAt }}</p>
              <p>
                Fuente:
                <a
                  href="https://argentinadatos.com/?utm_source=comparatasas&utm_medium=comisiones-brokers&ref=comparatasas"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium text-primary-800 dark:text-primary-200"
                >
                  ArgentinaDatos
                </a>
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="space-y-2">
            <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Producto</p>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="option in productoOptions"
                :key="`producto-${option.value}`"
                size="sm"
                :to="productoTo(option.value)"
                :color="producto === option.value ? 'primary' : 'neutral'"
                :variant="producto === option.value ? 'soft' : 'outline'"
              >
                {{ option.label }}
              </UButton>
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <div class="space-y-2">
              <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Moneda</p>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="option in monedaOptions"
                  :key="`moneda-${option.value}`"
                  size="sm"
                  :color="monedaFilter === option.value ? 'primary' : 'neutral'"
                  :variant="monedaFilter === option.value ? 'soft' : 'outline'"
                  @click="monedaFilter = option.value"
                >
                  {{ option.label }}
                </UButton>
              </div>
            </div>

            <div v-if="showOperacionFilter" class="space-y-2">
              <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Operación
              </p>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="option in [{ value: 'all', label: 'Todas' }, ...operacionOptions]"
                  :key="`operacion-${option.value}`"
                  size="sm"
                  :color="effectiveOperacionFilter === option.value ? 'primary' : 'neutral'"
                  :variant="effectiveOperacionFilter === option.value ? 'soft' : 'outline'"
                  @click="operacionFilter = option.value"
                >
                  {{ option.label }}
                </UButton>
              </div>
            </div>
          </div>

          <p class="text-xs text-muted">{{ sortedRows.length }} resultados</p>
        </div>

        <UAlert
          v-if="sortedRows.length === 0"
          color="warning"
          variant="soft"
          title="Sin resultados"
          description="Probá otro producto, moneda u operación."
        />

        <div v-if="isDesktop" class="border border-default rounded-lg overflow-x-auto">
          <UTable v-model:sorting="sorting" :data="rows" :columns="columns" class="min-w-full" />
        </div>

        <div v-else class="flex flex-col gap-3">
          <div
            v-for="row in sortedRows"
            :key="`${row.entidad}-${row.producto}-${row.operacion}-${row.plan}-${row.moneda}-${row.tasaPublicada}`"
            class="rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <img
                  v-if="row.logo"
                  :src="row.logo"
                  :alt="`${row.displayName} logo`"
                  class="size-10 rounded-full object-contain"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold dark:bg-neutral-800"
                >
                  {{ row.initials }}
                </div>
                <div>
                  <a
                    v-if="row.providerUrl"
                    :href="row.providerUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-medium text-primary-600 dark:text-primary-400"
                    @click="
                      trackProviderClick({
                        section: 'comisiones-brokers',
                        provider: row.entidad,
                        url: row.providerUrl!,
                      })
                    "
                  >
                    {{ row.displayName }}
                  </a>
                  <p v-else class="font-medium">
                    {{ row.displayName }}
                  </p>
                  <p class="text-sm text-neutral-500">
                    {{ row.operacionLabel }}
                    <template v-if="row.planLabel"> · {{ row.planLabel }}</template>
                    · {{ row.moneda }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-semibold tabular-nums">
                  {{ row.tasaPublicada }}
                </p>
                <div class="mt-1 flex flex-wrap justify-end gap-1">
                  <UBadge v-if="row.tasaEsTope" color="warning" variant="subtle" size="sm">
                    Tope
                  </UBadge>
                  <UBadge v-if="row.ivaAdicional" color="neutral" variant="subtle" size="sm">
                    + IVA
                  </UBadge>
                </div>
                <p
                  v-if="row.tasaAnualLabel !== '—'"
                  class="mt-1 text-xs tabular-nums text-neutral-500"
                >
                  {{ row.tasaAnualLabel }}
                </p>
                <p v-if="row.membresiaLabel" class="mt-1 text-xs tabular-nums text-neutral-500">
                  Membresía {{ row.membresiaLabel }} (si operás)
                </p>
              </div>
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt class="text-neutral-500">Derecho mercado</dt>
                <dd class="tabular-nums">{{ row.derechoLabel }}</dd>
              </div>
              <div>
                <dt class="text-neutral-500">Mínimo</dt>
                <dd class="tabular-nums">{{ row.minimoLabel }}</dd>
              </div>
            </dl>
            <a
              v-if="row.enlace"
              :href="row.enlace"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-3 inline-flex text-sm text-primary-600 hover:underline dark:text-primary-400"
            >
              Ver tarifario
            </a>
          </div>
        </div>
      </div>
    </template>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto text-sm leading-relaxed">
        <div class="space-y-4">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            ¿Qué son las comisiones de brokers?
          </h3>
          <p>
            Las <strong>comisiones de brokers</strong> (ALyC) son los aranceles que cobra cada
            entidad por operar en el mercado de capitales: acciones, CEDEARs, bonos, cauciones,
            letras, opciones y otros productos. Varían por plan, moneda y tipo de operación.
          </p>
          <p>
            Los valores provienen de tarifarios retail publicados vía
            <strong>ArgentinaDatos</strong>. Algunos brokers publican varios planes: mostramos
            todas las filas. Si el broker cobra membresía de plan (comisión baja o 0% con abono
            mensual condicional), la mostramos en cada fila junto a la comisión por operación. El
            IVA, los mínimos y el derecho de mercado pueden modificar el costo final; verificá
            siempre el tarifario oficial antes de operar.
          </p>
        </div>
      </div>
    </section>
  </UContainer>
</template>

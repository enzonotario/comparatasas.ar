<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useMediaQuery } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { formatCurrency } from '~/lib/fci-fund-formatters'
import { getInstitutionLogo, getInstitutionUrl } from '~/lib/mappings/institutions'
import { withOutboundUtm } from '~/lib/outbound-url'
import { ogUpdatedAtDate } from '~/utils/og-data'
import type { ComisionCobroOption } from '~/composables/useComisionesCobro'
import type { ComisionCobroSimulada } from '~/composables/useComisionesCobroSimulator'

definePageMeta({
  pageTitle: 'Comisiones de cobro',
  pageDescription:
    'Compará aranceles (MDR) de adquirentes y billeteras por canal, medio de pago y acreditación.',
})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const canalLabels: Record<string, string> = {
  pos: 'POS',
  qr: 'QR',
  link: 'Link',
  checkout: 'Checkout',
  online: 'Online',
  otro: 'Otro',
}

const medioPagoLabels: Record<string, string> = {
  debito: 'Débito',
  credito: 'Crédito',
  credito_cuotas: 'Crédito cuotas',
  qr_cuenta: 'Dinero en cuenta',
  prepaga: 'Prepaga',
  amex: 'Amex',
  otro: 'Otro',
}

const acreditacionLabels: Record<string, string> = {
  inmediata: 'Inmediata',
  anticipada: 'Anticipada',
  estandar: 'Estándar',
  desconocida: 'Desconocida',
}

const { trackProviderClick } = useAnalytics()
const {
  comisiones,
  fechaActualizacion,
  loading,
  error,
  fetch: fetchComisiones,
} = useComisionesCobro()
const { isSimulating, calculateResults } = useComisionesCobroSimulator()

await fetchComisiones().catch(() => undefined)

interface ComisionRow extends ComisionCobroOption {
  displayName: string
  initials: string
  logo?: string
  providerUrl?: string
  arancelSort: number
  arancelLabel: string
  canalLabel: string
  medioPagoLabel: string
  acreditacionTipoNormalizado: string
  acreditacionTipoLabel: string
  acreditacionDias: number | null
  acreditacionDisplayLabel: string
  acreditacionSort: number
}

type ComisionRowSimulada = ComisionCobroSimulada<ComisionRow> & {
  costoSort: number
  netoSort: number
}

const isDesktop = useMediaQuery('(min-width: 1024px)')
const searchQuery = useRouteQuery('q', '')
const canalFilter = useRouteQuery('canal', 'all')
const medioFilter = useRouteQuery('medio', 'all')
const acreditacionFilter = useRouteQuery('acreditacion', 'all')
const sortQuery = useRouteQuery('sort', '[{"id":"arancelSort","desc":false}]')

const sorting = computed({
  get: () => {
    try {
      return JSON.parse(sortQuery.value || '[]')
    } catch {
      return [{ id: 'arancelSort', desc: false }]
    }
  },
  set: (value) => {
    sortQuery.value = JSON.stringify(value)
  },
})

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase()
}

function normalizeText(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function formatArancel(row: ComisionCobroOption): string {
  if (row.arancelPorcentaje == null) return 'Consultar'
  const value = row.arancelPorcentaje.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${row.arancelEsTope ? 'Hasta ' : ''}${value}%`
}

function parseDiasDesdeLabel(label: string | null | undefined): number | null {
  if (!label) return null
  if (/instant|inmediata|al instante|en el acto/i.test(label)) return 0
  const match = label.match(/(\d+)\s*d[ií]as?/i)
  if (!match) return null
  return Number.parseInt(match[1], 10)
}

function normalizeAcreditacion(item: ComisionCobroOption): {
  tipo: string
  dias: number | null
  displayLabel: string
} {
  let dias =
    typeof item.acreditacionPlazoHabiles === 'number'
      ? item.acreditacionPlazoHabiles
      : parseDiasDesdeLabel(item.acreditacionLabel)

  let tipo = item.acreditacionTipo

  if (dias === 0 || tipo === 'inmediata') {
    return {
      tipo: 'inmediata',
      dias: 0,
      displayLabel: item.acreditacionLabel || 'Inmediata',
    }
  }

  if (tipo === 'desconocida' && dias != null) {
    tipo = dias <= 1 ? 'anticipada' : 'estandar'
  }

  if (dias == null && tipo === 'anticipada') {
    dias = 1
  }

  const displayLabel =
    dias != null
      ? `${dias} día${dias === 1 ? '' : 's'} hábil${dias === 1 ? '' : 'es'}`
      : item.acreditacionLabel || acreditacionLabels[tipo] || tipo

  return { tipo, dias, displayLabel }
}

const rows = computed<ComisionRow[]>(() => {
  return comisiones.value.map((item) => {
    const displayName = item.nombreComercial || item.entidad
    const logo = getInstitutionLogo(item.entidad) || getInstitutionLogo(displayName) || undefined
    const providerUrl = withOutboundUtm(
      getInstitutionUrl(item.entidad, 'comisiones-cobro') ||
        getInstitutionUrl(displayName, 'comisiones-cobro') ||
        item.enlace ||
        '#',
      'comisiones-cobro',
    )
    const acreditacion = normalizeAcreditacion(item)

    return {
      ...item,
      displayName,
      initials: getInitials(displayName),
      logo,
      providerUrl: providerUrl !== '#' ? providerUrl : undefined,
      enlace: item.enlace
        ? withOutboundUtm(item.enlace, 'comisiones-cobro')
        : item.enlace,
      arancelSort:
        typeof item.arancelPorcentaje === 'number'
          ? item.arancelPorcentaje
          : Number.POSITIVE_INFINITY,
      arancelLabel: formatArancel(item),
      canalLabel: canalLabels[item.canal] ?? item.canal,
      medioPagoLabel: medioPagoLabels[item.medioPago] ?? item.medioPago,
      acreditacionTipoNormalizado: acreditacion.tipo,
      acreditacionTipoLabel: acreditacionLabels[acreditacion.tipo] ?? acreditacion.tipo,
      acreditacionDias: acreditacion.dias,
      acreditacionDisplayLabel: acreditacion.displayLabel,
      acreditacionSort: acreditacion.dias == null ? Number.POSITIVE_INFINITY : acreditacion.dias,
    }
  })
})

const maxAcreditacionDias = computed(() => {
  const dias = rows.value
    .map((row) => row.acreditacionDias)
    .filter((value): value is number => typeof value === 'number' && value > 0)
  return Math.max(1, ...dias, 1)
})

const canalOptions = computed(() => {
  const values = [...new Set(rows.value.map((r) => r.canal).filter(Boolean))]
  return values.map((value) => ({
    label: canalLabels[value] ?? value,
    value,
  }))
})

const medioOptions = computed(() => {
  const values = [...new Set(rows.value.map((r) => r.medioPago).filter(Boolean))]
  return values.map((value) => ({
    label: medioPagoLabels[value] ?? value,
    value,
  }))
})

const acreditacionOptions = computed(() => {
  const values = [...new Set(rows.value.map((r) => r.acreditacionTipoNormalizado).filter(Boolean))]
  return values.map((value) => ({
    label: acreditacionLabels[value] ?? value,
    value,
  }))
})

const simulatedBase = calculateResults(rows)

const simulatedRows = computed<ComisionRowSimulada[]>(() => {
  return simulatedBase.value.map((row) => ({
    ...row,
    costoSort: row.simulation?.costo ?? Number.POSITIVE_INFINITY,
    netoSort: row.simulation?.neto ?? Number.NEGATIVE_INFINITY,
  }))
})

const filteredRows = computed(() => {
  const q = normalizeText(searchQuery.value)

  return simulatedRows.value.filter((row) => {
    if (canalFilter.value !== 'all' && row.canal !== canalFilter.value) return false
    if (medioFilter.value !== 'all' && row.medioPago !== medioFilter.value) return false
    if (
      acreditacionFilter.value !== 'all' &&
      row.acreditacionTipoNormalizado !== acreditacionFilter.value
    ) {
      return false
    }
    if (!q) return true

    return normalizeText(
      [
        row.displayName,
        row.producto,
        row.canalLabel,
        row.medioPagoLabel,
        row.acreditacionTipoLabel,
        row.acreditacionDisplayLabel,
        row.condiciones ?? '',
      ].join(' '),
    ).includes(q)
  })
})

watch(isSimulating, (simulating) => {
  if (simulating) {
    sortQuery.value = '[{"id":"costoSort","desc":false}]'
  } else {
    sortQuery.value = '[{"id":"arancelSort","desc":false}]'
  }
})

const sortedRows = computed(() => {
  const sort = sorting.value?.[0]
  if (!sort) return filteredRows.value

  const dir = sort.desc ? -1 : 1
  const id = sort.id as keyof ComisionRowSimulada

  return [...filteredRows.value].sort((a, b) => {
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

const ogItems = computed(() => {
  return [...sortedRows.value]
    .filter((row) => row.arancelPorcentaje != null)
    .slice(0, 3)
    .map((item) => ({
      name: `${item.displayName} · ${item.producto}`,
      rate: item.arancelLabel,
    }))
})

defineOgImage('ComparaTasas.takumi', {
  title: 'Comisiones de cobro',
  items: ogItems.value ?? [],
  updatedAt: formattedUpdatedAt.value,
})

useSeoMeta({
  title: 'Comisiones de cobro',
  description:
    'Compará aranceles de cobro (POS, QR, link y checkout) de adquirentes y billeteras en Argentina.',
  ogTitle: 'Comisiones de cobro - Compara Tasas',
  ogDescription: 'Ranking de comisiones de cobro por canal, medio de pago y plazo de acreditación.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/comisiones-cobro' },
    {
      rel: 'alternate',
      hreflang: 'es-AR',
      href: 'https://comparatasas.ar/comisiones-cobro',
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: 'https://comparatasas.ar/comisiones-cobro',
    },
  ],
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

function renderProviderCell(row: ComisionRowSimulada) {
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
    h('p', { class: 'text-xs text-neutral-500' }, row.producto),
  ])

  const inner = row.providerUrl
    ? h(
        'a',
        {
          href: row.providerUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'group flex items-center gap-3',
          onClick: () =>
            trackProviderClick({
              section: 'comisiones-cobro',
              provider: row.entidad,
              url: row.providerUrl!,
            }),
        },
        [avatar, content],
      )
    : h('div', { class: 'flex items-center gap-3' }, [avatar, content])

  return h(
    'div',
    { class: isSimulating.value && row.simulationDisabled ? 'opacity-40' : undefined },
    [inner],
  )
}

function renderArancelCell(row: ComisionRowSimulada) {
  const badges = []
  if (row.arancelEsTope) {
    badges.push(h(UBadge, { color: 'warning', variant: 'subtle', size: 'sm' }, () => 'Hasta'))
  }
  if (row.ivaAdicional) {
    badges.push(h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () => '+ IVA'))
  }

  return h('div', { class: 'space-y-1' }, [
    h('p', { class: 'font-semibold tabular-nums' }, row.arancelLabel),
    badges.length ? h('div', { class: 'flex flex-wrap gap-1' }, badges) : null,
  ])
}

function renderCostoCell(row: ComisionRowSimulada) {
  if (!row.simulation) {
    return h('span', { class: 'text-muted' }, '—')
  }

  const parts = [
    h(
      'p',
      { class: 'font-semibold tabular-nums text-error' },
      formatCurrency(row.simulation.costo),
    ),
  ]

  if (row.simulation.iva > 0) {
    parts.push(
      h(
        'p',
        { class: 'text-xs text-muted tabular-nums' },
        `Arancel ${formatCurrency(row.simulation.arancelBase)} · IVA ${formatCurrency(row.simulation.iva)}`,
      ),
    )
  }

  if (row.arancelEsTope) {
    parts.push(h(UBadge, { color: 'warning', variant: 'subtle', size: 'sm' }, () => 'Hasta'))
  }

  return h('div', { class: 'space-y-1' }, parts)
}

function renderNetoCell(row: ComisionRowSimulada) {
  if (!row.simulation) {
    return h('span', { class: 'text-muted' }, '—')
  }

  return h(
    'p',
    { class: 'font-semibold tabular-nums text-success' },
    formatCurrency(row.simulation.neto),
  )
}

function rowClass(row: ComisionRowSimulada): string | undefined {
  if (isSimulating.value && row.simulationDisabled) return 'opacity-40'
  return undefined
}

function acreditacionBarWidth(dias: number | null): string {
  if (dias == null || dias <= 0) return '0%'
  const pct = Math.min(100, Math.max(8, (dias / maxAcreditacionDias.value) * 100))
  return `${pct}%`
}

function renderAcreditacionCell(row: ComisionRow) {
  if (row.acreditacionTipoNormalizado === 'inmediata' || row.acreditacionDias === 0) {
    return h(UBadge, { color: 'success', variant: 'subtle', size: 'sm' }, () => 'Inmediata')
  }

  const barColor =
    row.acreditacionTipoNormalizado === 'anticipada'
      ? 'bg-amber-500 dark:bg-amber-400'
      : 'bg-sky-500 dark:bg-sky-400'

  return h('div', { class: 'min-w-[9rem] max-w-[12rem] space-y-1.5' }, [
    h(
      'p',
      { class: 'text-sm font-medium tabular-nums text-neutral-900 dark:text-white' },
      row.acreditacionDisplayLabel,
    ),
    row.acreditacionDias != null
      ? h(
          'div',
          {
            class: 'h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800',
            title: row.acreditacionDisplayLabel,
          },
          [
            h('div', {
              class: `h-full rounded-full ${barColor}`,
              style: { width: acreditacionBarWidth(row.acreditacionDias) },
            }),
          ],
        )
      : null,
  ])
}

const columns = computed<TableColumn<ComisionRowSimulada>[]>(() => {
  const base: TableColumn<ComisionRowSimulada>[] = [
    {
      accessorKey: 'displayName',
      header: sortableHeader('Entidad'),
      cell: ({ row }) => renderProviderCell(row.original),
    },
    {
      accessorKey: 'canalLabel',
      header: sortableHeader('Canal'),
    },
    {
      accessorKey: 'medioPagoLabel',
      header: sortableHeader('Medio'),
    },
    {
      accessorKey: 'arancelSort',
      header: sortableHeader('Arancel'),
      cell: ({ row }) => renderArancelCell(row.original),
    },
  ]

  if (isSimulating.value) {
    base.push(
      {
        accessorKey: 'costoSort',
        header: sortableHeader('Costo'),
        cell: ({ row }) => renderCostoCell(row.original),
      },
      {
        accessorKey: 'netoSort',
        header: sortableHeader('Neto'),
        cell: ({ row }) => renderNetoCell(row.original),
      },
    )
  }

  base.push(
    {
      accessorKey: 'acreditacionSort',
      header: sortableHeader('Acreditación'),
      cell: ({ row }) => renderAcreditacionCell(row.original),
    },
    {
      accessorKey: 'enlace',
      header: 'Fuente',
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

  return base
})

function clearFilters() {
  searchQuery.value = ''
  canalFilter.value = 'all'
  medioFilter.value = 'all'
  acreditacionFilter.value = 'all'
}

const hasActiveFilters = computed(
  () =>
    Boolean(searchQuery.value) ||
    canalFilter.value !== 'all' ||
    medioFilter.value !== 'all' ||
    acreditacionFilter.value !== 'all',
)
</script>

<template>
  <UContainer class="w-full mx-auto space-y-6 max-w-7xl px-0">
    <ComisionesCobroSimulator />

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
      <UCard>
        <template #header>
          <div class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold">Tabla comparativa</h2>
                <p v-if="isSimulating" class="text-sm text-muted">
                  Costo y neto estimados sobre el monto simulado. Ordenado por menor costo.
                </p>
              </div>
              <UButton
                v-if="hasActiveFilters"
                color="neutral"
                variant="ghost"
                size="sm"
                label="Limpiar filtros"
                @click="clearFilters"
              />
            </div>

            <div class="grid gap-4 xl:grid-cols-[minmax(0,280px)_1fr]">
              <UFormField label="Buscar">
                <UInput
                  v-model="searchQuery"
                  icon="i-lucide-search"
                  placeholder="Entidad, débito, QR..."
                />
              </UFormField>

              <div class="grid gap-3 md:grid-cols-3">
                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Canal</p>
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      v-for="option in [{ value: 'all', label: 'Todos' }, ...canalOptions]"
                      :key="`canal-${option.value}`"
                      size="sm"
                      :color="canalFilter === option.value ? 'primary' : 'neutral'"
                      :variant="canalFilter === option.value ? 'soft' : 'outline'"
                      @click="canalFilter = option.value"
                    >
                      {{ option.label }}
                    </UButton>
                  </div>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Medio de pago
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      v-for="option in [{ value: 'all', label: 'Todos' }, ...medioOptions]"
                      :key="`medio-${option.value}`"
                      size="sm"
                      :color="medioFilter === option.value ? 'primary' : 'neutral'"
                      :variant="medioFilter === option.value ? 'soft' : 'outline'"
                      @click="medioFilter = option.value"
                    >
                      {{ option.label }}
                    </UButton>
                  </div>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Acreditación
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      v-for="option in [{ value: 'all', label: 'Todas' }, ...acreditacionOptions]"
                      :key="`acred-${option.value}`"
                      size="sm"
                      :color="acreditacionFilter === option.value ? 'primary' : 'neutral'"
                      :variant="acreditacionFilter === option.value ? 'soft' : 'outline'"
                      @click="acreditacionFilter = option.value"
                    >
                      {{ option.label }}
                    </UButton>
                  </div>
                </div>
              </div>
            </div>

            <p class="text-xs text-neutral-500">
              {{ sortedRows.length }} resultados
              <span v-if="formattedUpdatedAt"> · Actualizado {{ formattedUpdatedAt }}</span>
            </p>
          </div>
        </template>

        <UAlert
          v-if="filteredRows.length === 0"
          color="warning"
          variant="soft"
          title="Sin resultados"
          description="Probá aflojar algún filtro o limpiar la búsqueda."
          class="mb-4"
        />

        <div v-if="isDesktop" class="overflow-hidden">
          <UTable
            v-model:sorting="sorting"
            :data="filteredRows"
            :columns="columns"
            class="min-w-full"
          />
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="row in sortedRows"
            :key="`${row.entidad}-${row.producto}-${row.canal}-${row.medioPago}-${row.acreditacionTipo}-${row.arancelLabel}`"
            class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
            :class="rowClass(row)"
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
                  <p class="font-medium">
                    {{ row.displayName }}
                  </p>
                  <p class="text-sm text-neutral-500">
                    {{ row.producto }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <template v-if="isSimulating && row.simulation">
                  <p class="font-semibold tabular-nums text-error">
                    {{ formatCurrency(row.simulation.costo) }}
                  </p>
                  <p class="text-xs tabular-nums text-success">
                    Neto {{ formatCurrency(row.simulation.neto) }}
                  </p>
                </template>
                <template v-else>
                  <p class="font-semibold tabular-nums">
                    {{ row.arancelLabel }}
                  </p>
                  <div class="mt-1 flex flex-wrap justify-end gap-1">
                    <UBadge v-if="row.arancelEsTope" color="warning" variant="subtle" size="sm">
                      Hasta
                    </UBadge>
                    <UBadge v-if="row.ivaAdicional" color="neutral" variant="subtle" size="sm">
                      + IVA
                    </UBadge>
                  </div>
                </template>
              </div>
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt class="text-neutral-500">Canal</dt>
                <dd>{{ row.canalLabel }}</dd>
              </div>
              <div>
                <dt class="text-neutral-500">Medio</dt>
                <dd>{{ row.medioPagoLabel }}</dd>
              </div>
              <template v-if="isSimulating">
                <div>
                  <dt class="text-neutral-500">Arancel</dt>
                  <dd class="tabular-nums">
                    {{ row.arancelLabel }}
                  </dd>
                </div>
                <div v-if="row.simulation">
                  <dt class="text-neutral-500">Detalle costo</dt>
                  <dd class="tabular-nums text-xs text-neutral-500">
                    <template v-if="row.simulation.iva > 0">
                      {{ formatCurrency(row.simulation.arancelBase) }} + IVA
                      {{ formatCurrency(row.simulation.iva) }}
                    </template>
                    <template v-else>
                      {{ formatCurrency(row.simulation.costo) }}
                    </template>
                  </dd>
                </div>
              </template>
              <div class="col-span-2">
                <dt class="text-neutral-500">Acreditación</dt>
                <dd class="mt-1">
                  <UBadge
                    v-if="
                      row.acreditacionTipoNormalizado === 'inmediata' || row.acreditacionDias === 0
                    "
                    color="success"
                    variant="subtle"
                    size="sm"
                  >
                    Inmediata
                  </UBadge>
                  <div v-else class="space-y-1.5">
                    <p class="font-medium tabular-nums">
                      {{ row.acreditacionDisplayLabel }}
                    </p>
                    <div
                      v-if="row.acreditacionDias != null"
                      class="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                    >
                      <div
                        class="h-full rounded-full"
                        :class="
                          row.acreditacionTipoNormalizado === 'anticipada'
                            ? 'bg-amber-500 dark:bg-amber-400'
                            : 'bg-sky-500 dark:bg-sky-400'
                        "
                        :style="{ width: acreditacionBarWidth(row.acreditacionDias) }"
                      />
                    </div>
                  </div>
                </dd>
              </div>
            </dl>
            <a
              v-if="row.enlace"
              :href="row.enlace"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-3 inline-flex text-sm text-primary-600 hover:underline dark:text-primary-400"
            >
              Ver fuente
            </a>
          </article>
        </div>
      </UCard>
    </template>
  </UContainer>
</template>

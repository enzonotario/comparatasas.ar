<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useMediaQuery } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { getInstitutionLogo, getInstitutionUrl } from '~/lib/mappings/institutions'
import { withOutboundUtm } from '~/lib/outbound-url'
import { ogUpdatedAtDate } from '~/utils/og-data'
import {
  aclaracionesDeTramos,
  agruparOfertasFal,
  alternativaFalId,
  canalLabels,
  filterAlternativasFal,
  formatVidaFal,
  horizonteLabels,
  labelConocido,
  resumenTasasFal,
  sortAlternativasFal,
  vehiculoLabels,
} from '~/lib/finance/fal'

definePageMeta({
  pageTitle: 'Fondo de Asistencia Laboral',
  pageDescription:
    'Compará comisión, vehículo y horizonte de las alternativas FAL publicadas por cada entidad.',
})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const { trackProviderClick } = useAnalytics()
const {
  alternativas,
  fechaActualizacion,
  loading,
  error,
  fetch: fetchFal,
} = useFal()

await fetchFal().catch(() => undefined)

interface FalRow extends AlternativaFal {
  rowId: string
  displayName: string
  initials: string
  logo?: string
  providerUrl?: string
  comisionLabel: string
  comisionSort: number
  horizonteLabel: string
  vehiculoLabel: string
  canalLabel: string
  vidaLabel: string
  planLabel: string | null
  aclaracionComun: string | null
  tramos: { titulo: string; detalle: string | null }[]
}

const isDesktop = useMediaQuery('(min-width: 1024px)')
const searchQuery = useRouteQuery('q', '')
const horizonteFilter = useRouteQuery('horizonte', 'all')
const vehiculoFilter = useRouteQuery('vehiculo', 'all')
const comisionFilter = useRouteQuery('comision', 'all')
const sortQuery = useRouteQuery('sort', '[{"id":"comisionSort","desc":false}]')

const sorting = computed({
  get: () => {
    try {
      const parsed = JSON.parse(sortQuery.value || '[]')
      return Array.isArray(parsed) && parsed.length
        ? parsed
        : [{ id: 'comisionSort', desc: false }]
    } catch {
      return [{ id: 'comisionSort', desc: false }]
    }
  },
  set: (value) => {
    sortQuery.value = JSON.stringify(value)
  },
})

const { rowSelection, onSelect, withSelection } = useComparableTableRows()

function rowClass(id: string) {
  return rowSelection.value[id]
    ? 'bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/55 dark:hover:bg-primary-800/70'
    : 'hover:bg-elevated'
}

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase()
}

function claveComision(item: AlternativaFal): number {
  if (item.comisionAnual == null) return Number.POSITIVE_INFINITY
  return item.comisionAnual + (item.comisionPosteriorAnual ?? 0) / 100
}

function filaVisible(grupo: ReturnType<typeof agruparOfertasFal<AlternativaFal>>[number]): FalRow {
  const displayName = grupo.nombreComercial
  const providerUrl =
    getInstitutionUrl(displayName, 'fal') ||
    getInstitutionUrl(grupo.entidad, 'fal') ||
    (grupo.enlace ? withOutboundUtm(grupo.enlace, 'fal') : undefined)
  const varios = grupo.ofertas.length > 1
  const aclaraciones = varios ? aclaracionesDeTramos(grupo.ofertas) : null

  return {
    ...grupo,
    enlace: grupo.enlace ? withOutboundUtm(grupo.enlace, 'fal') : grupo.enlace,
    rowId: varios ? `grupo:${grupo.entidad}:${grupo.horizonte ?? 'general'}` : alternativaFalId(grupo),
    displayName,
    initials: getInitials(displayName),
    logo: getInstitutionLogo(displayName) || getInstitutionLogo(grupo.entidad),
    providerUrl,
    comisionLabel: resumenTasasFal(grupo.ofertas),
    comisionSort: Math.min(...grupo.ofertas.map(claveComision)),
    horizonteLabel: labelConocido(horizonteLabels, grupo.horizonte),
    vehiculoLabel: labelConocido(vehiculoLabels, grupo.vehiculo),
    canalLabel: labelConocido(canalLabels, grupo.canal),
    vidaLabel: formatVidaFal(grupo) ?? '—',
    planLabel: varios ? null : grupo.nombrePlan || 'Alternativa única',
    aclaracionComun: aclaraciones?.comun ?? null,
    tramos: aclaraciones?.tramos ?? [],
  }
}

const filteredRows = computed(() => {
  const filtradas = filterAlternativasFal(alternativas.value, {
    q: searchQuery.value || '',
    horizonte: horizonteFilter.value || 'all',
    vehiculo: vehiculoFilter.value || 'all',
    comision: comisionFilter.value || 'all',
  })

  return agruparOfertasFal(filtradas).map(filaVisible)
})

const horizonteOptions = [
  { value: 'corto_plazo', label: 'Corto plazo' },
  { value: 'inflacion', label: 'Inflación / CER' },
  { value: 'rendimiento', label: 'Rendimiento' },
  { value: 'mediano_plazo', label: 'Mediano plazo' },
]

const vehiculoOptions = [
  { value: 'fci_abierto', label: 'FCI abierto' },
  { value: 'fideicomiso', label: 'Fideicomiso' },
]

const comisionOptions = [
  { value: 'publicada', label: 'Con comisión' },
  { value: 'sin_dato', label: 'Sin dato' },
]

const sortedRows = computed(() => {
  const sort = sorting.value?.[0]
  return sortAlternativasFal(filteredRows.value, sort ?? null)
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

const ogItems = computed(() =>
  sortedRows.value.slice(0, 3).map((item) => ({
    name: item.nombrePlan ? `${item.displayName} · ${item.nombrePlan}` : item.displayName,
    rate: item.comisionLabel,
  })),
)

defineOgImage('ComparaTasas.takumi', {
  title: 'Fondo de Asistencia Laboral',
  items: ogItems.value ?? [],
  updatedAt: formattedUpdatedAt.value,
})

useSeoMeta({
  title: 'Fondo de Asistencia Laboral',
  description:
    'Compará la comisión, el vehículo y el horizonte de las alternativas FAL que publica cada entidad.',
  ogTitle: 'Fondo de Asistencia Laboral - Compara Tasas',
  ogDescription:
    'Tabla de alternativas FAL. La comisión queda en Sin dato cuando la entidad no la publica.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/fal' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/fal' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/fal' },
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
      class: '-mx-2.5 h-auto min-w-0 items-start whitespace-normal text-left font-semibold',
      ui: { label: 'min-w-0 !whitespace-normal !overflow-visible !text-clip' },
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    })
  }
}

function renderProviderCell(row: FalRow) {
  const avatar = row.logo
    ? h('img', {
        src: row.logo,
        alt: '',
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

  const content = h(
    'div',
    { class: 'min-w-0 break-words' },
    [
      h(
        'p',
        {
          class: row.providerUrl
            ? 'break-words font-medium text-primary-600 group-hover:underline dark:text-primary-400'
            : 'break-words font-medium text-neutral-900 dark:text-white',
        },
        row.displayName,
      ),
      row.planLabel
        ? h('p', { class: 'break-words text-xs text-neutral-500' }, row.planLabel)
        : null,
    ].filter(Boolean),
  )

  if (!row.providerUrl) {
    return h('div', { class: 'flex min-w-0 items-center gap-3' }, [avatar, content])
  }

  return h(
    'a',
    {
      href: row.providerUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      class: 'group flex min-w-0 items-center gap-3',
      onClick: () =>
        trackProviderClick({
          section: 'fal',
          provider: row.entidad,
          url: row.providerUrl!,
        }),
    },
    [avatar, content],
  )
}

function renderComisionCell(row: FalRow) {
  const badges = []
  if (row.comisionEsTope) {
    badges.push(h(UBadge, { color: 'warning', variant: 'subtle', size: 'sm' }, () => 'Hasta'))
  }
  if (row.ivaAdicional) {
    badges.push(h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () => '+ IVA'))
  }
  if (row.incluyeIva) {
    badges.push(h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () => 'IVA incl.'))
  }
  if (row.reintegroAportes) {
    badges.push(h(UBadge, { color: 'success', variant: 'subtle', size: 'sm' }, () => 'Reintegro'))
  }

  const detalle = row.tramos.length
    ? [
        row.aclaracionComun
          ? h('p', { class: 'text-xs leading-snug break-words text-neutral-500' }, row.aclaracionComun)
          : null,
        h(
          'ul',
          { class: 'space-y-2' },
          row.tramos.map((tramo) =>
            h('li', { key: tramo.titulo, class: 'min-w-0 space-y-0.5 break-words' }, [
              h('p', { class: 'font-semibold' }, tramo.titulo),
              tramo.detalle
                ? h('p', { class: 'text-xs leading-snug break-words text-neutral-500' }, tramo.detalle)
                : null,
            ]),
          ),
        ),
      ]
    : [
        row.condiciones
          ? h('p', { class: 'text-xs leading-snug break-words text-neutral-500' }, row.condiciones)
          : null,
      ]

  return h('div', { class: 'min-w-0 space-y-1 break-words' }, [
    h('p', { class: 'font-semibold tabular-nums' }, row.comisionLabel),
    badges.length ? h('div', { class: 'flex flex-wrap gap-1' }, badges) : null,
    ...detalle,
  ])
}

const wrapCell = {
  class: {
    th: '!whitespace-normal align-bottom',
    td: '!whitespace-normal break-words align-top',
  },
}

function columnMeta(width: string) {
  return {
    class: {
      th: `${wrapCell.class.th} ${width}`,
      td: wrapCell.class.td,
    },
  }
}

const columns = computed<TableColumn<FalRow>[]>(() => [
  {
    accessorKey: 'displayName',
    header: sortableHeader('Entidad'),
    cell: ({ row }) => renderProviderCell(row.original),
    meta: columnMeta('w-[16%]'),
  },
  {
    accessorKey: 'vehiculoLabel',
    header: sortableHeader('Vehículo'),
    meta: columnMeta('w-[11%]'),
  },
  {
    accessorKey: 'comisionSort',
    header: sortableHeader('Comisión anual'),
    cell: ({ row }) => renderComisionCell(row.original),
    meta: columnMeta('w-[42%]'),
  },
  {
    accessorKey: 'horizonteLabel',
    header: sortableHeader('Horizonte'),
    cell: ({ row }) =>
      h('div', { class: 'min-w-0 space-y-0.5 break-words' }, [
        h('p', row.original.horizonteLabel),
        row.original.vidaLabel !== '—'
          ? h('p', { class: 'text-xs break-words text-neutral-500' }, row.original.vidaLabel)
          : null,
      ]),
    meta: columnMeta('w-[12%]'),
  },
  {
    accessorKey: 'canalLabel',
    header: sortableHeader('Alta'),
    meta: columnMeta('w-[12%]'),
  },
  {
    accessorKey: 'enlace',
    header: 'Fuente',
    meta: columnMeta('w-[7%]'),
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
])

function clearFilters() {
  searchQuery.value = ''
  horizonteFilter.value = 'all'
  vehiculoFilter.value = 'all'
  comisionFilter.value = 'all'
}

const hasActiveFilters = computed(
  () =>
    Boolean(searchQuery.value) ||
    horizonteFilter.value !== 'all' ||
    vehiculoFilter.value !== 'all' ||
    comisionFilter.value !== 'all',
)
</script>

<template>
  <UContainer class="mx-auto w-full max-w-7xl space-y-6 px-0">
    <UAlert
      v-if="error"
      color="error"
      title="No se pudieron cargar las alternativas FAL"
      description="El recurso todavía no está en la API pública, o la carga falló. Reintentá en unos minutos."
      :actions="[{ label: 'Reintentar', onClick: () => fetchFal() }]"
    />

    <div v-if="loading && filteredRows.length === 0 && !error" class="py-12 text-center text-neutral-500">
      Cargando alternativas…
    </div>

    <template v-else-if="!error">
      <div class="space-y-6">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0 space-y-0.5">
            <h2 class="scroll-mt-16 text-lg font-medium text-neutral-900 dark:text-white">
              Fondo de Asistencia Laboral
            </h2>
            <p class="max-w-3xl text-xs text-muted">
              Cada fila es una entidad. Si el mismo fondo publica varios honorarios, quedan juntos y cada
              uno conserva su aclaración. «Sin dato» significa que esa página no informa la comisión
              propia. El tope legal del 1% anual no se muestra como precio.
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
            <div class="text-right text-xs text-muted">
              <p v-if="formattedUpdatedAt">Act. {{ formattedUpdatedAt }}</p>
              <p>
                Fuente:
                <a
                  href="https://argentinadatos.com/docs/operations/get-finanzas-fal?utm_source=comparatasas&utm_medium=fal&ref=comparatasas"
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

        <FalAporteSimulator />

        <div class="space-y-3">
          <div class="grid gap-4 xl:grid-cols-[minmax(0,280px)_1fr]">
            <UFormField label="Buscar">
              <UInput
                v-model="searchQuery"
                icon="i-lucide-search"
                placeholder="Entidad o fondo"
              />
            </UFormField>

            <div class="grid gap-3 md:grid-cols-3">
              <div class="space-y-2">
                <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Horizonte</p>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="option in [{ value: 'all', label: 'Todos' }, ...horizonteOptions]"
                    :key="`horizonte-${option.value}`"
                    size="sm"
                    :color="horizonteFilter === option.value ? 'primary' : 'neutral'"
                    :variant="horizonteFilter === option.value ? 'soft' : 'outline'"
                    @click="horizonteFilter = option.value"
                  >
                    {{ option.label }}
                  </UButton>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Vehículo</p>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="option in [{ value: 'all', label: 'Todos' }, ...vehiculoOptions]"
                    :key="`vehiculo-${option.value}`"
                    size="sm"
                    :color="vehiculoFilter === option.value ? 'primary' : 'neutral'"
                    :variant="vehiculoFilter === option.value ? 'soft' : 'outline'"
                    @click="vehiculoFilter = option.value"
                  >
                    {{ option.label }}
                  </UButton>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Comisión</p>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="option in [{ value: 'all', label: 'Todas' }, ...comisionOptions]"
                    :key="`comision-${option.value}`"
                    size="sm"
                    :color="comisionFilter === option.value ? 'primary' : 'neutral'"
                    :variant="comisionFilter === option.value ? 'soft' : 'outline'"
                    @click="comisionFilter = option.value"
                  >
                    {{ option.label }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <p class="text-xs text-muted">{{ sortedRows.length }} resultados</p>
        </div>

        <UAlert
          v-if="filteredRows.length === 0"
          color="warning"
          variant="soft"
          title="Sin resultados"
          description="Probá aflojar algún filtro o limpiar la búsqueda."
        />

        <div v-if="isDesktop" class="overflow-x-auto rounded-lg border border-default">
          <UTable
            v-model:sorting="sorting"
            v-model:row-selection="rowSelection"
            :data="filteredRows"
            :columns="withSelection(columns)"
            :get-row-id="(row: FalRow) => row.rowId"
            :on-select="onSelect"
            :ui="{
              base: 'w-full table-fixed',
              th: '!whitespace-normal align-bottom',
              td: '!whitespace-normal break-words align-top',
            }"
          />
        </div>

        <div v-else class="flex flex-col gap-3">
          <button
            v-for="row in sortedRows"
            :key="row.rowId"
            type="button"
            class="rounded-lg border border-neutral-200 px-3 py-3 text-left dark:border-neutral-800"
            :class="rowClass(row.rowId)"
            @click="rowSelection[row.rowId] = !rowSelection[row.rowId]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <img
                  v-if="row.logo"
                  :src="row.logo"
                  alt=""
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
                  <p class="font-medium">{{ row.displayName }}</p>
                  <p v-if="row.planLabel" class="text-sm text-neutral-500">{{ row.planLabel }}</p>
                </div>
              </div>
              <p class="text-right text-sm font-semibold tabular-nums">{{ row.comisionLabel }}</p>
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <div>
                <dt class="text-neutral-500">Vehículo</dt>
                <dd>{{ row.vehiculoLabel }}</dd>
              </div>
              <div>
                <dt class="text-neutral-500">Horizonte</dt>
                <dd>{{ row.horizonteLabel }}</dd>
              </div>
              <div>
                <dt class="text-neutral-500">Alta</dt>
                <dd>{{ row.canalLabel }}</dd>
              </div>
            </dl>
            <p v-if="row.aclaracionComun" class="mt-2 text-xs text-neutral-500">
              {{ row.aclaracionComun }}
            </p>
            <ul v-if="row.tramos.length" class="mt-2 space-y-2">
              <li v-for="tramo in row.tramos" :key="tramo.titulo">
                <p class="text-sm font-semibold">{{ tramo.titulo }}</p>
                <p v-if="tramo.detalle" class="text-xs text-neutral-500">{{ tramo.detalle }}</p>
              </li>
            </ul>
            <p v-else-if="row.condiciones" class="mt-2 text-xs text-neutral-500">
              {{ row.condiciones }}
            </p>
            <a
              v-if="row.enlace"
              :href="row.enlace"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-2 inline-block text-xs text-primary-600 hover:underline dark:text-primary-400"
              @click.stop
            >
              Ver fuente
            </a>
          </button>
        </div>
      </div>
    </template>
  </UContainer>
</template>

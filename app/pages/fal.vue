<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useMediaQuery } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { getInstitutionLogo, getInstitutionUrl } from '~/lib/mappings/institutions'
import { withOutboundUtm } from '~/lib/outbound-url'
import { ogUpdatedAtDate } from '~/utils/og-data'
import {
  alternativaFalId,
  canalLabels,
  filterAlternativasFal,
  formatComisionFal,
  formatFechaFal,
  formatVidaFal,
  horizonteLabels,
  labelConocido,
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
  erroresExtraccion,
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
  vigenciaLabel: string
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

const { rowSelection, onSelect, withSelection, rowClass } = useComparableTableRows()

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase()
}

const rows = computed<FalRow[]>(() =>
  alternativas.value.map((item) => {
    const displayName = item.nombreComercial
    const providerUrl =
      getInstitutionUrl(displayName, 'fal') ||
      getInstitutionUrl(item.entidad, 'fal') ||
      (item.enlace ? withOutboundUtm(item.enlace, 'fal') : undefined)

    return {
      ...item,
      enlace: item.enlace ? withOutboundUtm(item.enlace, 'fal') : item.enlace,
      rowId: alternativaFalId(item),
      displayName,
      initials: getInitials(displayName),
      logo: getInstitutionLogo(displayName) || getInstitutionLogo(item.entidad),
      providerUrl,
      comisionLabel: formatComisionFal(item),
      comisionSort:
        item.comisionAnual == null
          ? Number.POSITIVE_INFINITY
          : item.comisionAnual + (item.comisionPosteriorAnual ?? 0) / 100,
      horizonteLabel: labelConocido(horizonteLabels, item.horizonte),
      vehiculoLabel: labelConocido(vehiculoLabels, item.vehiculo),
      canalLabel: labelConocido(canalLabels, item.canal),
      vidaLabel: formatVidaFal(item) ?? '—',
      vigenciaLabel: formatFechaFal(item.vigenciaDeclarada) ?? '—',
    }
  }),
)

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

const filteredRows = computed(() =>
  filterAlternativasFal(rows.value, {
    q: searchQuery.value || '',
    horizonte: horizonteFilter.value || 'all',
    vehiculo: vehiculoFilter.value || 'all',
    comision: comisionFilter.value || 'all',
  }) as FalRow[],
)

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
      class: '-mx-2.5 font-semibold',
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

  const content = h('div', { class: 'min-w-0' }, [
    h(
      'p',
      {
        class: row.providerUrl
          ? 'font-medium text-primary-600 group-hover:underline dark:text-primary-400'
          : 'font-medium text-neutral-900 dark:text-white',
      },
      row.displayName,
    ),
    h('p', { class: 'text-xs text-neutral-500' }, row.nombrePlan || 'Alternativa única'),
  ])

  if (!row.providerUrl) return h('div', { class: 'flex items-center gap-3' }, [avatar, content])

  return h(
    'a',
    {
      href: row.providerUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      class: 'group flex items-center gap-3',
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

  return h('div', { class: 'min-w-[11rem] max-w-xs space-y-1' }, [
    h('p', { class: 'font-semibold tabular-nums' }, row.comisionLabel),
    badges.length ? h('div', { class: 'flex flex-wrap gap-1' }, badges) : null,
    row.condiciones
      ? h('p', { class: 'text-xs leading-snug text-neutral-500' }, row.condiciones)
      : null,
  ])
}

const columns = computed<TableColumn<FalRow>[]>(() => [
  {
    accessorKey: 'displayName',
    header: sortableHeader('Entidad'),
    cell: ({ row }) => renderProviderCell(row.original),
  },
  {
    accessorKey: 'vehiculoLabel',
    header: sortableHeader('Vehículo'),
  },
  {
    accessorKey: 'comisionSort',
    header: sortableHeader('Comisión anual'),
    cell: ({ row }) => renderComisionCell(row.original),
  },
  {
    accessorKey: 'horizonteLabel',
    header: sortableHeader('Horizonte'),
    cell: ({ row }) =>
      h('div', { class: 'space-y-0.5' }, [
        h('p', row.original.horizonteLabel),
        row.original.vidaLabel !== '—'
          ? h('p', { class: 'text-xs text-neutral-500' }, row.original.vidaLabel)
          : null,
      ]),
  },
  {
    accessorKey: 'canalLabel',
    header: sortableHeader('Alta'),
  },
  {
    accessorKey: 'vigenciaLabel',
    header: sortableHeader('Vigencia que informa'),
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

const fuentesNoLeidas = computed(() => erroresExtraccion.value.map((item) => item.fuente))
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

    <div v-if="loading && rows.length === 0 && !error" class="py-12 text-center text-neutral-500">
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
              Cada fila es un plan publicado por la entidad. «Sin dato» significa que esa página no
              informa la comisión propia. El tope legal del 1% anual no se muestra como precio.
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

        <UAlert
          v-if="fuentesNoLeidas.length"
          color="warning"
          variant="soft"
          title="Algunas páginas no se pudieron leer"
          :description="`Sin fila en esta corrida: ${fuentesNoLeidas.join(', ')}.`"
        />

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
            class="min-w-full"
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
                  <p class="text-sm text-neutral-500">{{ row.nombrePlan || 'Alternativa única' }}</p>
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
              <div>
                <dt class="text-neutral-500">Vigencia</dt>
                <dd>{{ row.vigenciaLabel }}</dd>
              </div>
            </dl>
            <p v-if="row.condiciones" class="mt-2 text-xs text-neutral-500">{{ row.condiciones }}</p>
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

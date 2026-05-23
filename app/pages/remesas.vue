<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useMediaQuery } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import type { ComparaDolarAsset } from '~/composables/useComparaDolarQuotes'
import { getInstitutionLogo } from '~/lib/mappings/institutions'
import { ogUpdatedAtDate } from '~/utils/og-data'
import type { RemesaDetalles, RemesaOption } from '~/composables/useRemesas'

definePageMeta({
  pageTitle: 'Remesas',
  pageDescription:
    'Compará plataformas para cobrar remesas y pagos del exterior: cuenta propia, moneda, inversiones, tarjeta y costos.',
})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UIcon = resolveComponent('UIcon')
const UPopover = resolveComponent('UPopover')

const companyDisplayNames: Record<string, string> = {
  wallbit: 'Wallbit',
  arq: 'ARQ',
  astropay: 'AstroPay',
  cocos: 'Cocos',
  grabrfi: 'GrabrFi',
  takenos: 'Takenos',
  payoneer: 'Payoneer',
  airtm: 'Airtm',
  lemon: 'Lemon',
  wise: 'Wise',
}

interface RemesaComparaDolarMapping {
  asset: ComparaDolarAsset
  slug: string
}

const remesaComparaDolarProviderMap: Record<string, RemesaComparaDolarMapping | null> = {
  wallbit: { asset: 'usd', slug: 'wallbit' },
  astropay: { asset: 'usd', slug: 'astropay' },
  cocos: { asset: 'usd', slug: 'cocos' },
  arq: { asset: 'usdc', slug: 'arq' },
  lemon: { asset: 'usdc', slug: 'lemoncash' },
  takenos: null,
  airtm: null,
  grabrfi: null,
  payoneer: null,
  wise: null,
}

const { remesas, fechaActualizacion, loading, error, fetch: fetchRemesas } = useRemesas()
const {
  quotes: comparaDolarQuotes,
  error: comparaDolarError,
  fetch: fetchComparaDolarQuotes,
} = useComparaDolarQuotes()

await Promise.all([fetchRemesas(), fetchComparaDolarQuotes()])

interface RemesaRow extends RemesaOption {
  displayName: string
  initials: string
  logo?: string
  averageRating: number
  averageRatingLabel: string
  costoRecibirPagosSort: number
  costoMantenimientoTarjetaSort: number
  costoTarjetaSort: number
  retiroArsSort: number
  monedaLabel: string
  cuentaPropiaLabel: string
  inversionesLabel: string
  tarjetaUsaLabel: string
  fxSpread: number | null
  fxSpreadLabel: string
  fxSpreadSort: number
  fxSpreadAsset: ComparaDolarAsset | null
  fxSpreadSlug: string | null
  fxSpreadSourceLabel: string | null
  fxSpreadDetail: string | null
  zeroReceiveCost: boolean
  zeroArsWithdrawal: boolean
}

function normalizeText(value: string | null): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function normalizeProviderKey(value: string | null): string {
  return normalizeText(value).replace(/[\s_-]+/g, '')
}

function displayCompanyName(compania: string): string {
  const mapped = companyDisplayNames[normalizeProviderKey(compania)]
  if (mapped) return mapped

  return compania
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase()
}

function isZeroLike(value: string | null): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.')
  return ['0', '0%', '0usd', '0ars', '$0', '0.0', '0.00'].includes(normalized)
}

function hasPositiveNumericValue(value: string | null): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase().replace(',', '.')
  const match = normalized.match(/-?\d+(?:\.\d+)?/)
  if (!match) return false
  return Number(match[0]) > 0
}

function getSortableNumericValue(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY
  if (isZeroLike(value)) return 0

  const normalized = value.trim().toLowerCase().replace(',', '.')
  const match = normalized.match(/-?\d+(?:\.\d+)?/)
  if (!match) return Number.POSITIVE_INFINITY

  return Number(match[0])
}

function formatRating(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatOgRating(value: number): string {
  return value.toFixed(2)
}

function formatSpread(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'

  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    signDisplay: 'always',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatFxNumber(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatUpdatedAt(value: string | null): string {
  if (!value) return ogUpdatedAtDate()

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value))
}

function getDetail(details: RemesaDetalles | null | undefined, key: keyof RemesaDetalles) {
  return details?.[key] ?? ''
}

function getRemesaComparaDolarMapping(compania: string): RemesaComparaDolarMapping | null {
  return remesaComparaDolarProviderMap[normalizeProviderKey(compania)] ?? null
}

const comparaDolarQuotesByKey = computed(() => {
  return new Map(
    comparaDolarQuotes.value.map((quote) => [`${quote.asset}:${quote.slug}`, quote] as const),
  )
})

const hasHover = useMediaQuery('(hover: hover)')
const isMobile = useMediaQuery('(max-width: 1023px)')

function renderDetailPopover(detail: string | null | undefined) {
  if (!detail) return null

  return h(
    UPopover,
    {
      mode: hasHover.value ? 'hover' : 'click',
      openDelay: 80,
      closeDelay: 300,
      content: {
        side: 'top',
        sideOffset: 8,
      },
      ui: {
        content: 'max-w-sm whitespace-normal text-left p-3',
      },
    },
    {
      default: () =>
        h(
          'span',
          {
            class:
              'inline-flex cursor-help items-center gap-1 rounded-full border border-neutral-200 p-0.5 text-[11px] font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400',
          },
          [h(UIcon, { name: 'i-lucide-info', class: 'size-3' })],
        ),
      content: () =>
        h('div', { class: 'space-y-1' }, [
          h('p', { class: 'text-xs font-semibold text-neutral-900 dark:text-white' }, 'Detalle'),
          h('p', { class: 'text-xs leading-5 text-neutral-600 dark:text-neutral-300' }, detail),
        ]),
    },
  )
}

function renderBooleanCell(value: boolean, detail?: string) {
  return h('div', { class: 'min-w-0' }, [
    h('div', { class: 'flex items-center gap-2' }, [
      h(
        UBadge,
        {
          color: value ? 'success' : 'error',
          variant: 'soft',
          size: 'md',
          class: 'gap-1.5',
        },
        {
          default: () => [
            h(UIcon, {
              name: value ? 'i-lucide-check' : 'i-lucide-x',
              class: 'size-3.5',
            }),
            value ? 'Sí' : 'No',
          ],
        },
      ),
      detail
        ? h(
            UPopover,
            {
              mode: hasHover.value ? 'hover' : 'click',
              openDelay: 80,
              closeDelay: 300,
              content: {
                side: 'top',
                sideOffset: 8,
              },
              ui: {
                content: 'max-w-sm whitespace-normal text-left p-3',
              },
            },
            {
              default: () =>
                h(
                  'span',
                  {
                    class:
                      'inline-flex cursor-help items-center gap-1 rounded-full border border-neutral-200 p-0.5 text-[11px] font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400',
                  },
                  [h(UIcon, { name: 'i-lucide-info', class: 'size-3' })],
                ),
              content: () =>
                h('div', { class: 'space-y-1' }, [
                  h(
                    'p',
                    { class: 'text-xs font-semibold text-neutral-900 dark:text-white' },
                    'Detalle',
                  ),
                  h(
                    'p',
                    { class: 'text-xs leading-5 text-neutral-600 dark:text-neutral-300' },
                    detail,
                  ),
                ]),
            },
          )
        : null,
    ]),
  ])
}

function renderCostCell(value: string | null, detail?: string) {
  const displayValue = value ?? 'N/A'
  const badgeColor = !value
    ? 'neutral'
    : isZeroLike(value)
      ? 'success'
      : hasPositiveNumericValue(value)
        ? 'error'
        : 'neutral'

  return h('div', { class: 'min-w-0' }, [
    h('div', { class: 'flex items-center gap-2' }, [
      h(
        UBadge,
        {
          color: badgeColor,
          variant: badgeColor === 'neutral' ? 'outline' : 'soft',
          size: 'md',
          class: 'font-semibold',
        },
        {
          default: () => displayValue,
        },
      ),
      detail
        ? h(
            UPopover,
            {
              mode: hasHover.value ? 'hover' : 'click',
              openDelay: 80,
              closeDelay: 300,
              content: {
                side: 'top',
                sideOffset: 8,
              },
              ui: {
                content: 'max-w-sm whitespace-normal text-left p-3',
              },
            },
            {
              default: () =>
                h(
                  'span',
                  {
                    class:
                      'inline-flex cursor-help items-center gap-1 rounded-full border border-neutral-200 p-0.5 text-[11px] font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400',
                  },
                  [h(UIcon, { name: 'i-lucide-info', class: 'size-3' })],
                ),
              content: () =>
                h('div', { class: 'space-y-1' }, [
                  h(
                    'p',
                    { class: 'text-xs font-semibold text-neutral-900 dark:text-white' },
                    'Detalle',
                  ),
                  h(
                    'p',
                    { class: 'text-xs leading-5 text-neutral-600 dark:text-neutral-300' },
                    detail,
                  ),
                ]),
            },
          )
        : null,
    ]),
  ])
}

function renderFxSpreadCell(row: RemesaRow) {
  const spread = row.fxSpread
  const tone =
    spread === null
      ? 'neutral'
      : Math.abs(spread) <= 0.01
        ? 'success'
        : Math.abs(spread) <= 0.03
          ? 'warning'
          : 'error'

  return h('div', { class: 'min-w-0' }, [
    h('div', { class: 'flex items-center gap-2' }, [
      h(
        UBadge,
        {
          color: tone,
          variant: tone === 'neutral' ? 'outline' : 'soft',
          size: 'md',
          class: 'font-semibold',
        },
        {
          default: () => row.fxSpreadLabel,
        },
      ),
      row.fxSpreadDetail
        ? h(
            UPopover,
            {
              mode: hasHover.value ? 'hover' : 'click',
              openDelay: 80,
              closeDelay: 300,
              content: {
                side: 'top',
                sideOffset: 8,
              },
              ui: {
                content: 'max-w-sm whitespace-normal text-left p-3',
              },
            },
            {
              default: () =>
                h(
                  'span',
                  {
                    class:
                      'inline-flex cursor-help items-center gap-1 rounded-full border border-neutral-200 p-0.5 text-[11px] font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400',
                  },
                  [h(UIcon, { name: 'i-lucide-info', class: 'size-3' })],
                ),
              content: () =>
                h('div', { class: 'space-y-1' }, [
                  h(
                    'p',
                    { class: 'text-xs font-semibold text-neutral-900 dark:text-white' },
                    'Spread',
                  ),
                  h(
                    'p',
                    { class: 'text-xs leading-5 text-neutral-600 dark:text-neutral-300' },
                    row.fxSpreadDetail,
                  ),
                ]),
            },
          )
        : null,
    ]),
  ])
}

const rows = computed<RemesaRow[]>(() => {
  return remesas.value
    .map((item) => {
      const displayName = displayCompanyName(item.compania)
      const androidRating = item.calificacionAndroid ?? 0
      const iosRating = item.calificacionIos ?? 0
      const ratingCount =
        (item.calificacionAndroid !== null ? 1 : 0) + (item.calificacionIos !== null ? 1 : 0)
      const averageRating = ratingCount > 0 ? (androidRating + iosRating) / ratingCount : 0
      const mapping = getRemesaComparaDolarMapping(item.compania)
      const quote = mapping
        ? comparaDolarQuotesByKey.value.get(`${mapping.asset}:${mapping.slug}`)
        : undefined
      const fxSpread = quote ? quote.bid / quote.ask - 1 : null

      return {
        ...item,
        displayName,
        initials: getInitials(displayName),
        logo: getInstitutionLogo(item.compania) || getInstitutionLogo(displayName),
        averageRating,
        averageRatingLabel: ratingCount > 0 ? `${formatRating(averageRating)}★` : '—',
        costoRecibirPagosSort: getSortableNumericValue(item.costoRecibirPagos),
        costoMantenimientoTarjetaSort: getSortableNumericValue(item.costoMantenimientoTarjeta),
        costoTarjetaSort: getSortableNumericValue(item.costoTarjeta),
        retiroArsSort: getSortableNumericValue(item.retiroArs),
        monedaLabel:
          item.moneda === 'FIAT' ? 'Fiat' : item.moneda === 'CRIPTO' ? 'Cripto' : item.moneda,
        cuentaPropiaLabel: item.cuentaPropia ? 'Sí' : 'No',
        inversionesLabel: item.inversiones ? 'Sí' : 'No',
        tarjetaUsaLabel: item.tarjetaUsa ? 'Sí' : 'No',
        fxSpread,
        fxSpreadLabel: formatSpread(fxSpread),
        fxSpreadSort: fxSpread === null ? Number.POSITIVE_INFINITY : Math.abs(fxSpread),
        fxSpreadAsset: mapping?.asset ?? null,
        fxSpreadSlug: mapping?.slug ?? null,
        fxSpreadSourceLabel: mapping ? `/${mapping.asset}/${mapping.slug}` : null,
        fxSpreadDetail:
          quote && mapping
            ? `comparadolar.ar${`/${mapping.asset}`} · ${quote.prettyName} · compra ${formatFxNumber(quote.bid)} / venta ${formatFxNumber(quote.ask)}`
            : mapping
              ? `Hoy no devolvió cotización en comparadolar.ar`
              : 'No hay un proveedor/mercado equivalente en comparadolar.ar para calcular el spread FX',
        zeroReceiveCost: isZeroLike(item.costoRecibirPagos),
        zeroArsWithdrawal: isZeroLike(item.retiroArs),
      }
    })
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
      if (Number(b.zeroReceiveCost) !== Number(a.zeroReceiveCost)) {
        return Number(b.zeroReceiveCost) - Number(a.zeroReceiveCost)
      }
      return a.displayName.localeCompare(b.displayName)
    })
})

const searchQuery = useRouteQuery('q', '')
const monedaFilter = useRouteQuery('moneda', 'all')
const cuentaPropiaFilter = useRouteQuery('propia', 'all')
const inversionesFilter = useRouteQuery('inv', 'all')
const tarjetaFilter = useRouteQuery('tarjeta', 'all')
const sortQuery = useRouteQuery('sort', '[{"id":"retiroArsSort","desc":false}]')

type SortingState = Array<{ id: string; desc: boolean }>

function parseSorting(value: string): SortingState {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [{ id: 'retiroArsSort', desc: false }]
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

function matchBooleanFilter(filter: string, value: boolean): boolean {
  return filter === 'all' || (filter === 'si' && value) || (filter === 'no' && !value)
}

const sortedFilteredRows = computed(() => {
  const items = [...filteredRows.value]
  if (sorting.value.length === 0) return items

  const sortDef = sorting.value[0]
  if (!sortDef) return items

  const id = sortDef.id
  const desc = sortDef.desc

  return items.sort((a, b) => {
    let aVal: any = a[id as keyof RemesaRow]
    let bVal: any = b[id as keyof RemesaRow]

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
    }

    if (aVal == null) aVal = desc ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY
    if (bVal == null) bVal = desc ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY

    return desc ? bVal - aVal : aVal - bVal
  })
})

const sortableColumns = [
  { id: 'retiroArsSort', label: 'Retiro ARS' },
  { id: 'fxSpreadSort', label: 'Spread FX' },
  { id: 'costoRecibirPagosSort', label: 'Recibir pagos' },
  { id: 'costoMantenimientoTarjetaSort', label: 'Mant. tarjeta' },
  { id: 'costoTarjetaSort', label: 'Uso tarjeta' },
  { id: 'averageRating', label: 'Rating' },
  { id: 'displayName', label: 'Nombre' },
]

const activeSortColumn = ref(
  sortableColumns.find((c) => c.id === (sorting.value[0]?.id ?? 'retiroArsSort')) ??
    sortableColumns[0]!,
)
const activeSortDesc = ref(sorting.value[0]?.desc ?? false)

watch(activeSortColumn, (col) => {
  sorting.value = [{ id: col.id, desc: activeSortDesc.value }]
})

watch(activeSortDesc, (desc) => {
  if (sorting.value[0]) {
    sorting.value = [{ id: sorting.value[0].id, desc }]
  }
})

watch(sorting, (value) => {
  const col = value[0]
  if (col) {
    const found = sortableColumns.find((c) => c.id === col.id)
    if (found) activeSortColumn.value = found
    activeSortDesc.value = col.desc
  }
})

const filteredRows = computed(() => {
  const query = normalizeText(searchQuery.value)

  return rows.value.filter((row) => {
    if (monedaFilter.value !== 'all' && row.moneda !== monedaFilter.value) return false
    if (!matchBooleanFilter(cuentaPropiaFilter.value, row.cuentaPropia)) return false
    if (!matchBooleanFilter(inversionesFilter.value, row.inversiones)) return false
    if (!matchBooleanFilter(tarjetaFilter.value, row.tarjetaUsa)) return false

    if (!query) return true

    return [
      row.displayName,
      row.monedaLabel,
      row.costoRecibirPagos,
      row.costoMantenimientoTarjeta,
      row.costoTarjeta,
      row.retiroArs,
      ...Object.values(row.detalles ?? {}),
    ]
      .map((value) => normalizeText(value))
      .some((value) => value.includes(query))
  })
})

const formattedUpdatedAt = computed(() => formatUpdatedAt(fechaActualizacion.value))

function createSortableHeader(label: string) {
  return ({ column }: { column: any }) => {
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

const ogItems = computed(() => {
  return [...rows.value]
    .sort((a, b) => b.averageRating - a.averageRating || a.displayName.localeCompare(b.displayName))
    .slice(0, 3)
    .map((item) => ({
      name: item.displayName,
      currency: item.monedaLabel,
      rating: formatOgRating(item.averageRating),
      receiveCost: item.costoRecibirPagos ?? 'N/A',
      arsWithdrawal: item.retiroArs ?? 'N/A',
    }))
})

defineOgImage('Remesas.takumi', {
  title: 'Remesas',
  subtitle: 'Top plataformas para cobrar del exterior, ordenadas por rating promedio.',
  items: ogItems.value ?? [],
  updatedAt: formattedUpdatedAt.value,
})

useSeoMeta({
  title: 'Remesas',
  description:
    'Compará plataformas para cobrar remesas y pagos del exterior. Revisá si ofrecen cuenta propia, soporte fiat o cripto, inversiones, tarjeta y costos.',
  ogTitle: 'Remesas - Compara Tasas',
  ogDescription:
    'Compará plataformas para cobrar remesas y pagos del exterior con cuenta propia, moneda, costos y calificaciones.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/remesas' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/remesas' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/remesas' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Remesas - Compara Tasas',
        description: 'Comparativa de plataformas para cobrar remesas y pagos del exterior.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
})

const columns: TableColumn<RemesaRow>[] = [
  {
    accessorKey: 'displayName',
    header: createSortableHeader('Plataforma'),
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        row.original.logo
          ? h('img', {
              src: row.original.logo,
              alt: `${row.original.displayName} logo`,
              class: 'size-9 rounded-full object-contain',
              loading: 'lazy',
            })
          : h(
              'div',
              {
                class:
                  'flex size-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
              },
              row.original.initials,
            ),
        h('div', { class: 'min-w-0' }, [
          h(
            'p',
            { class: 'font-medium text-neutral-900 dark:text-white' },
            row.getValue('displayName'),
          ),
          h('div', { class: 'mt-1 flex flex-wrap items-center gap-2' }, [
            h('p', { class: 'text-xs text-neutral-500' }, row.original.monedaLabel),
          ]),
        ]),
      ]),
  },
  {
    accessorKey: 'cuentaPropia',
    header: createSortableHeader('Cuenta propia'),
    cell: ({ row }) =>
      renderBooleanCell(
        row.original.cuentaPropia,
        getDetail(row.original.detalles, 'cuentaPropia'),
      ),
  },
  {
    accessorKey: 'inversiones',
    header: createSortableHeader('Inversiones'),
    cell: ({ row }) =>
      renderBooleanCell(row.original.inversiones, getDetail(row.original.detalles, 'inversiones')),
  },
  {
    accessorKey: 'tarjetaUsa',
    header: createSortableHeader('Tarjeta EEUU'),
    cell: ({ row }) =>
      renderBooleanCell(row.original.tarjetaUsa, getDetail(row.original.detalles, 'tarjetaUsa')),
  },
  {
    accessorKey: 'costoRecibirPagosSort',
    header: createSortableHeader('Recibir pagos'),
    cell: ({ row }) =>
      renderCostCell(
        row.original.costoRecibirPagos,
        getDetail(row.original.detalles, 'costoRecibirPagos'),
      ),
  },
  {
    accessorKey: 'retiroArsSort',
    header: createSortableHeader('Retiro ARS'),
    cell: ({ row }) =>
      renderCostCell(row.original.retiroArs, getDetail(row.original.detalles, 'retiroArs')),
  },
  {
    accessorKey: 'fxSpreadSort',
    header: createSortableHeader('Spread fx'),
    cell: ({ row }) => renderFxSpreadCell(row.original),
  },
  {
    accessorKey: 'costoMantenimientoTarjetaSort',
    header: createSortableHeader('Mant. tarjeta'),
    cell: ({ row }) =>
      renderCostCell(
        row.original.costoMantenimientoTarjeta,
        getDetail(row.original.detalles, 'costoMantenimientoTarjeta'),
      ),
  },
  {
    accessorKey: 'costoTarjetaSort',
    header: createSortableHeader('Uso tarjeta'),
    cell: ({ row }) =>
      renderCostCell(row.original.costoTarjeta, getDetail(row.original.detalles, 'costoTarjeta')),
  },
  {
    accessorKey: 'averageRating',
    header: createSortableHeader('Rating promedio'),
    cell: ({ row }) => row.original.averageRatingLabel,
  },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UBadge color="neutral" variant="outline" size="lg">
        Actualizado {{ formattedUpdatedAt }}
      </UBadge>
      <p class="text-sm text-neutral-500">
        Fuente:
        <a
          href="https://www.dolarito.ar/remotito"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          Dolarito
        </a>
      </p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="No se pudieron cargar las remesas"
      description="Probá recargar en unos minutos."
    />

    <UAlert
      v-if="comparaDolarError"
      color="warning"
      variant="soft"
      title="No se pudo cargar Comparar Dólar"
      description="La tabla sigue mostrando remesas, pero la columna Spread fx puede quedar incompleta."
    />

    <div v-if="loading && rows.length === 0" class="py-8">
      <FundsLoading />
    </div>

    <template v-else>
      <UCard>
        <template #header>
          <div class="space-y-3">
            <h2 class="text-lg font-semibold">Tabla comparativa</h2>
            <div class="grid gap-4 xl:grid-cols-[minmax(0,320px)_1fr]">
              <UFormField label="Buscar plataforma">
                <UInput
                  v-model="searchQuery"
                  icon="i-lucide-search"
                  placeholder="ARQ, Wallbit, AstroPay..."
                />
              </UFormField>

              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Moneda</p>
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      v-for="option in ['all', 'FIAT', 'CRIPTO']"
                      :key="option"
                      size="sm"
                      :color="monedaFilter === option ? 'primary' : 'neutral'"
                      :variant="monedaFilter === option ? 'soft' : 'outline'"
                      @click="monedaFilter = option"
                    >
                      {{ option === 'all' ? 'Todas' : option === 'FIAT' ? 'Fiat' : 'Cripto' }}
                    </UButton>
                  </div>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Cuenta propia
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      v-for="option in ['all', 'si', 'no']"
                      :key="`propia-${option}`"
                      size="sm"
                      :color="cuentaPropiaFilter === option ? 'primary' : 'neutral'"
                      :variant="cuentaPropiaFilter === option ? 'soft' : 'outline'"
                      @click="cuentaPropiaFilter = option"
                    >
                      {{ option === 'all' ? 'Todas' : option === 'si' ? 'Sí' : 'No' }}
                    </UButton>
                  </div>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Inversiones
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      v-for="option in ['all', 'si', 'no']"
                      :key="`inv-${option}`"
                      size="sm"
                      :color="inversionesFilter === option ? 'primary' : 'neutral'"
                      :variant="inversionesFilter === option ? 'soft' : 'outline'"
                      @click="inversionesFilter = option"
                    >
                      {{ option === 'all' ? 'Todas' : option === 'si' ? 'Sí' : 'No' }}
                    </UButton>
                  </div>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Tarjeta EEUU
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <UButton
                      v-for="option in ['all', 'si', 'no']"
                      :key="`tarjeta-${option}`"
                      size="sm"
                      :color="tarjetaFilter === option ? 'primary' : 'neutral'"
                      :variant="tarjetaFilter === option ? 'soft' : 'outline'"
                      @click="tarjetaFilter = option"
                    >
                      {{ option === 'all' ? 'Todas' : option === 'si' ? 'Sí' : 'No' }}
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
            <p class="text-xs text-neutral-500">
              Si una plataforma tiene aclaraciones, aparecen como <strong>Detalle</strong> dentro de
              la celda.
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

        <div class="hidden lg:block">
          <UTable v-model:sorting="sorting" :data="filteredRows" :columns="columns">
            <template #empty>
              <div class="py-10 text-center text-sm text-neutral-500">
                No hay plataformas que coincidan con los filtros actuales.
              </div>
            </template>
          </UTable>
        </div>

        <div v-if="isMobile" class="lg:hidden space-y-4">
          <div class="flex items-center gap-3">
            <USelect
              v-model="activeSortColumn"
              :items="sortableColumns"
              value-key="id"
              label-key="label"
              placeholder="Ordenar por"
              size="sm"
              class="min-w-0 flex-1"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :icon="
                activeSortDesc ? 'i-lucide-arrow-down-narrow-wide' : 'i-lucide-arrow-up-narrow-wide'
              "
              @click="activeSortDesc = !activeSortDesc"
            />
          </div>

          <div class="space-y-3">
            <div
              v-for="row in sortedFilteredRows"
              :key="row.compania"
              class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div class="flex items-center gap-3 mb-3">
                <img
                  v-if="row.logo"
                  :src="row.logo"
                  :alt="`${row.displayName} logo`"
                  class="size-10 rounded-full object-contain"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  {{ row.initials }}
                </div>
                <div>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ row.displayName }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    {{ row.monedaLabel }}
                  </p>
                </div>
                <div class="ml-auto">
                  <UBadge color="neutral" variant="outline" size="sm">
                    {{ row.averageRatingLabel }}
                  </UBadge>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 text-sm">
                <div
                  class="flex items-center rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-neutral-800"
                >
                  <span class="text-neutral-500">Cuenta propia</span>
                  <span class="ml-auto" />
                  <UBadge :color="row.cuentaPropia ? 'success' : 'error'" variant="soft" size="sm">
                    {{ row.cuentaPropiaLabel }}
                  </UBadge>
                  <component
                    :is="renderDetailPopover(getDetail(row.detalles, 'cuentaPropia'))"
                    class="ml-1"
                  />
                </div>
                <div
                  class="flex items-center rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-neutral-800"
                >
                  <span class="text-neutral-500">Inversiones</span>
                  <span class="ml-auto" />
                  <UBadge :color="row.inversiones ? 'success' : 'error'" variant="soft" size="sm">
                    {{ row.inversionesLabel }}
                  </UBadge>
                  <component
                    :is="renderDetailPopover(getDetail(row.detalles, 'inversiones'))"
                    class="ml-1"
                  />
                </div>
                <div
                  class="flex items-center rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-neutral-800"
                >
                  <span class="text-neutral-500">Tarjeta EEUU</span>
                  <span class="ml-auto" />
                  <UBadge :color="row.tarjetaUsa ? 'success' : 'error'" variant="soft" size="sm">
                    {{ row.tarjetaUsaLabel }}
                  </UBadge>
                  <component
                    :is="renderDetailPopover(getDetail(row.detalles, 'tarjetaUsa'))"
                    class="ml-1"
                  />
                </div>
                <div
                  class="flex items-center rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-neutral-800"
                >
                  <span class="text-neutral-500">Recibir pagos</span>
                  <span class="ml-auto" />
                  <UBadge
                    :color="row.zeroReceiveCost ? 'success' : 'error'"
                    variant="soft"
                    size="sm"
                  >
                    {{ row.costoRecibirPagos ?? 'N/A' }}
                  </UBadge>
                  <component
                    :is="renderDetailPopover(getDetail(row.detalles, 'costoRecibirPagos'))"
                    class="ml-1"
                  />
                </div>
                <div
                  class="flex items-center rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-neutral-800"
                >
                  <span class="text-neutral-500">Retiro ARS</span>
                  <span class="ml-auto" />
                  <UBadge
                    :color="row.zeroArsWithdrawal ? 'success' : 'error'"
                    variant="soft"
                    size="sm"
                  >
                    {{ row.retiroArs ?? 'N/A' }}
                  </UBadge>
                  <component
                    :is="renderDetailPopover(getDetail(row.detalles, 'retiroArs'))"
                    class="ml-1"
                  />
                </div>
                <div
                  class="flex items-center rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-neutral-800"
                >
                  <span class="text-neutral-500">Spread fx</span>
                  <span class="ml-auto" />
                  <UBadge
                    :color="
                      row.fxSpread === null
                        ? 'neutral'
                        : Math.abs(row.fxSpread) <= 0.01
                          ? 'success'
                          : Math.abs(row.fxSpread) <= 0.03
                            ? 'warning'
                            : 'error'
                    "
                    :variant="row.fxSpread === null ? 'outline' : 'soft'"
                    size="sm"
                  >
                    {{ row.fxSpreadLabel }}
                  </UBadge>
                  <component :is="renderDetailPopover(row.fxSpreadDetail)" class="ml-1" />
                </div>
                <div
                  class="flex items-center rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-neutral-800"
                >
                  <span class="text-neutral-500">Mant. tarjeta</span>
                  <span class="ml-auto" />
                  <UBadge color="neutral" variant="soft" size="sm">
                    {{ row.costoMantenimientoTarjeta ?? 'N/A' }}
                  </UBadge>
                  <component
                    :is="renderDetailPopover(getDetail(row.detalles, 'costoMantenimientoTarjeta'))"
                    class="ml-1"
                  />
                </div>
                <div
                  class="flex items-center rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-neutral-800"
                >
                  <span class="text-neutral-500">Uso tarjeta</span>
                  <span class="ml-auto" />
                  <UBadge color="neutral" variant="soft" size="sm">
                    {{ row.costoTarjeta ?? 'N/A' }}
                  </UBadge>
                  <component
                    :is="renderDetailPopover(getDetail(row.detalles, 'costoTarjeta'))"
                    class="ml-1"
                  />
                </div>
                <div
                  class="flex items-center rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-neutral-800"
                >
                  <span class="text-neutral-500">Rating</span>
                  <span class="ml-auto" />
                  <span class="text-xs">{{ row.averageRatingLabel }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="sortedFilteredRows.length === 0"
            class="py-10 text-center text-sm text-neutral-500"
          >
            No hay plataformas que coincidan con los filtros actuales.
          </div>
        </div>
      </UCard>
    </template>

    <UCard class="w-full max-w-4xl mx-auto">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="space-y-1">
          <p class="text-sm font-semibold text-neutral-900 dark:text-white">
            ¿También querés comparar dólar cripto, MEP y otras cotizaciones?
          </p>
          <p class="text-sm text-neutral-500">
            Mirá el comparador de
            <a
              href="https://comparadolar.ar/"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              comparadolar.ar
            </a>
            para ver precios y spreads en tiempo real.
          </p>
        </div>

        <UButton
          to="https://comparadolar.ar/"
          external
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          variant="soft"
          icon="i-lucide-arrow-up-right"
        >
          Comparar dólar
        </UButton>
      </div>
    </UCard>
  </div>
</template>

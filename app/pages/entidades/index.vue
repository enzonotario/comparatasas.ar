<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useRouteQuery } from '@vueuse/router'
import {
  ENTITY_TYPE_LABELS,
  getEntityBySlug,
  getEntityLogo,
  normalizeEntityName,
  type EntityType,
} from '~/lib/entities'
import {
  ENTITY_CATEGORIES,
  ENTITY_CATEGORY_GROUPS,
  formatCategoryBest,
  getCategoryBest,
  type CategoryBest,
  type EntitiesResponse,
  type EntityCategoryKey,
  type EntitySummary,
} from '~/lib/entities-products'
import { withHeaderTooltip } from '~/lib/table-header-tooltip'

definePageMeta({
  pageTitle: 'Entidades',
  pageDescription:
    'Bancos, billeteras, brokers y remesadoras: todo lo que compara Compara Tasas de cada entidad en un solo lugar.',
})

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UIcon = resolveComponent('UIcon')
const NuxtLink = resolveComponent('NuxtLink')

const { data, status, error, refresh } = await useFetch<EntitiesResponse>('/api/entidades.json', {
  key: 'entidades',
})

interface EntityRow extends EntitySummary {
  logo?: string
  typeLabel: string
  best: Partial<Record<EntityCategoryKey, CategoryBest>>
}

const searchQuery = useRouteQuery('q', '')
const typeFilter = useRouteQuery('tipo', 'all')
// Checked products as a comma list. None checked (default) shows every entity.
const productsQuery = useRouteQuery('productos', '')
const productsFilterOpen = ref(Boolean(productsQuery.value))
const DEFAULT_SORTING = [{ id: 'cuentas-remuneradas', desc: true }]
const sortQuery = useRouteQuery('sort', JSON.stringify(DEFAULT_SORTING))

const sorting = computed({
  get: () => {
    try {
      const parsed = JSON.parse(sortQuery.value || '[]')
      return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_SORTING
    } catch {
      return DEFAULT_SORTING
    }
  },
  set: (value) => {
    sortQuery.value = JSON.stringify(value)
  },
})

const columnPinning = ref({ left: ['name'], right: [] })

const typeOptions: Array<{ value: EntityType | 'all'; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'banco', label: 'Bancos' },
  { value: 'billetera', label: 'Billeteras' },
  { value: 'broker', label: 'Brokers' },
  { value: 'remesadora', label: 'Remesadoras' },
  { value: 'otro', label: 'Otras' },
]

const rows = computed<EntityRow[]>(() =>
  (data.value?.entities ?? []).map((entity) => {
    const registryEntity = getEntityBySlug(entity.slug)
    return {
      ...entity,
      logo: registryEntity ? getEntityLogo(registryEntity) : undefined,
      typeLabel: ENTITY_TYPE_LABELS[entity.type],
      best: Object.fromEntries(
        ENTITY_CATEGORIES.flatMap((category) => {
          const best = getCategoryBest(entity.products, category.key)
          return best ? [[category.key, best] as const] : []
        }),
      ),
    }
  }),
)

const filteredRows = computed(() => {
  const query = normalizeEntityName(searchQuery.value || '')
  return rows.value.filter((row) => {
    if (typeFilter.value !== 'all' && row.type !== typeFilter.value) return false
    // Entities offering every checked product.
    if (!selectedCategoryKeys.value.every((key) => row.best[key])) return false
    if (!query) return true
    const aliases = getEntityBySlug(row.slug)?.aliases ?? []
    return [row.name, ...aliases].some((name) => normalizeEntityName(name).includes(query))
  })
})

// Categories with at least one entity. Based on all rows (not the filtered
// ones) so columns stay stable and a sorted column never disappears.
const tableCategories = computed(() =>
  ENTITY_CATEGORIES.filter((category) => rows.value.some((row) => row.best[category.key])),
)

const selectedCategoryKeys = computed(() => {
  const selected = new Set((productsQuery.value || '').split(',').filter(Boolean))
  return ENTITY_CATEGORIES.map((category) => category.key).filter((key) => selected.has(key))
})

function setCategorySelected(key: EntityCategoryKey, selected: boolean) {
  const keys = new Set(selectedCategoryKeys.value)
  if (selected) keys.add(key)
  else keys.delete(key)
  productsQuery.value = ENTITY_CATEGORIES.map((category) => category.key)
    .filter((categoryKey) => keys.has(categoryKey))
    .join(',')
}

const tableGroups = computed(() =>
  ENTITY_CATEGORY_GROUPS.map((group) => ({
    ...group,
    categories: tableCategories.value.filter((category) => category.group === group.key),
  })).filter((group) => group.categories.length > 0),
)

const valueCategories = ENTITY_CATEGORIES.filter(
  (category) => ENTITY_CATEGORY_GROUPS.find((group) => group.key === category.group)?.showValue,
)
const availabilityCategories = ENTITY_CATEGORIES.filter(
  (category) => !valueCategories.includes(category),
)

/**
 * Sortable header (same pattern as fal.vue). The first click sorts "best
 * first": descending for `higher` columns, ascending otherwise.
 */
function sortableHeader(label: string, fullLabel?: string, bestFirstDesc = false) {
  return ({
    column,
  }: {
    column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void }
  }) => {
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
      class: '-mx-2.5 h-auto min-w-0 items-start whitespace-normal text-left font-semibold',
      ui: { label: 'min-w-0 !whitespace-normal !overflow-visible !text-clip' },
      onClick: () => column.toggleSorting(isSorted ? isSorted === 'asc' : bestFirstDesc),
    })
    return withHeaderTooltip(button, fullLabel)
  }
}

function renderEntityCell(row: EntityRow) {
  return h(
    NuxtLink,
    { to: `/entidades/${row.slug}`, class: 'group flex min-w-0 items-center gap-2' },
    () => [
      h(UAvatar, {
        src: row.logo,
        alt: row.name,
        size: 'sm',
        referrerpolicy: 'no-referrer',
        ui: { image: 'object-contain' },
      }),
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'truncate font-medium group-hover:text-primary' }, row.name),
        h('p', { class: 'text-xs text-muted' }, row.typeLabel),
      ]),
    ],
  )
}

function renderAvailabilityCell(best: CategoryBest | undefined, label: string) {
  if (!best) return h('span', { class: 'text-muted' }, '—')
  return h(
    NuxtLink,
    {
      to: best.to,
      class: 'inline-flex text-success hover:text-primary',
      title: `${label}: ${best.count} ${best.count === 1 ? 'producto' : 'productos'}`,
      'aria-label': `Ofrece ${label}`,
    },
    () => h(UIcon, { name: 'i-lucide-check', class: 'size-5' }),
  )
}

function renderValueCell(best: CategoryBest | undefined) {
  if (!best) return h('span', { class: 'text-muted' }, '—')
  const others = best.count - 1
  return h(
    NuxtLink,
    { to: best.to, class: 'group inline-flex items-baseline gap-1 whitespace-nowrap' },
    () => [
      h(
        'span',
        {
          class: [
            'group-hover:text-primary group-hover:underline',
            best.value == null ? 'text-muted' : 'font-medium text-highlighted',
          ],
        },
        formatCategoryBest(best),
      ),
      others > 0
        ? h('span', { class: 'text-xs text-muted', title: `${best.count} productos` }, `+${others}`)
        : null,
    ],
  )
}

const GROUP_BORDER = 'border-l border-default'

const columns = computed<TableColumn<EntityRow>[]>(() => [
  {
    id: 'name',
    accessorKey: 'name',
    header: sortableHeader('Entidad'),
    sortingFn: (a, b) => a.original.name.localeCompare(b.original.name, 'es'),
    cell: ({ row }) => renderEntityCell(row.original),
  },
  ...tableGroups.value.map((group): TableColumn<EntityRow> => ({
    id: `group-${group.key}`,
    header: group.label,
    meta: {
      class: {
        th: `text-center text-xs uppercase tracking-wide text-muted border-b ${GROUP_BORDER}`,
      },
    },
    columns: group.categories.map((category, index): TableColumn<EntityRow> => {
      // The first column of each group starts with a left border, aligned with
      // the group header, so it's clear which columns the group spans.
      const border = index === 0 ? GROUP_BORDER : ''
      return group.showValue
        ? {
            id: category.key,
            accessorFn: (row) => row.best[category.key]?.value,
            header: sortableHeader(
              `${category.shortLabel} · ${category.metricLabel}`,
              `${category.label} (${category.direction === 'higher' ? 'mayor' : 'menor'} es mejor)`,
              category.direction === 'higher',
            ),
            sortingFn: 'basic',
            // No product or no numeric value: always last, in both directions.
            sortUndefined: 'last',
            meta: { class: { th: border, td: border } },
            cell: ({ row }) => renderValueCell(row.original.best[category.key]),
          }
        : {
            id: category.key,
            // Availability only: entities offering it first.
            accessorFn: (row) => (row.best[category.key] ? 1 : undefined),
            header: sortableHeader(category.shortLabel, category.label, true),
            sortingFn: 'basic',
            sortUndefined: 'last',
            meta: { class: { th: `text-center ${border}`, td: `text-center ${border}` } },
            cell: ({ row }) =>
              renderAvailabilityCell(row.original.best[category.key], category.label),
          }
    }),
  })),
])

const seoDescription =
  'Bancos, billeteras, brokers y remesadoras de Argentina: cuentas remuneradas, plazos fijos, FCI, comisiones, préstamos y más de cada entidad.'

useSeoMeta({
  title: 'Entidades',
  description: seoDescription,
  ogTitle: 'Entidades - Compara Tasas',
  ogDescription: seoDescription,
  twitterTitle: 'Entidades - Compara Tasas',
  twitterDescription: seoDescription,
})

useHead({
  link: [{ rel: 'canonical', href: 'https://comparatasas.ar/entidades' }],
})
</script>

<template>
  <div class="space-y-6">
    <UAlert
      v-if="error"
      color="error"
      title="No se pudieron cargar las entidades"
      description="Reintentá en unos minutos."
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />

    <div v-else-if="status === 'pending' && !data" class="py-12 text-center text-neutral-500">
      Cargando entidades…
    </div>

    <template v-else>
      <div class="space-y-3">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-end">
          <UFormField label="Buscar">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Nombre de la entidad"
            />
          </UFormField>

          <UFormField label="Tipo de entidad">
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="option in typeOptions"
                :key="option.value"
                size="sm"
                :color="typeFilter === option.value ? 'primary' : 'neutral'"
                :variant="typeFilter === option.value ? 'soft' : 'outline'"
                @click="typeFilter = option.value"
              >
                {{ option.label }}
              </UButton>
            </div>
          </UFormField>
        </div>

        <UCollapsible v-model:open="productsFilterOpen">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-list-filter"
            :trailing-icon="productsFilterOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            :label="
              selectedCategoryKeys.length
                ? `Productos (${selectedCategoryKeys.length})`
                : 'Filtrar por productos'
            "
          />

          <template #content>
            <div class="mt-3 space-y-2 rounded-lg border border-default p-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs text-muted">Mostrar entidades que ofrecen todos los tildados.</p>
                <UButton
                  v-if="selectedCategoryKeys.length"
                  size="xs"
                  variant="link"
                  color="neutral"
                  class="p-0"
                  label="Limpiar"
                  @click="productsQuery = ''"
                />
              </div>
              <div
                v-for="group in tableGroups"
                :key="group.key"
                class="flex flex-wrap items-center gap-x-4 gap-y-2"
              >
                <span class="w-24 text-xs font-medium uppercase tracking-wide text-muted">
                  {{ group.label }}
                </span>
                <UCheckbox
                  v-for="category in group.categories"
                  :key="category.key"
                  :model-value="selectedCategoryKeys.includes(category.key)"
                  :label="category.shortLabel"
                  :title="category.label"
                  @update:model-value="setCategorySelected(category.key, $event === true)"
                />
              </div>
            </div>
          </template>
        </UCollapsible>

        <p class="text-xs text-muted">
          {{ filteredRows.length }} entidades. En inversiones y financiación se muestra la mejor
          tasa de cada entidad; en servicios, si los ofrece.
        </p>
      </div>

      <p v-if="filteredRows.length === 0" class="py-12 text-center text-neutral-500">
        No hay entidades que coincidan con la búsqueda.
      </p>

      <template v-else>
        <!-- Desktop: entity × category best values -->
        <div class="hidden rounded-lg border border-default bg-default lg:block">
          <UTable
            v-model:sorting="sorting"
            v-model:column-pinning="columnPinning"
            :data="filteredRows"
            :columns="columns"
            :get-row-id="(row: EntityRow) => row.slug"
            :ui="{
              th: '!whitespace-normal align-bottom',
              td: 'whitespace-nowrap',
            }"
          />
        </div>

        <!-- Mobile: cards with category badges and values -->
        <div class="grid gap-3 lg:hidden">
          <NuxtLink
            v-for="row in filteredRows"
            :key="row.slug"
            :to="`/entidades/${row.slug}`"
            class="block"
          >
            <UCard :ui="{ body: '!p-4' }" class="hover:bg-elevated">
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="row.logo"
                  :alt="row.name"
                  size="md"
                  referrerpolicy="no-referrer"
                  :ui="{ image: 'object-contain' }"
                />
                <div class="min-w-0">
                  <p class="font-medium text-highlighted">{{ row.name }}</p>
                  <p class="text-xs text-muted">{{ row.typeLabel }}</p>
                </div>
              </div>
              <div
                v-if="valueCategories.some((c) => row.best[c.key])"
                class="mt-3 flex flex-wrap gap-1.5"
              >
                <UBadge
                  v-for="category in valueCategories.filter((c) => row.best[c.key])"
                  :key="category.key"
                  color="neutral"
                  variant="soft"
                  size="sm"
                >
                  {{ category.shortLabel }}
                  <span class="font-semibold">{{
                    formatCategoryBest(row.best[category.key])
                  }}</span>
                </UBadge>
              </div>
              <div
                v-if="availabilityCategories.some((c) => row.best[c.key])"
                class="mt-2 flex flex-wrap gap-1.5"
              >
                <UBadge
                  v-for="category in availabilityCategories.filter((c) => row.best[c.key])"
                  :key="category.key"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  icon="i-lucide-check"
                >
                  {{ category.shortLabel }}
                </UBadge>
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </template>
    </template>
  </div>
</template>

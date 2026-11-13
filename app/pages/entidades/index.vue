<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'
import {
  ENTITY_TYPE_LABELS,
  getEntityBySlug,
  getEntityLogo,
  normalizeEntityName,
  type EntityType,
} from '~/lib/entities'
import { ENTITY_CATEGORIES, type EntitiesResponse } from '~/lib/entities-products'

definePageMeta({
  pageTitle: 'Entidades',
  pageDescription:
    'Bancos, billeteras, brokers y remesadoras: todo lo que compara Compara Tasas de cada entidad en un solo lugar.',
})

const { data, status, error, refresh } = await useFetch<EntitiesResponse>('/api/entidades.json', {
  key: 'entidades',
})

const searchQuery = useRouteQuery('q', '')
const typeFilter = useRouteQuery('tipo', 'all')

const typeOptions: Array<{ value: EntityType | 'all'; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'banco', label: 'Bancos' },
  { value: 'billetera', label: 'Billeteras' },
  { value: 'broker', label: 'Brokers' },
  { value: 'remesadora', label: 'Remesadoras' },
  { value: 'otro', label: 'Otras' },
]

const rows = computed(() =>
  (data.value?.entities ?? []).map((entity) => {
    const registryEntity = getEntityBySlug(entity.slug)
    return {
      ...entity,
      logo: registryEntity ? getEntityLogo(registryEntity) : undefined,
      typeLabel: ENTITY_TYPE_LABELS[entity.type],
      categories: new Set(entity.products.map((product) => product.category)),
    }
  }),
)

const filteredRows = computed(() => {
  const query = normalizeEntityName(searchQuery.value || '')
  return rows.value.filter((row) => {
    if (typeFilter.value !== 'all' && row.type !== typeFilter.value) return false
    if (!query) return true
    const aliases = getEntityBySlug(row.slug)?.aliases ?? []
    return [row.name, ...aliases].some((name) => normalizeEntityName(name).includes(query))
  })
})

// Only categories that at least one listed entity has.
const visibleCategories = computed(() =>
  ENTITY_CATEGORIES.filter((category) =>
    filteredRows.value.some((row) => row.categories.has(category.key)),
  ),
)

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
        </div>

        <p class="text-xs text-muted">{{ filteredRows.length }} entidades</p>
      </div>

      <p v-if="filteredRows.length === 0" class="py-12 text-center text-neutral-500">
        No hay entidades que coincidan con la búsqueda.
      </p>

      <template v-else>
        <!-- Desktop: entity × category coverage -->
        <div class="hidden overflow-x-auto rounded-lg border border-default bg-default lg:block">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default text-left">
                <th class="sticky left-0 bg-default px-3 py-2 font-medium">Entidad</th>
                <th
                  v-for="category in visibleCategories"
                  :key="category.key"
                  class="px-2 py-2 text-center font-medium whitespace-nowrap"
                  :title="category.label"
                >
                  {{ category.shortLabel }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredRows"
                :key="row.slug"
                class="border-b border-default last:border-0 hover:bg-elevated"
              >
                <td class="sticky left-0 bg-default px-3 py-2">
                  <NuxtLink
                    :to="`/entidades/${row.slug}`"
                    class="flex items-center gap-2 font-medium hover:text-primary"
                  >
                    <UAvatar
                      :src="row.logo"
                      :alt="row.name"
                      size="xs"
                      referrerpolicy="no-referrer"
                      :ui="{ image: 'object-contain' }"
                    />
                    <span>{{ row.name }}</span>
                    <span class="text-xs font-normal text-muted">{{ row.typeLabel }}</span>
                  </NuxtLink>
                </td>
                <td
                  v-for="category in visibleCategories"
                  :key="category.key"
                  class="px-2 py-2 text-center"
                >
                  <UIcon
                    v-if="row.categories.has(category.key)"
                    name="i-lucide-check"
                    class="size-4 text-primary"
                    :aria-label="category.label"
                  />
                  <span v-else class="text-muted" aria-hidden="true">·</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile: cards with category badges -->
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
              <div class="mt-3 flex flex-wrap gap-1.5">
                <UBadge
                  v-for="category in ENTITY_CATEGORIES.filter((c) => row.categories.has(c.key))"
                  :key="category.key"
                  color="neutral"
                  variant="soft"
                  size="sm"
                >
                  {{ category.label }}
                </UBadge>
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </template>
    </template>
  </div>
</template>

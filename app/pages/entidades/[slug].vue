<script setup lang="ts">
import { ENTITY_TYPE_LABELS, getEntityBySlug, getEntityLogo, getEntityUrl } from '~/lib/entities'
import { ENTITY_CATEGORIES, type EntitiesResponse } from '~/lib/entities-products'
import { fitPageTitle } from '~/lib/seo-title'

const route = useRoute()
const entity = getEntityBySlug(String(route.params.slug))

if (!entity) {
  throw createError({ statusCode: 404, statusMessage: 'Entidad no encontrada', fatal: true })
}

const { trackProviderClick } = useAnalytics()

const { data, status, error, refresh } = await useFetch<EntitiesResponse>('/api/entidades.json', {
  key: 'entidades',
})

const logo = getEntityLogo(entity)
const providerUrl = getEntityUrl(entity)
const typeLabel = ENTITY_TYPE_LABELS[entity.type]
const heading = `${entity.name}: tasas y productos`

const categoryCards = computed(() => {
  const products = data.value?.entities.find((item) => item.slug === entity.slug)?.products ?? []
  return ENTITY_CATEGORIES.map((category) => ({
    ...category,
    products: products.filter((product) => product.category === category.key),
  })).filter((category) => category.products.length > 0)
})

function handleProviderClick() {
  if (!providerUrl) return
  trackProviderClick({
    providerName: entity!.name,
    providerUrl,
    section: 'entidades-detalle',
    contentType: 'button',
  })
}

const seoTitle = fitPageTitle(heading)
const seoDescription = `Cuentas, plazos fijos, fondos, comisiones, préstamos y más de ${entity.name} (${typeLabel.toLowerCase()}) en Argentina, con links a cada comparativa.`

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
})

useHead({
  link: [{ rel: 'canonical', href: `https://comparatasas.ar/entidades/${entity.slug}` }],
})
</script>

<template>
  <div v-if="entity" class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <NuxtLink
        to="/entidades"
        class="flex items-center gap-2 text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
      >
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span>Todas las entidades</span>
      </NuxtLink>

      <UButton
        v-if="providerUrl"
        :to="providerUrl"
        external
        target="_blank"
        rel="noopener noreferrer"
        color="primary"
        icon="i-lucide-external-link"
        :label="`Ir a ${entity.name}`"
        @click="handleProviderClick"
      />
    </div>

    <div class="flex flex-col items-center gap-3 text-center">
      <UAvatar
        :src="logo"
        :alt="entity.name"
        size="3xl"
        referrerpolicy="no-referrer"
        :ui="{ image: 'object-contain' }"
      />
      <h1 class="text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-white">
        {{ heading }}
      </h1>
      <UBadge color="neutral" variant="soft">{{ typeLabel }}</UBadge>
    </div>

    <UAlert
      v-if="error"
      color="error"
      title="No se pudieron cargar los productos"
      description="Reintentá en unos minutos."
      :actions="[{ label: 'Reintentar', onClick: () => refresh() }]"
    />

    <div v-else-if="status === 'pending' && !data" class="py-12 text-center text-neutral-500">
      Cargando productos…
    </div>

    <p v-else-if="categoryCards.length === 0" class="py-12 text-center text-neutral-500">
      Por ahora no hay productos de {{ entity.name }} en nuestras comparativas.
    </p>

    <div v-else class="grid gap-4">
      <UCard v-for="category in categoryCards" :key="category.key">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold text-highlighted">{{ category.label }}</h2>
            <UButton
              :to="category.to"
              size="sm"
              color="neutral"
              variant="ghost"
              trailing-icon="i-lucide-arrow-right"
              label="Ver comparativa"
            />
          </div>
        </template>

        <ul class="divide-y divide-default">
          <li
            v-for="product in category.products"
            :key="`${product.product}-${product.to}`"
            class="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
          >
            <NuxtLink
              v-if="product.to !== category.to"
              :to="product.to"
              class="min-w-0 text-sm hover:text-primary hover:underline"
            >
              {{ product.product }}
            </NuxtLink>
            <span v-else class="min-w-0 text-sm">{{ product.product }}</span>
            <span v-if="product.metric" class="shrink-0 text-sm font-medium text-highlighted">
              {{ product.metric }}
            </span>
          </li>
        </ul>
      </UCard>
    </div>

    <p v-if="data?.updatedAt" class="text-center text-xs text-muted">
      Fuente:
      <a
        href="https://argentinadatos.com/?utm_source=comparatasas&utm_medium=entidades&ref=comparatasas"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-primary-800 dark:text-primary-200"
      >
        ArgentinaDatos
      </a>
    </p>
  </div>
</template>

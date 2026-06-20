<script setup lang="ts">
import type { ProductScenario } from '~/types/product-scenarios'

const props = withDefaults(
  defineProps<{
    floating?: boolean
    minimizable?: boolean
    selectedProductId?: string
    subtitle?: string
    actionLabel?: string
    navigateOnSelect?: boolean
  }>(),
  {
    floating: false,
    minimizable: false,
    selectedProductId: undefined,
    subtitle: undefined,
    actionLabel: 'Cargar simulación',
    navigateOnSelect: false,
  },
)

const emit = defineEmits<{
  select: [product: ProductScenario]
  heightChange: [height: number]
}>()

const { productScenarios, showProductScenarios, isSamePriceInstallmentLabel } =
  useProductScenarios()
const route = useRoute()

const panelMode = ref<'expanded' | 'minimized'>('expanded')
const panelSurfaceRef = ref<HTMLElement | null>(null)
const panelHeight = ref(0)

const isExpanded = computed(() => !props.minimizable || panelMode.value === 'expanded')
const selectedProduct = computed(() => {
  return productScenarios.find((product) => product.id === props.selectedProductId) ?? null
})
const resolvedSubtitle = computed(() => {
  if (props.subtitle) return props.subtitle

  if (props.navigateOnSelect) {
    return 'Elegí un producto para verlo ya cargado en la página con la simulación.'
  }

  return 'Elegí un producto para cargar automáticamente la simulación.'
})
const stickyTop = computed(() => `calc(100svh - ${panelHeight.value + 12}px)`)

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

function updateMeasuredHeight() {
  if (!import.meta.client) return

  const nextHeight = panelSurfaceRef.value?.offsetHeight ?? 0
  panelHeight.value = nextHeight
  emit('heightChange', nextHeight)
}

function expandPanel() {
  panelMode.value = 'expanded'
}

function togglePanel() {
  if (!props.minimizable) return
  panelMode.value = panelMode.value === 'expanded' ? 'minimized' : 'expanded'
}

async function handleSelect(product: ProductScenario) {
  emit('select', product)

  if (!props.navigateOnSelect) return

  await navigateTo({
    path: '/contado-cuotas',
    query: {
      producto: product.id,
    },
  })
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateMeasuredHeight()

  resizeObserver = new ResizeObserver(() => {
    updateMeasuredHeight()
  })

  if (panelSurfaceRef.value) {
    resizeObserver.observe(panelSurfaceRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(isExpanded, async () => {
  await nextTick()
  resizeObserver?.disconnect()

  resizeObserver = new ResizeObserver(() => {
    updateMeasuredHeight()
  })

  if (panelSurfaceRef.value) {
    resizeObserver.observe(panelSurfaceRef.value)
  }

  updateMeasuredHeight()
})

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    updateMeasuredHeight()
  },
)
</script>

<template>
  <div
    v-if="showProductScenarios && productScenarios.length"
    :class="floating ? 'sticky z-40 h-0 px-3 pointer-events-none' : 'w-full'"
    :style="floating ? { top: stickyTop } : undefined"
  >
    <div :class="floating ? 'flex justify-center' : ''">
      <div
        v-if="isExpanded"
        ref="panelSurfaceRef"
        class="w-full rounded-3xl border border-neutral-200/80 bg-white/92 shadow-2xl dark:border-neutral-800/80 dark:bg-neutral-950/92"
        :class="[
          floating
            ? 'pointer-events-auto max-w-6xl p-3 backdrop-blur-xl'
            : 'overflow-hidden border-dashed px-4 py-4 sm:px-5',
        ]"
      >
        <div class="mb-3 flex items-center justify-between gap-3" :class="floating ? 'px-1' : ''">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-neutral-900 dark:text-white">
              Productos en oferta
            </p>
            <p class="truncate text-xs text-neutral-500">
              {{ resolvedSubtitle }}
            </p>
          </div>

          <UButton
            v-if="minimizable"
            icon="i-lucide-chevron-down"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Minimizar productos"
            @click="togglePanel"
          />
        </div>

        <div class="overflow-x-auto pb-1">
          <div class="flex min-w-max gap-3">
            <div
              v-for="product in productScenarios"
              :key="product.id"
              class="group flex w-[282px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-white text-left transition-shadow hover:shadow-lg dark:bg-neutral-900"
              :class="
                selectedProductId === product.id
                  ? 'border-primary-400 ring-2 ring-primary-300/60 dark:border-primary-500 dark:ring-primary-900/70'
                  : 'border-neutral-200 dark:border-neutral-800'
              "
            >
              <button
                type="button"
                class="flex flex-1 flex-col text-left"
                @click="handleSelect(product)"
              >
                <div
                  class="flex aspect-[16/9] items-center justify-center overflow-hidden bg-white dark:bg-white"
                >
                  <img
                    v-if="product.imageUrl"
                    :src="product.imageUrl"
                    :alt="product.name"
                    class="h-full w-full object-contain p-2"
                    loading="lazy"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-neutral-400 dark:text-neutral-500"
                  >
                    <UIcon name="i-lucide-image" class="size-10" />
                  </div>
                </div>

                <div class="flex flex-1 flex-col justify-between space-y-3 p-3">
                  <div class="space-y-1">
                    <p class="line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-white">
                      {{ product.name }}
                    </p>
                    <p v-if="product.merchant" class="text-xs text-neutral-500">
                      {{ product.merchant }}
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-1.5">
                    <UBadge color="neutral" variant="outline" size="sm">
                      {{ product.priceLabel || currencyFormatter.format(product.cashPrice) }}
                    </UBadge>
                    <UBadge
                      :color="
                        isSamePriceInstallmentLabel(product.installmentLabel)
                          ? 'success'
                          : 'neutral'
                      "
                      :variant="
                        isSamePriceInstallmentLabel(product.installmentLabel) ? 'soft' : 'outline'
                      "
                      size="sm"
                    >
                      {{ product.installmentLabel || `${product.installmentCount} cuotas` }}
                    </UBadge>
                  </div>
                </div>
              </button>

              <div
                class="grid grid-cols-2 gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
              >
                <UButton
                  color="primary"
                  variant="soft"
                  size="sm"
                  block
                  class="justify-center"
                  @click="handleSelect(product)"
                >
                  {{ actionLabel }}
                </UButton>

                <UButton
                  :to="product.affiliateUrl"
                  external
                  target="_blank"
                  rel="noopener noreferrer"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  block
                  class="justify-center"
                  icon="i-lucide-arrow-up-right"
                >
                  Ver producto
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else ref="panelSurfaceRef" class="pointer-events-auto">
        <button
          type="button"
          class="flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/92 px-4 py-2 text-sm font-medium text-neutral-900 shadow-xl backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/92 dark:text-white"
          @click="expandPanel"
        >
          <UIcon
            name="i-lucide-shopping-bag"
            class="size-4 text-primary-600 dark:text-primary-400"
          />
          <span>Ver productos</span>
          <UBadge v-if="selectedProduct" color="primary" variant="soft" size="sm">
            {{ selectedProduct.name }}
          </UBadge>
        </button>
      </div>
    </div>
  </div>
</template>

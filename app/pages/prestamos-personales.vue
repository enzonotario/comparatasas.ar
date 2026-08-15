<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { useRouteQuery } from '@vueuse/router'
import { ogUpdatedAtDate } from '~/utils/og-data'

type PrestamosTab = 'plazo' | 'bcra'

definePageMeta({
  pageTitle: 'Préstamos Personales',
  pageDescription:
    'Compará TNA, TEA y CFT TEA de préstamos personales con tasas por plazo (Bancor, BBVA, BNA, Chubut, Ciudad, Galicia, Hipotecario, Macro, Patagonia, Santander)',
})

const { prestamosPersonales, loading, error } = usePrestamosPersonales()
const {
  prestamosPersonalesBcra,
  loading: loadingBcra,
  error: errorBcra,
} = usePrestamosPersonalesBcra()

const {
  monto,
  plazo,
  ingresos,
  aumentoSalarial,
  frecuenciaAumento,
  sinAumento,
  clienteFilter,
  condicionesSeleccionadas,
  condicionesDisponibles,
  prestamosParaLista,
  ofertaSeleccionada,
  activeOfertaKey,
  selectOferta,
  isSimulating,
  isOpen,
  openSimulator,
  minimizeSimulator,
  closeSimulator,
} = usePrestamosPersonalesSimulator(prestamosPersonales)

const {
  remInflacionAnualPercent,
  remProximos12Meses,
  informeDate: remInformeDate,
  loading: loadingRem,
} = useInflacionREM()

function formatRemInforme(value: string | null): string {
  if (!value) return ''
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return value
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1))
}

const remInformeLabel = computed(() => formatRemInforme(remInformeDate.value))

type PrestamosBcraVista = 'lista' | 'tabla'

const tabQuery = useRouteQuery<PrestamosTab | undefined>('tab', undefined)
const vistaBcraQuery = useRouteQuery<PrestamosBcraVista>('vista', 'lista')

const vistaBcra = computed<PrestamosBcraVista>({
  get: () => (vistaBcraQuery.value === 'tabla' ? 'tabla' : 'lista'),
  set: (value) => {
    vistaBcraQuery.value = value
  },
})

const selectedTab = computed<PrestamosTab>({
  get: () => {
    const value = tabQuery.value
    // Compat: ?tab=ranking redirige al tab por plazo
    if (value === 'bcra') return 'bcra'
    return 'plazo'
  },
  set: (value) => {
    tabQuery.value = value === 'plazo' ? undefined : value
  },
})

const prestamosTabs = computed<TabsItem[]>(() => [
  {
    label: 'Por plazo',
    icon: 'i-lucide-calendar-range',
    value: 'plazo',
    slot: 'plazo',
    badge: prestamosPersonales.value.length || undefined,
  },
  {
    label: 'Techos BCRA',
    icon: 'i-lucide-shield',
    value: 'bcra',
    slot: 'bcra',
    badge: prestamosPersonalesBcra.value.length || undefined,
  },
])

const { data: ogItems } = await useAsyncData('og-prestamos-personales', async () => {
  const response = await $fetch<
    Array<{ nombreComercial: string; producto: string; cftTea: number | null; tna: number | null }>
  >('https://api.argentinadatos.com/v1/finanzas/creditos/prestamosPersonales/')

  return [...response]
    .sort((a, b) => {
      const ka = a.cftTea ?? a.tna ?? Number.POSITIVE_INFINITY
      const kb = b.cftTea ?? b.tna ?? Number.POSITIVE_INFINITY
      return ka - kb
    })
    .slice(0, 3)
    .map((item) => ({
      name: `${item.nombreComercial} · ${item.producto}`,
      rate: `${((item.cftTea ?? item.tna ?? 0) * 100).toFixed(1)}% CFT`,
    }))
})

defineOgImage('ComparaTasas.takumi', {
  title: 'Mejores préstamos personales',
  items: ogItems.value ?? [],
  updatedAt: ogUpdatedAtDate(),
})

useSeoMeta({
  title: 'Préstamos Personales',
  description:
    'Compará tasas de préstamos personales en Argentina con tablas por plazo: TNA, TEA y CFT TEA de Bancor, BBVA, BNA, Chubut, Ciudad, Galicia, Hipotecario, Macro, Patagonia y Santander.',
  ogTitle: 'Préstamos Personales - Compara Tasas Argentina',
  ogDescription: 'Compará préstamos personales por CFT TEA con tasas por tramo de plazo.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/prestamos-personales' },
    {
      rel: 'alternate',
      hreflang: 'es-AR',
      href: 'https://comparatasas.ar/prestamos-personales',
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: 'https://comparatasas.ar/prestamos-personales',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Préstamos Personales - Compara Tasas',
        description: 'Comparativa de préstamos personales en Argentina por CFT TEA.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
})
</script>

<template>
  <div class="space-y-6">
    <div
      class="w-full mx-auto"
      :class="selectedTab === 'plazo' && isSimulating && isOpen ? 'max-w-6xl' : 'max-w-3xl'"
    >
      <UTabs
        v-model="selectedTab"
        :items="prestamosTabs"
        variant="link"
        class="w-full"
        :ui="{
          list: 'flex-nowrap overflow-x-auto overflow-y-hidden',
          indicator: 'hidden',
          trigger: 'whitespace-nowrap shrink-0',
        }"
      >
        <template #plazo>
          <div class="mt-4 flex flex-col space-y-4 w-full">
            <UAlert
              v-if="error"
              color="error"
              variant="soft"
              title="No se pudieron cargar los préstamos personales"
              description="Probá de nuevo en unos minutos. Los datos se actualizan desde las landings de los bancos."
            />

            <div v-if="loading && !prestamosPersonales.length" class="py-8">
              <FundsLoading />
            </div>

            <template v-else-if="prestamosPersonales.length > 0">
              <div class="flex flex-col min-w-0">
                <h2 class="text-xl font-bold">Tasas por plazo</h2>
                <p class="text-sm text-muted">
                  <template v-if="isSimulating">
                    Simulá cuota y total con sistema francés. Ordenado por menor cuota estimada (CFT
                    si está disponible).
                  </template>
                  <template v-else>
                    Tasas publicadas por tramo de plazo, ordenadas de menor a mayor CFT TEA. Abrí el
                    simulador para estimar cuotas.
                  </template>
                </p>
              </div>

              <PrestamosPersonalesSimulator
                v-model:monto="monto"
                v-model:plazo="plazo"
                v-model:ingresos="ingresos"
                v-model:aumento-salarial="aumentoSalarial"
                v-model:frecuencia-aumento="frecuenciaAumento"
                v-model:sin-aumento="sinAumento"
                v-model:cliente-filter="clienteFilter"
                v-model:condiciones-seleccionadas="condicionesSeleccionadas"
                :is-open="isOpen"
                :is-simulating="isSimulating"
                :condiciones-disponibles="condicionesDisponibles"
                :oferta-seleccionada="ofertaSeleccionada"
                :rem-inflacion-anual-percent="remInflacionAnualPercent"
                :rem-informe-label="remInformeLabel"
                :rem-publicacion-url="remProximos12Meses?.publicacionUrl"
                :rem-loading="loadingRem"
                @open="openSimulator"
                @minimize="minimizeSimulator"
                @close="closeSimulator"
                @update:is-open="isOpen = $event"
              >
                <template v-if="isSimulating && isOpen" #lista>
                  <p class="text-xs text-muted">
                    Mostrando {{ prestamosParaLista.length }} de {{ prestamosPersonales.length }}
                    ofertas · clic para elegir
                  </p>
                  <PrestamosPersonalesList
                    v-if="prestamosParaLista.length"
                    :prestamos="prestamosParaLista"
                    :plazo="plazo"
                    :show-simulation="isSimulating"
                    selectable
                    :selected-key="activeOfertaKey"
                    @select="selectOferta"
                  />
                  <div v-else class="py-8 text-center text-muted text-sm">
                    Ninguna oferta coincide con los filtros de condiciones.
                  </div>
                </template>
              </PrestamosPersonalesSimulator>

              <template v-if="!(isSimulating && isOpen)">
                <p v-if="isSimulating" class="text-xs text-muted max-w-3xl">
                  Mostrando {{ prestamosParaLista.length }} de {{ prestamosPersonales.length }}
                  ofertas
                </p>

                <div class="w-full">
                  <PrestamosPersonalesList
                    v-if="prestamosParaLista.length"
                    :prestamos="prestamosParaLista"
                    :plazo="plazo"
                    :show-simulation="isSimulating"
                    :selectable="isSimulating"
                    :selected-key="activeOfertaKey"
                    @select="selectOferta"
                  />
                  <div v-else class="py-8 text-center text-muted text-sm">
                    Ninguna oferta coincide con los filtros de condiciones.
                  </div>
                </div>
              </template>
            </template>

            <div v-else-if="!loading" class="py-12 text-center text-muted">
              No se encontraron préstamos personales
            </div>
          </div>
        </template>

        <template #bcra>
          <div class="mt-4 flex flex-col space-y-4 w-full">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex flex-col min-w-0 gap-1">
                <h2 class="text-xl font-bold">Techos máximos BCRA</h2>
                <p class="text-sm text-muted">
                  TEA y CFT máximos informados al BCRA (no son las tasas publicitadas por plazo).
                  Mostramos entidades conocidas y las variantes más generales / con menor techo.
                </p>
              </div>

              <UFieldGroup size="sm" class="shrink-0">
                <UButton
                  label="Lista"
                  icon="i-lucide-layout-list"
                  :color="vistaBcra === 'lista' ? 'primary' : 'neutral'"
                  :variant="vistaBcra === 'lista' ? 'solid' : 'outline'"
                  @click="vistaBcra = 'lista'"
                />
                <UButton
                  label="Tabla"
                  icon="i-lucide-table"
                  :color="vistaBcra === 'tabla' ? 'primary' : 'neutral'"
                  :variant="vistaBcra === 'tabla' ? 'solid' : 'outline'"
                  @click="vistaBcra = 'tabla'"
                />
              </UFieldGroup>
            </div>

            <UAlert
              v-if="errorBcra"
              color="warning"
              variant="soft"
              title="No se pudieron cargar los techos BCRA"
              description="Los datos vienen del CSV oficial PERSONALES. Probá de nuevo más tarde."
            />

            <div v-else-if="loadingBcra && !prestamosPersonalesBcra.length" class="py-4">
              <FundsLoading />
            </div>

            <template v-else-if="prestamosPersonalesBcra.length">
              <PrestamosPersonalesBcraList
                v-if="vistaBcra === 'lista'"
                :prestamos="prestamosPersonalesBcra"
              />
              <div v-else class="w-full overflow-x-auto">
                <PrestamosPersonalesBcraTable :prestamos="prestamosPersonalesBcra" />
              </div>
            </template>

            <div v-else-if="!loadingBcra" class="py-12 text-center text-muted">
              No se encontraron techos BCRA para mostrar
            </div>

            <p class="text-xs text-muted">
              Fuente:
              <a
                href="https://www.bcra.gob.ar/archivos/Pdfs/BCRAyVos/PERSONALES.CSV"
                target="_blank"
                rel="noopener noreferrer"
                class="underline underline-offset-2"
              >
                BCRA — PERSONALES.CSV
              </a>
              . Son techos regulatorios; las tasas por plazo vienen de las landings de cada banco.
            </p>
          </div>
        </template>
      </UTabs>
    </div>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto">
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            ¿Qué mirar en un préstamo personal?
          </h3>
          <p>
            La <strong>TNA</strong> es la tasa nominal de interés. La <strong>TEA</strong> anualiza
            el interés efectivo. El <strong>CFT TEA</strong> (o CFTEA) incluye intereses, IVA y
            cargos asociados: es la mejor métrica para comparar el costo real entre bancos.
          </p>
          <p>
            El simulador estima la cuota con sistema francés sobre la TNA y una referencia con CFT
            TEA, usando la tasa del tramo de plazo publicado por el banco (Bancor, BBVA, BNA,
            Chubut, Ciudad, Galicia, Hipotecario, Macro, Patagonia y Santander). Si cargás ingresos
            (opcional), muestra la relación cuota/ingreso y una proyección con aumentos salariales o
            escenario de estrés. Algunas ofertas exigen ser cliente. Las tasas son de referencia y
            están sujetas a aprobación crediticia.
          </p>
          <p>
            Los <strong>techos BCRA</strong> son máximos regulatorios por producto/entidad: sirven
            de referencia de tope, no para rankear contra las tasas de landings.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

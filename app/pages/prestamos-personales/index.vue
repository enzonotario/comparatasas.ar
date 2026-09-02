<script setup lang="ts">
import { ogUpdatedAtDate } from '~/utils/og-data'

definePageMeta({
  pageTitle: 'Préstamos Personales',
  pageDescription:
    'Compará TNA, TEA y CFT TEA de préstamos personales con tasas por plazo en Argentina.',
})

const { prestamosPersonales, loading, error } = usePrestamosPersonales()
const { prestamosPersonalesBcra } = usePrestamosPersonalesBcra()

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
    'Compará tasas de préstamos personales en Argentina con tablas por plazo: TNA, TEA y CFT TEA.',
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
      innerHTML: JSON.stringify({
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
    <div class="w-full mx-auto" :class="isSimulating && isOpen ? 'max-w-6xl' : 'max-w-3xl'">
      <PrestamosPersonalesNavTabs
        :plazo-count="prestamosPersonales.length || undefined"
        :bcra-count="prestamosPersonalesBcra.length || undefined"
      />

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
                Simulá cuota y total con sistema francés. Ordenado por menor cuota estimada (CFT si
                está disponible).
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
              Mostrando {{ prestamosParaLista.length }} de {{ prestamosPersonales.length }} ofertas
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
    </div>

    <PrestamosPersonalesSeoFooter />
  </div>
</template>

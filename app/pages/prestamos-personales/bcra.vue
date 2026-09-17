<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'

type PrestamosBcraVista = 'lista' | 'tabla'

definePageMeta({
  pageTitle: 'Techos BCRA — Préstamos Personales',
  pageDescription:
    'Techos máximos TEA y CFT de préstamos personales informados al BCRA por entidad y producto.',
})

const { prestamosPersonales } = usePrestamosPersonales()
const {
  prestamosPersonalesBcra,
  loading: loadingBcra,
  error: errorBcra,
} = usePrestamosPersonalesBcra()

const vistaBcraQuery = useRouteQuery<PrestamosBcraVista>('vista', 'lista')

const vistaBcra = computed<PrestamosBcraVista>({
  get: () => (vistaBcraQuery.value === 'tabla' ? 'tabla' : 'lista'),
  set: (value) => {
    vistaBcraQuery.value = value
  },
})

useSeoMeta({
  title: 'Techos BCRA — Préstamos Personales',
  description:
    'Consultá los techos máximos TEA y CFT de préstamos personales informados al BCRA. Referencia regulatoria por entidad y producto en Argentina.',
  ogTitle: 'Techos BCRA Préstamos Personales - Compara Tasas',
  ogDescription:
    'Techos regulatorios de préstamos personales (TEA/CFT) informados al BCRA por banco y producto.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/prestamos-personales/bcra' },
    {
      rel: 'alternate',
      hreflang: 'es-AR',
      href: 'https://comparatasas.ar/prestamos-personales/bcra',
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: 'https://comparatasas.ar/prestamos-personales/bcra',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Techos BCRA — Préstamos Personales - Compara Tasas',
        description:
          'Techos máximos regulatorios de préstamos personales informados al BCRA en Argentina.',
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
    <div class="w-full mx-auto max-w-3xl">
      <PrestamosPersonalesNavTabs
        :plazo-count="prestamosPersonales.length || undefined"
        :bcra-count="prestamosPersonalesBcra.length || undefined"
      />

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
            href="https://www.bcra.gob.ar/archivos/Pdfs/BCRAyVos/PERSONALES.CSV?utm_source=comparatasas&utm_medium=prestamos-personales&ref=comparatasas"
            target="_blank"
            rel="noopener noreferrer"
            class="underline underline-offset-2"
          >
            BCRA — PERSONALES.CSV
          </a>
          . Son techos regulatorios; las tasas por plazo vienen de las landings de cada banco.
        </p>
      </div>
    </div>

    <PrestamosPersonalesSeoFooter />
  </div>
</template>

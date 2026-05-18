<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

type EndpointTab =
  | 'plazos-fijos'
  | 'fondos-comunes'
  | 'cuentas-billeteras'
  | 'criptopesos'
  | 'criptomonedas'
  | 'remesas'

definePageMeta({
  pageTitle: 'Integrar tu servicio',
  pageDescription:
    'El listado en ComparaTasas.ar es gratuito. Integrá tu app o servicio de tasas proveyendo un endpoint con tus datos.',
})

useSeoMeta({
  title: 'Integrar tu servicio',
  description:
    'Integrá tu servicio de tasas en Compara Tasas. Listado gratuito para proveedores de tasas de interés y entidades financieras.',
  ogTitle: 'Integrar tu servicio - ComparaTasas.ar',
  ogDescription:
    'Integrá tu servicio de tasas en Compara Tasas. Listado gratuito para proveedores de tasas de interés y entidades financieras.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/sumarse' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/sumarse' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/sumarse' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Integrar tu servicio - Compara Tasas',
        description: 'Sumá tu entidad financiera o servicio de tasas a Compara Tasas.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
})

const endpointTabs: TabsItem[] = [
  {
    label: 'Plazos Fijos',
    value: 'plazos-fijos',
    slot: 'plazos-fijos' as const,
  },
  {
    label: 'Fondos Comunes',
    value: 'fondos-comunes',
    slot: 'fondos-comunes' as const,
  },
  {
    label: 'Cuentas y Billeteras',
    value: 'cuentas-billeteras',
    slot: 'cuentas-billeteras' as const,
  },
  {
    label: 'Criptopesos',
    value: 'criptopesos',
    slot: 'criptopesos' as const,
  },
  {
    label: 'Criptomonedas',
    value: 'criptomonedas',
    slot: 'criptomonedas' as const,
  },
  {
    label: 'Remesas',
    value: 'remesas',
    slot: 'remesas' as const,
  },
]

const validEndpointTabs = new Set<EndpointTab>([
  'plazos-fijos',
  'fondos-comunes',
  'cuentas-billeteras',
  'criptopesos',
  'criptomonedas',
  'remesas',
])

const endpointTabQuery = useRouteQuery<EndpointTab>('tab', 'plazos-fijos')

const selectedEndpointTab = computed<EndpointTab>({
  get: () =>
    validEndpointTabs.has(endpointTabQuery.value as EndpointTab)
      ? (endpointTabQuery.value as EndpointTab)
      : 'plazos-fijos',
  set: (value) => {
    endpointTabQuery.value = value
  },
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <div class="flex items-center gap-4 mb-8">
      <UButton to="/" icon="i-heroicons-arrow-left" variant="ghost" color="neutral" size="lg">
        Volver
      </UButton>
    </div>

    <div class="space-y-8">
      <UCard>
        <template #header>
          <h2 class="text-2xl font-semibold">Requisitos</h2>
        </template>
        <ul class="space-y-3 list-disc list-inside text-zinc-700 dark:text-zinc-300">
          <li>Nombre de tu app o servicio</li>
          <li>Endpoint con tasas de interés</li>
          <li>Isologo cuadrado (SVG o PNG)</li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-2xl font-semibold">Especificación del endpoint</h2>
        </template>
        <div class="space-y-4">
          <p class="text-zinc-700 dark:text-zinc-300">
            El formato es flexible. A continuación se muestran ejemplos de los endpoints actuales
            que utilizamos para obtener las tasas de interés:
          </p>

          <UTabs
            v-model="selectedEndpointTab"
            :items="endpointTabs"
            variant="link"
            class="w-full"
            :ui="{
              list: 'flex-nowrap overflow-x-auto overflow-y-hidden',
              indicator: 'hidden',
              trigger: 'whitespace-nowrap shrink-0',
            }"
          >
            <template #plazos-fijos>
              <div class="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 overflow-x-auto mt-4">
                <pre class="text-sm text-zinc-100"><code>[
  {
    "entidad": "BANCO XYZ",
    "tnaClientes": 0.45,
    "tnaNoClientes": 0.40,
    "fecha": "2024-01-15",
    "enlace": "https://www.bna.com.ar/",
    "logo": "https://..."
  }
]</code></pre>
              </div>
            </template>

            <template #fondos-comunes>
              <div class="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 overflow-x-auto mt-4">
                <pre class="text-sm text-zinc-100"><code>[
  {
    "fondo": "FCI ABC",
    "horizonte": "30 días",
    "fecha": "2024-01-15",
    "vcp": 1234.56,
    "ccp": 1230.45,
    "patrimonio": 1000000
  }
]</code></pre>
              </div>
            </template>

            <template #cuentas-billeteras>
              <div class="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 overflow-x-auto mt-4">
                <pre class="text-sm text-zinc-100"><code>[
  {
    "fondo": "ABC",
    "tna": 0.35,
    "tope": 1000000,
    "fecha": "2024-01-15",
    "condiciones": "Solo Clientes XYZ",
    "condicionesCorto": "Solo Clientes XYZ"
  }
]</code></pre>
              </div>
            </template>

            <template #criptopesos>
              <div class="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 overflow-x-auto mt-4">
                <pre class="text-sm text-zinc-100"><code>[
  {
    "token": "USDT",
    "entidad": "ABC",
    "tna": 0.25
  }
]</code></pre>
              </div>
            </template>

            <template #criptomonedas>
              <div class="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 overflow-x-auto mt-4">
                <pre class="text-sm text-zinc-100"><code>[
  {
    "entidad": "ABC",
    "rendimientos": [
      {
        "moneda": "USDT",
        "apy": 0.12
      },
      {
        "moneda": "USDC",
        "apy": 0.10
      }
    ]
  }
]</code></pre>
              </div>
            </template>

            <template #remesas>
              <div class="space-y-4 mt-4">
                <div class="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 overflow-x-auto">
                  <pre class="text-sm text-zinc-100"><code>[
  {
    "compania": "Proveedor XYZ",
    "cuentaPropia": true,
    "moneda": "FIAT",
    "inversiones": true,
    "tarjetaUsa": false,
    "costoRecibirPagos": "0%",
    "costoMantenimientoTarjeta": "0 USD",
    "costoTarjeta": "0%",
    "retiroArs": "0%",
    "detalles": {
      "cuentaPropia": "CBU propio a nombre del usuario",
      "moneda": "También permite saldo en USD",
      "inversiones": "Solo para residentes en Argentina",
      "costoRecibirPagos": "Sin costo vía ACH",
      "retiroArs": "Puede variar según banco o método"
    }
  }
]</code></pre>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div class="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <h3 class="font-semibold text-zinc-900 dark:text-white mb-2">
                      Campos esperados
                    </h3>
                    <ul class="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <li><code>compania</code>: nombre del proveedor</li>
                      <li>
                        <code>cuentaPropia</code>, <code>inversiones</code>,
                        <code>tarjetaUsa</code>: booleanos
                      </li>
                      <li>
                        <code>moneda</code>: texto, por ejemplo <code>FIAT</code> o
                        <code>CRIPTO</code>
                      </li>
                      <li>
                        <code>costoRecibirPagos</code>, <code>costoMantenimientoTarjeta</code>,
                        <code>costoTarjeta</code>, <code>retiroArs</code>: texto libre
                      </li>
                    </ul>
                  </div>

                  <div class="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                    <h3 class="font-semibold text-zinc-900 dark:text-white mb-2">
                      Detalles opcionales
                    </h3>
                    <p class="text-sm text-zinc-600 dark:text-zinc-400">
                      Podés enviar un objeto <code>detalles</code> con aclaraciones por columna. Hoy
                      se contemplan detalles para:
                    </p>
                    <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <code>cuentaPropia</code>, <code>moneda</code>, <code>inversiones</code>,
                      <code>tarjetaUsa</code>, <code>costoRecibirPagos</code>,
                      <code>costoMantenimientoTarjeta</code>, <code>costoTarjeta</code>,
                      <code>retiroArs</code>.
                    </p>
                  </div>
                </div>
              </div>
            </template>
          </UTabs>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-2xl font-semibold">Detalles de integración</h2>
        </template>
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="font-semibold text-zinc-900 dark:text-white mb-1">
                Frecuencia de polling
              </div>
              <div class="text-zinc-600 dark:text-zinc-400">5 minutos</div>
            </div>
            <div>
              <div class="font-semibold text-zinc-900 dark:text-white mb-1">Timeout de polling</div>
              <div class="text-zinc-600 dark:text-zinc-400">15 segundos</div>
            </div>
            <div>
              <div class="font-semibold text-zinc-900 dark:text-white mb-1">Autenticación</div>
              <div class="text-zinc-600 dark:text-zinc-400">Headers custom (opcional)</div>
            </div>
            <div>
              <div class="font-semibold text-zinc-900 dark:text-white mb-1">IPs de origen</div>
              <div class="text-zinc-600 dark:text-zinc-400">GitHub/CloudFlare IPs</div>
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-2xl font-semibold">Solicitar integración</h2>
        </template>
        <div class="space-y-4">
          <p class="text-zinc-700 dark:text-zinc-300">
            Enviá un email con el nombre de tu app, la URL del endpoint y un logo cuadrado (SVG o
            PNG).
          </p>
          <UButton
            :to="`mailto:hi@enzonotario.me?subject=Solicitud de integración - ComparaTasas.ar&body=Hola,%0D%0A%0D%0AQuiero integrar mi servicio en ComparaTasas.ar.%0D%0A%0D%0ANombre de la app:%0D%0AEndpoint:%0D%0ALogo: (adjuntar archivo)%0D%0A%0D%0ASaludos`"
            icon="i-heroicons-envelope"
            size="lg"
            color="primary"
            rel="nofollow"
            external
          >
            hi@enzonotario.me
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

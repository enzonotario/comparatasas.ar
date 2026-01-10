<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

useSeoMeta({
  title: 'Integrar tu servicio - ComparaTasas.ar',
  description:
    'Integrá tu servicio de tasas en ComparaTasas.ar. Listado gratuito para proveedores de tasas de interés.',
  ogTitle: 'Integrar tu servicio - ComparaTasas.ar',
  ogDescription:
    'Integrá tu servicio de tasas en ComparaTasas.ar. Listado gratuito para proveedores de tasas de interés.',
})

const endpointTabs: TabsItem[] = [
  {
    label: 'Plazos Fijos',
    slot: 'plazos-fijos' as const,
  },
  {
    label: 'Fondos Comunes',
    slot: 'fondos-comunes' as const,
  },
  {
    label: 'Cuentas y Billeteras',
    slot: 'cuentas-billeteras' as const,
  },
  {
    label: 'Criptopesos',
    slot: 'criptopesos' as const,
  },
  {
    label: 'Criptomonedas',
    slot: 'criptomonedas' as const,
  },
]
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <div class="flex items-center gap-4 mb-8">
      <UButton to="/" icon="i-heroicons-arrow-left" variant="ghost" color="neutral" size="lg">
        Volver
      </UButton>
    </div>

    <div class="space-y-8">
      <div>
        <h1 class="text-4xl font-bold mb-4">Integrar tu servicio</h1>
        <p class="text-lg text-zinc-600 dark:text-zinc-400">
          El listado en ComparaTasas.ar es gratuito. Para integrar tu app o servicio de tasas, solo
          necesitás proveer un endpoint con las tasas de interés.
        </p>
      </div>

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

          <UTabs :items="endpointTabs" variant="link" class="w-full">
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
          >
            hi@enzonotario.me
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

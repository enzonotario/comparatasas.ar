<template>
  <div class="mx-auto max-w-4xl space-y-8">
    <div class="mb-8 flex items-center gap-4">
      <UButton to="/" icon="i-heroicons-arrow-left" variant="ghost" color="neutral" size="lg">
        Volver
      </UButton>
    </div>

    <div class="space-y-8">
      <UCard>
        <template #header>
          <h2 class="text-2xl font-semibold">Requisitos</h2>
        </template>
        <ul class="list-inside list-disc space-y-3 text-zinc-700 dark:text-zinc-300">
          <li>Nombre de tu app o servicio</li>
          <li>Endpoint con tasas / datos del producto</li>
          <li>Isologo cuadrado (SVG o PNG)</li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-2xl font-semibold">Especificación del endpoint</h2>
        </template>
        <div class="space-y-4">
          <p class="text-zinc-700 dark:text-zinc-300">
            El formato es flexible. Abajo están ejemplos alineados a los schemas que hoy consume
            Compara Tasas para cada sección:
          </p>

          <SumarseNavTabs />
          <slot />
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-2xl font-semibold">Detalles de integración</h2>
        </template>
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div class="mb-1 font-semibold text-zinc-900 dark:text-white">
                Frecuencia de polling
              </div>
              <div class="text-zinc-600 dark:text-zinc-400">5 minutos</div>
            </div>
            <div>
              <div class="mb-1 font-semibold text-zinc-900 dark:text-white">Timeout de polling</div>
              <div class="text-zinc-600 dark:text-zinc-400">15 segundos</div>
            </div>
            <div>
              <div class="mb-1 font-semibold text-zinc-900 dark:text-white">Autenticación</div>
              <div class="text-zinc-600 dark:text-zinc-400">Headers custom (opcional)</div>
            </div>
            <div>
              <div class="mb-1 font-semibold text-zinc-900 dark:text-white">IPs de origen</div>
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
            Enviá un email con el nombre de tu app, la URL del endpoint, la sección a la que aplica
            (plazos fijos, préstamos, comisiones, etc.) y un logo cuadrado (SVG o PNG).
          </p>
          <UButton
            :to="`mailto:hi@enzonotario.me?subject=Solicitud de integración - ComparaTasas.ar&body=Hola,%0D%0A%0D%0AQuiero integrar mi servicio en ComparaTasas.ar.%0D%0A%0D%0ANombre de la app:%0D%0ASección:%0D%0AEndpoint:%0D%0ALogo: (adjuntar archivo)%0D%0A%0D%0ASaludos`"
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

<script setup lang="ts">
import type { EndpointSpec } from '~/lib/sumarse-endpoints'

defineProps<{
  spec: EndpointSpec
}>()
</script>

<template>
  <div class="mt-4 space-y-4">
    <p class="text-sm text-zinc-600 dark:text-zinc-400">
      {{ spec.description }}
    </p>

    <div class="overflow-x-auto rounded-lg bg-zinc-900 p-4 dark:bg-zinc-950">
      <pre class="text-sm text-zinc-100"><code>{{ spec.example }}</code></pre>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 class="mb-2 font-semibold text-zinc-900 dark:text-white">Campos esperados</h3>
        <ul class="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li v-for="field in spec.fields" :key="field.name">
            <code>{{ field.name }}</code
            >: {{ field.description }}
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 class="mb-2 font-semibold text-zinc-900 dark:text-white">Notas</h3>
        <ul v-if="spec.notes?.length" class="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li v-for="(note, index) in spec.notes" :key="index">
            {{ note }}
          </li>
        </ul>
        <p v-else class="text-sm text-zinc-600 dark:text-zinc-400">
          Si algún campo no aplica, enviá <code>null</code> o omitilo. Preferimos JSON estable y
          fechas en <code>YYYY-MM-DD</code>.
        </p>
      </div>
    </div>
  </div>
</template>

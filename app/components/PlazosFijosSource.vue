<script setup lang="ts">
defineProps<{
  /** Valor de utm_medium para el link de la fuente. */
  medium: string
}>()
</script>

<template>
  <div class="shrink-0 text-xs text-muted sm:text-right">
    Fuente:
    <a
      :href="`https://argentinadatos.com/?utm_source=comparatasas&utm_medium=${medium}&ref=comparatasas`"
      target="_blank"
      rel="noopener noreferrer"
      class="font-medium text-primary-800 dark:text-primary-200"
    >
      ArgentinaDatos
    </a>
  </div>
</template>

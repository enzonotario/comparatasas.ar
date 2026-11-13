<script setup lang="ts">
/**
 * Tooltip para encabezados de tabla cortos o abreviados.
 *
 * Uso: `<TableHeaderTooltip text="Tasa efectiva mensual">TEM</TableHeaderTooltip>`
 * Muestra el nombre completo de la columna al pasar el mouse, sin cambiar el
 * label visible.
 */
defineProps<{
  /** Nombre completo de la columna. */
  text: string
}>()
</script>

<template>
  <UTooltip :text="text">
    <span class="inline-flex items-center">
      <slot />
    </span>
  </UTooltip>
</template>

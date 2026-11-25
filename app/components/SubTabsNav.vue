<script setup lang="ts">
defineProps<{
  ariaLabel: string
  /** Clases extra para el contenedor scrolleable de tabs (p. ej. alineación). */
  innerClass?: string
}>()
</script>

<template>
  <!--
    Barra de sub-tabs estilo npmx: una línea que cruza todo el ancho de la pantalla
    (pseudo-elemento con w-screen) y la tab activa la tapa con su borde inferior.
  -->
  <nav
    :aria-label="ariaLabel"
    class="relative after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-screen after:-translate-x-1/2 after:bg-neutral-200 dark:after:bg-neutral-800"
  >
    <div class="relative z-10 flex h-10 flex-row overflow-x-auto" :class="innerClass">
      <slot />
    </div>
  </nav>
</template>

<script setup lang="ts">
import FciFundDetailView from '~/components/funds/detail/FciFundDetailView.vue'

definePageMeta({
  layout: 'fondos',
  pageTitle: 'Histórico de FCI',
  pageDescription: 'Evolución histórica de rendimientos de un fondo común de inversión.',
})
</script>

<template>
  <FciFundDetailView tab="historico" />
</template>

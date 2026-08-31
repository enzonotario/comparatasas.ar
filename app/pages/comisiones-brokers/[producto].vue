<script setup lang="ts">
import {
  COMISIONES_BROKERS_DEFAULT_PRODUCTO,
  getComisionesBrokersProductoLabel,
  isValidComisionesBrokersProducto,
} from '~/lib/comisiones-brokers-nav'

definePageMeta({
  pageTitle: 'Comisiones de brokers',
  pageDescription:
    'Compará comisiones de IOL, Balanz, Bull Market, Cocos, PPI, Fiwind e IEB+ por producto: acciones, CEDEARs, bonos, cauciones, letras y más.',
})

const route = useRoute()
const producto = route.params.producto as string

if (
  producto === COMISIONES_BROKERS_DEFAULT_PRODUCTO ||
  !isValidComisionesBrokersProducto(producto)
) {
  await navigateTo('/comisiones-brokers', { redirectCode: 301, replace: true })
}

const productoLabel = getComisionesBrokersProductoLabel(producto)
route.meta.pageTitle = `Comisiones de brokers — ${productoLabel}`
route.meta.pageDescription = `Compará comisiones de ALyC para ${productoLabel.toLowerCase()} en ARS y USD. Incluye planes IOL, IEB+ y tarifarios retail de ArgentinaDatos.`
</script>

<template>
  <ComisionesBrokersView :producto="producto" />
</template>

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/mercado-dinero-ars' || to.path === '/mercado-dinero-ars/') {
    return navigateTo('/cuentas-billeteras#rendimiento-variable', {
      redirectCode: 301,
      replace: true,
    })
  }
})

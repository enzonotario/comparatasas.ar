<script setup lang="ts">
import { isCrypto } from '~/lib/crypto-utils'
import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'

useSeoMeta({
  title: 'Inversiones en USD - Mejores Tasas Argentina',
  description:
    'Compará los mejores rendimientos en dólares estadounidenses. Encontrá fondos de renta fija, mercado de dinero y billeteras con rendimientos en USD.',
  ogTitle: 'Inversiones en USD - Mejores Tasas Argentina',
  ogDescription:
    'Compará los mejores rendimientos en dólares estadounidenses. Encontrá fondos de renta fija, mercado de dinero y billeteras con rendimientos en USD.',
})

const { data, loading: fundsLoading, error: fundsError } = useFunds()
const { fetchAll, loading: cryptoLoading, error: cryptoError } = useCrypto()

const loading = computed(() => fundsLoading.value || cryptoLoading.value)
const error = computed(() => fundsError.value || cryptoError.value)

// Cuentas remuneradas en USD desde la API
interface UsdAccount {
  entidad: string
  tasa: number
  tope: number
}

const usdAccounts = ref<UsdAccount[]>([])
const loadingAccounts = ref(false)
const errorAccounts = ref<unknown>(null)

// Rendimientos en USD que no son criptos
const usdYields = ref<
  Array<{ entidad: string; rendimientos: Array<{ moneda: string; apy: number }> }>
>([])

// Obtener todos los fondos USD (renta fija + mercado de dinero)
const allUsdFunds = computed(() => {
  const rentaFija = data.value.rentaFija.filter((i) => i?.meta?.showInUsdFunds)
  const mercadoDinero = data.value.mercadoDinero.filter((i) => i?.meta?.showInUsdMoneyMarket)
  const allRentaFija = data.value.rentaFija.filter((i) => i?.meta?.showInUsdMoneyMarket)

  return [...rentaFija, ...mercadoDinero, ...allRentaFija]
})

// Transformar las cuentas USD de la API para usar con FundsList
const usdAccountsForFundsList = computed(() => {
  return usdAccounts.value
    .map((account) => {
      const logo = getInstitutionLogo(account.entidad)
      const url = getInstitutionUrl(account.entidad)

      return {
        institution: getInstitutionShortName(account.entidad),
        displayName: getInstitutionShortName(account.entidad),
        logo: logo || 'https://api.argentinadatos.com/static/comparatasas/logos/default.png',
        url: url || '#',
        tna: account.tasa, // Ya viene en decimal
        tope: account.tope,
        typeLabel: 'Cuenta Remunerada USD',
        type: 'cuentaRemuneradaUsd',
      }
    })
    .sort((a, b) => b.tna - a.tna)
})

// Transformar los rendimientos USD de billeteras para usar con FundsList
const usdYieldsForFundsList = computed(() => {
  return usdYields.value
    .flatMap((entity) =>
      entity.rendimientos.map((rendimiento) => {
        const logo = getInstitutionLogo(entity.entidad)
        const url = getInstitutionUrl(entity.entidad)

        return {
          institution: getInstitutionShortName(entity.entidad),
          displayName: getInstitutionShortName(entity.entidad),
          logo: logo || 'https://api.argentinadatos.com/static/comparatasas/logos/default.png',
          url: url || '#',
          tna: rendimiento.apy / 100, // FundsList multiplica por 100 en mode='detailed'
          tope: null,
          typeLabel: 'Billetera USD',
          type: 'billeteraUsd',
        }
      }),
    )
    .sort((a, b) => b.tna - a.tna) // Ordenar de mayor a menor
})

// Combinar cuentas y billeteras USD
const accountsAndWallets = computed(() => {
  return [...usdAccountsForFundsList.value, ...usdYieldsForFundsList.value].sort(
    (a, b) => b.tna - a.tna,
  )
})

// Subdividir por nivel de riesgo
const fundsByRisk = computed(() => {
  const grouped: Record<string, any[]> = {
    'Riesgo bajo': [],
    'Riesgo moderado': [],
  }

  // Agregar fondos USD
  allUsdFunds.value.forEach((fund) => {
    // Money Market USD → Riesgo bajo
    if (fund.meta?.showInUsdMoneyMarket) {
      grouped['Riesgo bajo']!.push(fund)
    }
    // Renta Fija USD → Riesgo moderado
    else if (fund.meta?.showInUsdFunds) {
      grouped['Riesgo moderado']!.push(fund)
    }
  })

  // Ordenar cada grupo por TNA descendente
  Object.keys(grouped).forEach((key) => {
    grouped[key]!.sort((a, b) => b.tna - a.tna)
  })

  return grouped
})

// Cargar cuentas remuneradas en USD
async function fetchUsdAccounts() {
  loadingAccounts.value = true
  errorAccounts.value = null

  try {
    const response = await $fetch<UsdAccount[]>(
      'https://api.argentinadatos.com/v1/finanzas/cuentas-remuneradas-usd/',
    )
    usdAccounts.value = response
  } catch (err) {
    errorAccounts.value = err
  } finally {
    loadingAccounts.value = false
  }
}

// Cargar rendimientos en USD al montar
onMounted(async () => {
  const allYields = await fetchAll()

  // Filtrar solo rendimientos en USD que NO sean criptos
  usdYields.value = allYields
    .map((entity) => {
      const usdRendimientos = entity.rendimientos.filter(
        (rendimiento) =>
          rendimiento.moneda.toUpperCase() === 'USD' && !isCrypto(rendimiento.moneda),
      )

      return {
        entidad: entity.entidad,
        rendimientos: usdRendimientos,
      }
    })
    .filter((entity) => entity.rendimientos.length > 0)

  // Cargar cuentas USD
  await fetchUsdAccounts()
})
</script>

<template>
  <div>
    <div class="space-y-6">
      <!-- Cuentas y Billeteras USD -->
      <div>
        <div class="mb-2">
          <div class="group relative">
            <NuxtLink
              to="#cuentas-billeteras-usd"
              class="-ml-4.5 flex items-center gap-2 no-underline"
            >
              <span
                class="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                #
              </span>
              <h2 id="cuentas-billeteras-usd" class="text-lg font-medium scroll-mt-22">
                Cuentas y Billeteras USD
              </h2>
            </NuxtLink>
          </div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Cuentas remuneradas y billeteras con rendimientos en dólares
          </p>
        </div>

        <UAlert
          v-if="errorAccounts"
          color="red"
          variant="soft"
          title="Error cargando cuentas USD"
        />

        <FundsLoading v-if="loadingAccounts && accountsAndWallets.length === 0" />

        <FundsList
          v-else-if="accountsAndWallets.length > 0"
          :items="accountsAndWallets"
          key-prop="institution"
          mode="detailed"
        />

        <div
          v-else-if="!loadingAccounts && accountsAndWallets.length === 0"
          class="text-center py-8"
        >
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="w-12 h-12 text-muted mx-auto mb-4"
          />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron cuentas o billeteras
          </h3>
          <p class="text-muted">No hay cuentas o billeteras en USD disponibles en este momento.</p>
        </div>
      </div>

      <!-- Fondos de Inversión USD -->
      <div>
        <div class="mb-2">
          <div class="group relative">
            <NuxtLink to="#fondos-usd" class="-ml-4.5 flex items-center gap-2 no-underline">
              <span
                class="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                #
              </span>
              <h2 id="fondos-usd" class="text-lg font-medium scroll-mt-22">
                Fondos de Inversión USD
              </h2>
            </NuxtLink>
          </div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Fondos comunes de inversión con rendimientos en dólares
          </p>
        </div>

        <UAlert v-if="error" color="red" variant="soft" title="Error cargando fondos" />

        <FundsLoading
          v-if="loading && Object.values(fundsByRisk).every((group) => group.length === 0)"
        />

        <div v-else class="space-y-6">
          <div v-for="(funds, riskKey) in fundsByRisk" :key="riskKey">
            <div v-if="funds.length > 0" class="space-y-3">
              <h3 class="text-base font-medium text-neutral-700 dark:text-neutral-300">
                {{ riskKey }}
              </h3>
              <FundsList :items="funds" key-prop="fondo" mode="detailed" />
            </div>
          </div>
        </div>

        <div
          v-if="!loading && Object.values(fundsByRisk).every((group) => group.length === 0)"
          class="text-center py-8"
        >
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="w-12 h-12 text-muted mx-auto mb-4"
          />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron fondos
          </h3>
          <p class="text-muted">No hay fondos en USD disponibles en este momento.</p>
        </div>
      </div>
    </div>
  </div>
</template>

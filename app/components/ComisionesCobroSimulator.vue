<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

interface PresetAmount {
  value: number
  label: string
}

withDefaults(
  defineProps<{
    presetAmounts?: PresetAmount[]
  }>(),
  {
    presetAmounts: () => [
      { value: 10_000, label: '$10k' },
      { value: 50_000, label: '$50k' },
      { value: 100_000, label: '$100k' },
      { value: 500_000, label: '$500k' },
      { value: 1_000_000, label: '$1M' },
    ],
  },
)

const {
  amount,
  sumarIva,
  isOpen,
  isSimulating,
  openSimulator,
  minimizeSimulator,
  closeSimulator,
} = useComisionesCobroSimulator()

const isDesktop = useMediaQuery('(min-width: 1024px)')
const amountMin = 1
const amountStep = 1

const resumenActivo = computed(() => {
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount.value)
  return sumarIva.value ? `${formatted} · + IVA` : formatted
})
</script>

<template>
  <div>
    <ClientOnly>
      <!-- Botón flotante desktop -->
      <div
        v-if="isDesktop && !isOpen"
        class="fixed bottom-4 left-4 z-50"
      >
        <UButton
          v-if="!isSimulating"
          color="primary"
          size="lg"
          label="Abrir Simulador"
          icon="i-lucide-calculator"
          @click="openSimulator"
        />
        <div
          v-else
          class="flex gap-2"
        >
          <UButton
            color="primary"
            size="lg"
            label="Ver Simulador"
            icon="i-lucide-calculator"
            @click="isOpen = true"
          />
          <UButton
            color="error"
            variant="soft"
            size="lg"
            label="Cerrar Simulación"
            icon="i-lucide-x"
            @click="closeSimulator"
          />
        </div>
      </div>

      <!-- Panel flotante desktop -->
      <div
        v-if="isDesktop && isOpen"
        class="fixed bottom-4 left-4 z-50 w-80"
      >
        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="text-lg font-semibold">
                  Simulador de cobro
                </h3>
                <p class="text-xs text-muted">
                  {{ resumenActivo }}
                </p>
              </div>
              <UButton
                icon="i-lucide-minus"
                color="neutral"
                variant="ghost"
                size="sm"
                @click="minimizeSimulator"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UFormField
              label="Monto de la venta"
              name="amount"
            >
              <UInputNumber
                v-model="amount"
                :min="amountMin"
                :step="amountStep"
              />
              <template #hint>
                <div class="mt-1.5 flex flex-wrap gap-1">
                  <UButton
                    v-for="preset in presetAmounts"
                    :key="preset.value"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :label="preset.label"
                    @click="amount = preset.value"
                  />
                </div>
              </template>
            </UFormField>

            <UCheckbox
              v-model="sumarIva"
              label="Sumar IVA 21% cuando el arancel lo indique"
            />

            <div class="space-y-2 border-t border-default pt-2">
              <div class="flex items-start gap-2 text-xs text-muted">
                <UIcon
                  name="i-lucide-refresh-cw"
                  class="mt-0.5 size-4 shrink-0"
                />
                <p>Costo y neto se actualizan solos en la tabla.</p>
              </div>
              <div class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                <UIcon
                  name="i-lucide-info"
                  class="mt-0.5 size-4 shrink-0"
                />
                <p>
                  Estimación orientativa. Los aranceles “hasta X%” usan el tope publicado; pueden
                  aplicar costos fijos o condiciones extra.
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Botón mobile -->
      <div
        v-if="!isDesktop"
        class="fixed inset-x-0 bottom-4 z-50 flex w-full justify-center"
      >
        <UButton
          v-if="!isOpen && !isSimulating"
          label="Abrir Simulador"
          icon="i-lucide-calculator"
          @click="openSimulator"
        />
        <div
          v-else-if="!isOpen && isSimulating"
          class="flex gap-2"
        >
          <UButton
            label="Ver Simulador"
            icon="i-lucide-calculator"
            @click="isOpen = true"
          />
          <UButton
            color="error"
            variant="soft"
            label="Cerrar"
            icon="i-lucide-x"
            @click="closeSimulator"
          />
        </div>
      </div>

      <!-- Drawer mobile -->
      <UDrawer
        v-if="!isDesktop"
        v-model:open="isOpen"
        title="Simulador de cobro"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField
              label="Monto de la venta"
              name="amount"
            >
              <UInputNumber
                v-model="amount"
                :min="amountMin"
                :step="amountStep"
              />
              <template #hint>
                <div class="mt-1.5 flex flex-wrap gap-1">
                  <UButton
                    v-for="preset in presetAmounts"
                    :key="preset.value"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :label="preset.label"
                    @click="amount = preset.value"
                  />
                </div>
              </template>
            </UFormField>

            <UCheckbox
              v-model="sumarIva"
              label="Sumar IVA 21% cuando el arancel lo indique"
            />

            <div class="space-y-2 border-t border-default pt-2">
              <div class="flex items-start gap-2 text-xs text-muted">
                <UIcon
                  name="i-lucide-refresh-cw"
                  class="mt-0.5 size-4 shrink-0"
                />
                <p>Costo y neto se actualizan solos en la lista.</p>
              </div>
              <div class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                <UIcon
                  name="i-lucide-info"
                  class="mt-0.5 size-4 shrink-0"
                />
                <p>
                  Estimación orientativa. Los aranceles “hasta X%” usan el tope publicado.
                </p>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <UButton
            block
            color="neutral"
            label="Ver Resultados"
            @click="minimizeSimulator"
          />
        </template>
      </UDrawer>
    </ClientOnly>
  </div>
</template>

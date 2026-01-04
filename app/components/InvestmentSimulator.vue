<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

const props = defineProps<{
  fixedDays?: number
}>()

const { amount, days, isOpen, isSimulating } = useInvestmentSimulator()

// Si hay días fijos, establecerlos y mantenerlos
if (props.fixedDays !== undefined) {
  days.value = props.fixedDays
}

// Observar cambios en fixedDays
watch(
  () => props.fixedDays,
  (newFixedDays) => {
    if (newFixedDays !== undefined) {
      days.value = newFixedDays
    }
  },
)

const isDesktop = useMediaQuery('(min-width: 1024px)')

const openSimulator = () => {
  isOpen.value = true
  isSimulating.value = true
}

const minimizeSimulator = () => {
  isOpen.value = false
}

const closeSimulator = () => {
  isOpen.value = false
  isSimulating.value = false
}
</script>

<template>
  <div>
    <!-- Botón flotante para abrir/reabrir en desktop -->
    <div v-if="isDesktop && !isOpen" class="fixed bottom-4 left-4 z-50">
      <UButton
        v-if="!isSimulating"
        color="primary"
        size="lg"
        label="Abrir Simulador"
        icon="i-lucide-calculator"
        @click="openSimulator"
      />
      <div v-else class="flex gap-2">
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

    <!-- Panel flotante en desktop -->
    <div v-if="isDesktop && isOpen" class="fixed bottom-4 left-4 w-80 z-50">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-lg">Simulador de Inversión</h3>
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
          <UFormField label="Monto inicial" name="amount">
            <UInputNumber v-model="amount" :min="1000" :step="1000" />
            <template #hint>
              <div class="flex gap-1 mt-1.5">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  label="$100k"
                  @click="amount = 100000"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  label="$500k"
                  @click="amount = 500000"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  label="$1M"
                  @click="amount = 1000000"
                />
              </div>
            </template>
          </UFormField>

          <UFormField label="Días" name="days">
            <UInputNumber v-model="days" :min="1" :max="365" :disabled="fixedDays !== undefined" />
            <template v-if="!fixedDays" #hint>
              <div class="flex gap-1 mt-1.5">
                <UButton size="xs" color="neutral" variant="outline" label="1d" @click="days = 1" />
                <UButton size="xs" color="neutral" variant="outline" label="7d" @click="days = 7" />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  label="14d"
                  @click="days = 14"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  label="30d"
                  @click="days = 30"
                />
              </div>
            </template>
          </UFormField>

          <div class="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <div class="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <UIcon name="i-lucide-refresh-cw" class="size-4 mt-0.5 flex-shrink-0" />
              <p>Los resultados se actualizan automáticamente en la lista</p>
            </div>
            <div class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
              <UIcon name="i-lucide-info" class="size-4 mt-0.5 flex-shrink-0" />
              <div class="space-y-1">
                <p v-if="!fixedDays">
                  Calcula con interés compuesto. Algunos proveedores tienen límites máximos.
                </p>
                <p v-if="fixedDays">Plazos fijos: {{ fixedDays }} días con interés simple.</p>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Botón para abrir en mobile -->
    <div v-if="!isDesktop" class="fixed bottom-4 inset-x-0 w-full z-50 flex justify-center">
      <UButton
        v-if="!isOpen && !isSimulating"
        label="Abrir Simulador"
        icon="i-lucide-calculator"
        @click="openSimulator"
      />
      <div v-else-if="!isOpen && isSimulating" class="flex gap-2">
        <UButton label="Ver Simulador" icon="i-lucide-calculator" @click="isOpen = true" />
        <UButton
          color="error"
          variant="soft"
          label="Cerrar"
          icon="i-lucide-x"
          @click="closeSimulator"
        />
      </div>
    </div>

    <!-- Drawer en mobile -->
    <UDrawer v-if="!isDesktop" v-model:open="isOpen" title="Simulador de Inversión">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Monto inicial" name="amount">
            <UInputNumber v-model="amount" :min="1000" :step="1000" />
            <template #hint>
              <div class="flex gap-1 mt-1.5">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  label="$100k"
                  @click="amount = 100000"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  label="$500k"
                  @click="amount = 500000"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  label="$1M"
                  @click="amount = 1000000"
                />
              </div>
            </template>
          </UFormField>

          <UFormField label="Días" name="days">
            <UInputNumber v-model="days" :min="1" :max="365" :disabled="fixedDays !== undefined" />
            <template v-if="!fixedDays" #hint>
              <div class="flex gap-1 mt-1.5">
                <UButton size="xs" color="neutral" variant="outline" label="1d" @click="days = 1" />
                <UButton size="xs" color="neutral" variant="outline" label="7d" @click="days = 7" />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  label="14d"
                  @click="days = 14"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  label="30d"
                  @click="days = 30"
                />
              </div>
            </template>
          </UFormField>

          <div class="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <div class="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <UIcon name="i-lucide-refresh-cw" class="size-4 mt-0.5 flex-shrink-0" />
              <p>Los resultados se actualizan automáticamente en la lista</p>
            </div>
            <div class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
              <UIcon name="i-lucide-info" class="size-4 mt-0.5 flex-shrink-0" />
              <div class="space-y-1">
                <p v-if="!fixedDays">
                  Calcula con interés compuesto. Algunos proveedores tienen límites máximos.
                </p>
                <p v-if="fixedDays">Plazos fijos: {{ fixedDays }} días con interés simple.</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <UButton block color="neutral" label="Ver Resultados" @click="minimizeSimulator" />
      </template>
    </UDrawer>
  </div>
</template>

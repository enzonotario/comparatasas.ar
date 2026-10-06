<script setup lang="ts">
import { groupNavigationPages } from '~/composables/useNavigationPages'
import { siteOrganization } from '~/lib/json-ld'
import { withOutboundUtm } from '~/lib/outbound-url'

interface FooterLink {
  to: string
  label: string
  external?: boolean
}

interface FooterColumn {
  id: string
  label: string
  links: FooterLink[]
}

const { categories } = useNavigationPages()

const productColumns = computed<FooterColumn[]>(() => {
  const ars = categories.find((category) => category.id === 'ars')
  const foreign = categories.filter((category) => category.id !== 'ars')

  const arsColumns = groupNavigationPages(ars?.pages ?? []).map((group) => ({
    id: group.id,
    label: group.label,
    links: group.pages.map(({ to, label }) => ({ to, label })),
  }))

  return [
    ...arsColumns,
    {
      id: 'usd-cripto',
      label: 'USD y Cripto',
      links: foreign
        .flatMap((category) => category.pages)
        .map(({ to, label }) => ({
          to,
          label: to.includes('moneda=usd') ? `${label} en USD` : label,
        })),
    },
  ]
})

const projectColumn: FooterColumn = {
  id: 'proyecto',
  label: 'Proyecto',
  links: [
    { to: '/metodologia', label: 'Metodología de cálculos' },
    { to: '/about', label: 'Acerca de' },
    { to: '/contact', label: 'Contacto' },
    { to: '/sumarse', label: 'Sumar tu entidad' },
    { to: '/privacy', label: 'Privacidad' },
    { to: '/llms.txt', label: 'llms.txt', external: true },
  ],
}

const columns = computed(() => [...productColumns.value, projectColumn])

const socialLinks = [
  {
    label: 'GitHub de ComparaTasas.ar',
    icon: 'i-simple-icons-github',
    to: withOutboundUtm('https://github.com/enzonotario/comparatasas.ar', 'footer'),
  },
  {
    label: 'ComparaTasas.ar en X',
    icon: 'i-simple-icons-x',
    to: withOutboundUtm('https://x.com/comparatasas', 'footer'),
  },
  {
    label: 'Enviar un email',
    icon: 'i-lucide-mail',
    to: `mailto:${siteOrganization.email}`,
  },
]

const currentYear = new Date().getFullYear()

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <UFooter
    class="border-t border-default bg-white/60 dark:bg-neutral-900/40"
    :ui="{
      top: 'py-10 lg:py-14',
      // Bottom space so floating page actions do not cover the copyright.
      container: 'border-t border-default pb-24 lg:pb-20',
    }"
  >
    <template #top>
      <UContainer class="max-w-7xl space-y-10">
        <div class="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-16">
          <div class="flex flex-col items-start gap-5">
            <NuxtLink to="/" class="flex items-center gap-2" aria-label="ComparaTasas.ar — Inicio">
              <img
                src="/assets/logo.png"
                alt=""
                class="size-9 rounded-full object-cover"
                width="36"
                height="36"
                loading="lazy"
                decoding="async"
              />
              <span class="text-lg font-bold text-highlighted">ComparaTasas.ar</span>
            </NuxtLink>

            <p class="text-sm text-muted text-pretty max-w-sm">
              Comparador independiente de tasas y rendimientos en Argentina: cuentas remuneradas,
              plazos fijos, fondos comunes de inversión, préstamos, cripto y más.
            </p>

            <div
              class="w-full max-w-sm rounded-lg border border-default bg-elevated/50 p-4 space-y-3"
            >
              <div class="space-y-1">
                <p class="text-sm font-semibold text-highlighted">Apoyá el proyecto</p>
                <p class="text-xs text-muted">
                  Es gratis y de código abierto. Tu aporte ayuda a mantenerlo y mejorarlo.
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  :to="withOutboundUtm('https://cafecito.app/enzonotario', 'footer')"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  icon="i-lucide-coffee"
                  label="Invitame un café"
                />
                <span data-opina class="inline-flex">
                  <UButton
                    type="button"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-message-circle"
                    label="Dejá tu opinión"
                  />
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            <nav
              v-for="column in columns"
              :key="column.id"
              :aria-labelledby="`footer-${column.id}`"
            >
              <h2
                :id="`footer-${column.id}`"
                class="text-xs font-semibold uppercase tracking-wider text-highlighted"
              >
                {{ column.label }}
              </h2>
              <ul class="mt-4 space-y-2.5">
                <li v-for="link in column.links" :key="link.to">
                  <a
                    v-if="link.external"
                    :href="link.to"
                    class="text-sm text-muted transition-colors hover:text-primary"
                  >
                    {{ link.label }}
                  </a>
                  <NuxtLink
                    v-else
                    :to="link.to"
                    class="text-sm text-muted transition-colors hover:text-primary"
                  >
                    {{ link.label }}
                  </NuxtLink>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <FriendlyPages />
      </UContainer>
    </template>

    <template #left>
      <p class="text-sm text-muted text-center lg:text-left">
        © {{ currentYear }} ComparaTasas.ar · La información no constituye asesoramiento financiero.
      </p>
    </template>

    <template #right>
      <UButton
        v-for="link in socialLinks"
        :key="link.label"
        :to="link.to"
        :icon="link.icon"
        :aria-label="link.label"
        :target="link.to.startsWith('http') ? '_blank' : undefined"
        rel="noopener noreferrer"
        color="neutral"
        variant="ghost"
        square
      />
      <UButton
        icon="i-lucide-arrow-up"
        aria-label="Volver arriba"
        color="neutral"
        variant="ghost"
        square
        @click="scrollToTop"
      />
    </template>
  </UFooter>
</template>

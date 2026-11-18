<script setup lang="ts">
import { getEntityBySlug, getEntityLogo } from '~/lib/entities'

const props = defineProps<{
  title: string
  items: Array<{ name: string; rate: string }>
  updatedAt?: string
  /** Optional text below the title, for pages without a ranked list. */
  subtitle?: string
  /**
   * Entity slugs shown as a grid of round logos. Slugs (not logo URLs) keep the
   * OG URL short: some logos are inline base64 SVGs.
   */
  entitySlugs?: string[]
}>()

const LOGOS_PER_ROW = 6

const logoRows = computed(() => {
  const logos = (props.entitySlugs ?? []).flatMap((slug) => {
    const entity = getEntityBySlug(slug)
    const src = entity ? getEntityLogo(entity) : undefined
    return entity && src ? [{ slug, name: entity.name, src }] : []
  })
  const rows: (typeof logos)[] = []
  for (let i = 0; i < logos.length; i += LOGOS_PER_ROW) {
    rows.push(logos.slice(i, i + LOGOS_PER_ROW))
  }
  return rows
})

// Light mode: fondos claros y texto oscuro
const COLORS = ['#5b21b6', '#6d28d9', '#7c3aed']
const BG_COLORS = [
  'rgba(221, 214, 254, 0.9)',
  'rgba(237, 233, 254, 0.9)',
  'rgba(245, 243, 255, 0.9)',
]
const BORDER_COLORS = [
  'rgba(196, 181, 253, 0.4)',
  'rgba(139, 92, 246, 0.3)',
  'rgba(99, 102, 241, 0.35)',
]
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      width: '1200px',
      height: '630px',
      backgroundColor: '#f8fafc',
      backgroundImage: 'url(/assets/logo-grande.png)',
      backgroundSize: '50% auto',
      backgroundPosition: 'right bottom',
      backgroundRepeat: 'no-repeat',
      color: '#0f172a',
      fontFamily: '\'Inter\', system-ui, sans-serif',
      padding: '56px 64px',
      boxSizing: 'border-box',
      position: 'relative',
    }"
  >
    <!-- Overlay claro para legibilidad del texto sobre la ilustración -->
    <div
      :style="{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(90deg, rgba(248, 250, 252, 0.97) 0%, rgba(248, 250, 252, 0.85) 45%, rgba(241, 245, 249, 0.6) 100%)',
        pointerEvents: 'none',
      }"
      aria-hidden="true"
    />
    <div
      :style="{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        position: 'relative',
        zIndex: 1,
      }"
    >
      <div :style="{ display: 'flex', alignItems: 'center', marginBottom: '36px' }">
        <span
          :style="{
            fontSize: '22px',
            color: '#64748b',
            fontWeight: '500',
            letterSpacing: '0.02em',
          }"
        >
          ComparaTasas.ar
        </span>
      </div>

      <h1
        :style="{
          fontSize: '48px',
          fontWeight: '700',
          margin: '0 0 36px 0',
          color: '#0f172a',
          lineHeight: '1.1',
          letterSpacing: '-0.02em',
        }"
      >
        {{ title }}
      </h1>

      <div
        v-if="subtitle"
        :style="{
          display: 'flex',
          fontSize: '30px',
          fontWeight: '500',
          margin: '0',
          color: '#475569',
          lineHeight: '1.35',
          maxWidth: '640px',
        }"
      >
        {{ subtitle }}
      </div>

      <div
        v-if="logoRows.length"
        :style="{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          marginTop: '40px',
        }"
      >
        <div
          v-for="(row, rowIndex) in logoRows"
          :key="rowIndex"
          :style="{ display: 'flex', gap: '18px' }"
        >
          <div
            v-for="logo in row"
            :key="logo.slug"
            :style="{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: '2px solid rgba(139, 92, 246, 0.25)',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
            }"
          >
            <img
              :src="logo.src"
              :alt="logo.name"
              width="80"
              height="80"
              :style="{ width: '80px', height: '80px', objectFit: 'cover' }"
            />
          </div>
        </div>
      </div>

      <div
        :style="{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          flex: '1',
          maxWidth: '700px',
        }"
      >
        <span v-if="updatedAt">{{ updatedAt }}</span>

        <div
          v-for="(item, i) in items.slice(0, 3)"
          :key="i"
          :style="{
            display: 'flex',
            alignItems: 'center',
            background: BG_COLORS[i],
            borderRadius: '14px',
            padding: '18px 24px',
            border: `1px solid ${BORDER_COLORS[i]}`,
          }"
        >
          <span
            :style="{
              fontSize: '22px',
              fontWeight: '700',
              color: COLORS[i],
              marginRight: '20px',
              width: '32px',
              flexShrink: '0',
            }"
          >
            {{ i + 1 }}
          </span>
          <span
            :style="{
              fontSize: '26px',
              fontWeight: '600',
              flex: '1',
              color: '#1e293b',
              overflow: 'hidden',
            }"
          >
            {{ item.name }}
          </span>
          <span
            :style="{
              fontSize: '30px',
              fontWeight: '700',
              color: COLORS[i],
              flexShrink: '0',
            }"
          >
            {{ item.rate }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

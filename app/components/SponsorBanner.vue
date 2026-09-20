<script setup lang="ts">
import { useAnalytics } from '~/composables/useAnalytics'

interface Banner {
  id: number
  desktopUrl: string
  mobileUrl: string
  desktopDarkUrl?: string
  mobileDarkUrl?: string
  altText: string
  linkUrl?: string
}

interface Props {
  bannerId?: number
}

const props = defineProps<Props>()
const { trackSponsorClick } = useAnalytics()

const BASE_URL = 'https://api.argentinadatos.com/static/assets/arq/'

const LINK_URL =
  'https://www.arqfinance.com/referrals/arr?referralCode=enzonotario_sJx&pid=referral&c=arr&is_retargeting=true'

const banner: Banner = {
  id: 1,
  desktopUrl: `${BASE_URL}desktop.gif`,
  mobileUrl: `${BASE_URL}mobile.gif`,
  altText: 'ARQ — Pagá tus compras online en dólares',
  linkUrl: LINK_URL,
}

const isMobile = ref(false)
const isDarkMode = ref(false)
const imageError = ref(false)

let cleanup: (() => void) | null = null

const currentBanner = computed(() => {
  if (imageError.value) return null
  // bannerId se mantiene por compatibilidad de analytics / usos legacy
  if (props.bannerId !== undefined && props.bannerId !== banner.id) return null
  return banner
})

const bannerImageUrl = computed(() => {
  if (!currentBanner.value) return ''

  if (isMobile.value) {
    return isDarkMode.value && currentBanner.value.mobileDarkUrl
      ? currentBanner.value.mobileDarkUrl
      : currentBanner.value.mobileUrl
  } else {
    return isDarkMode.value && currentBanner.value.desktopDarkUrl
      ? currentBanner.value.desktopDarkUrl
      : currentBanner.value.desktopUrl
  }
})

onMounted(() => {
  if (import.meta.client) {
    const defer = window.requestIdleCallback || ((fn: () => void) => setTimeout(fn, 1))

    defer(() => {
      const checkMobile = () => {
        isMobile.value = window.innerWidth < 768
      }
      checkMobile()

      window.addEventListener('resize', checkMobile, { passive: true })

      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      isDarkMode.value = darkModeQuery.matches

      const handleDarkModeChange = (e: MediaQueryListEvent) => {
        isDarkMode.value = e.matches
      }
      darkModeQuery.addEventListener('change', handleDarkModeChange)

      cleanup = () => {
        window.removeEventListener('resize', checkMobile)
        darkModeQuery.removeEventListener('change', handleDarkModeChange)
      }
    })
  }
})

onUnmounted(() => {
  cleanup?.()
})

const handleImageError = () => {
  imageError.value = true
  console.warn('Error al cargar banner:', currentBanner.value?.id)
}

const handleSponsorClick = () => {
  if (currentBanner.value) {
    trackSponsorClick({
      sponsorName: currentBanner.value.altText,
      sponsorUrl: currentBanner.value.linkUrl ?? '',
      bannerId: currentBanner.value.id,
    })
  }
}
</script>

<template>
  <div v-if="currentBanner" class="w-full overflow-hidden rounded-xl shadow-sm relative group">
    <NuxtLink
      v-if="currentBanner.linkUrl"
      :to="currentBanner.linkUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="block w-full h-full"
      @click="handleSponsorClick"
    >
      <img
        :src="bannerImageUrl"
        :alt="currentBanner.altText"
        class="w-full h-auto object-cover duration-300"
        loading="lazy"
        decoding="async"
        @error="handleImageError"
      />
    </NuxtLink>
    <img
      v-else
      :src="bannerImageUrl"
      :alt="currentBanner.altText"
      class="w-full h-auto object-cover duration-300"
      loading="lazy"
      decoding="async"
      @error="handleImageError"
    />
  </div>
</template>

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

interface PlaylistEntry {
  bannerId: number
  duration: number
}

interface Props {
  bannerId?: number
}

const props = defineProps<Props>()
const { trackSponsorClick } = useAnalytics()

const BASE_URL = 'https://api.argentinadatos.com/static/assets/arq/'

const defaultBanners: Banner[] = [
  {
    id: 10,
    desktopUrl: `${BASE_URL}Desktop_banner_10.png`,
    mobileUrl: `${BASE_URL}Mobile_banner_10.png`,
    altText: 'Banner 10',
  },
  {
    id: 20,
    desktopUrl: `${BASE_URL}Desktop_banner_20.png`,
    mobileUrl: `${BASE_URL}Mobile_banner_20.png`,
    altText: 'Banner 20',
  },
  {
    id: 30,
    desktopUrl: `${BASE_URL}Desktop_banner_30.png`,
    mobileUrl: `${BASE_URL}Mobile_banner_30.png`,
    altText: 'Banner 30',
  },
  {
    id: 40,
    desktopUrl: `${BASE_URL}Desktop_banner_40.png`,
    mobileUrl: `${BASE_URL}Mobile_banner_40.png`,
    altText: 'Banner 40',
  },
]

const playlist: PlaylistEntry[] = [
  { bannerId: 10, duration: 10000 },
  { bannerId: 20, duration: 10000 },
  { bannerId: 30, duration: 10000 },
  { bannerId: 20, duration: 6000 },
]

const isMobile = ref(false)
const isDarkMode = ref(false)
const imageError = ref(false)
const currentPlaylistIndex = ref(0)

const currentBanner = computed(() => {
  if (imageError.value) return null

  if (props.bannerId !== undefined) {
    return defaultBanners.find((b) => b.id === props.bannerId) || null
  }

  const entry = playlist[currentPlaylistIndex.value]
  return defaultBanners.find((b) => b.id === entry.bannerId) || null
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

      let timeoutId: ReturnType<typeof setTimeout>

      const scheduleNext = () => {
        const entry = playlist[currentPlaylistIndex.value]
        timeoutId = setTimeout(() => {
          currentPlaylistIndex.value = (currentPlaylistIndex.value + 1) % playlist.length
          scheduleNext()
        }, entry.duration)
      }

      if (props.bannerId === undefined) {
        scheduleNext()
      }

      onUnmounted(() => {
        window.removeEventListener('resize', checkMobile)
        darkModeQuery.removeEventListener('change', handleDarkModeChange)
        clearTimeout(timeoutId)
      })
    })
  }
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
  <div v-if="currentBanner" class="w-full my-6 overflow-hidden rounded-xl shadow-sm relative group">
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

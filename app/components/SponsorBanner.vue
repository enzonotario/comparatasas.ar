<script setup lang="ts">
interface Banner {
  id: number
  desktopUrl: string
  mobileUrl: string
  desktopDarkUrl?: string
  mobileDarkUrl?: string
  altText: string
  linkUrl: string
}

interface Props {
  bannerId?: number
}

const props = defineProps<Props>()

const defaultBanners: Banner[] = [
  {
    id: 1,
    desktopUrl: 'https://api.argentinadatos.com/static/assets/dolarapp.gif',
    mobileUrl: 'https://api.argentinadatos.com/static/assets/dolarapp-mobile.gif',
    altText: 'DolarApp',
    linkUrl:
      'https://www.dolarapp.com/es-AR?utm_source=comparatasas&utm_medium=banner&utm_campaign=comparatasas_ad',
  },
]

const isMobile = ref(false)
const isDarkMode = ref(false)
const imageError = ref(false)

const currentBanner = computed(() => {
  if (imageError.value) return null

  if (props.bannerId !== undefined) {
    return defaultBanners.find((b) => b.id === props.bannerId) || null
  }

  const randomIndex = Math.floor(Math.random() * defaultBanners.length)
  return defaultBanners[randomIndex]
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

      onUnmounted(() => {
        window.removeEventListener('resize', checkMobile)
        darkModeQuery.removeEventListener('change', handleDarkModeChange)
      })
    })
  }
})

const handleImageError = () => {
  imageError.value = true
  console.warn('Error al cargar banner:', currentBanner.value?.id)
}
</script>

<template>
  <div v-if="currentBanner" class="w-full my-6 overflow-hidden rounded-xl shadow-sm relative group">
    <NuxtLink
      :to="currentBanner.linkUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="block w-full h-full"
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
  </div>
</template>

<script setup>
const { width } = useWindowSize()

const desktopAds = [
  {
    src: '/assets/cocos-desktop.jpeg',
    link: 'https://dub.link/sSLvNxm',
  },
]
const mobileAds = [
  {
    src: '/assets/cocos-mobile.jpeg',
    link: 'https://dub.link/sSLvNxm',
  },
]

const mode = computed(() => (width.value >= 768 ? 'desktop' : 'mobile'))

const ads = computed(() => (mode.value === 'desktop' ? desktopAds : mobileAds))
</script>

<template>
  <div class="sm:px-7">
    <div class="relative">
      <a :href="ads[0].link" target="_blank" rel="noopener noreferrer">
        <img :src="ads[0].src" :alt="'Ad'" fetchpriority="high" class="w-full rounded-lg" />
      </a>

      <!-- Ad indicator -->
      <div class="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        Ad
      </div>
    </div>
  </div>
</template>

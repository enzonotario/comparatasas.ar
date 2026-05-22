<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    value?: string | number | null
    avatarSrc?: string | null
    avatarAlt?: string
    avatarText?: string
  }>(),
  {
    value: '—',
    avatarSrc: null,
    avatarAlt: '',
    avatarText: '',
  },
)
</script>

<template>
  <UBadge color="neutral" variant="outline" class="max-w-full px-2 py-1 align-middle">
    <div class="flex min-w-0 items-center gap-1.5">
      <UAvatar
        v-if="props.avatarSrc || props.avatarText"
        :src="props.avatarSrc || undefined"
        :alt="props.avatarAlt || props.label"
        :text="props.avatarText"
        size="2xs"
        :ui="{ image: 'object-contain bg-white', fallback: 'text-[8px] font-semibold' }"
      />
      <span class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
        {{ props.label }}
      </span>
      <span class="min-w-0 truncate text-[13px] font-medium text-neutral-950 dark:text-white">
        {{ props.value || '—' }}
      </span>
    </div>
  </UBadge>
</template>

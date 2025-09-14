<script setup lang="ts"></script>

<template>
  <UCard class="max-w-3xl mx-auto">
    <template #header>
      <h2 class="text-lg font-bold">¿Necesitás asesoramiento financiero?</h2>
    </template>

    <p>
      En Quaestus Advisory (AAGI N° 1098 CNV) te podemos ayudar. Estructuramos, ejecutamos y
      administramos carteras de inversión.
    </p>

    <template #footer>
      <NuxtLink
        href="https://docs.google.com/forms/d/e/1FAIpQLSfSe5TgzbjWIAhK3G9ywzo-O0knx_wky8KcC8RKpEIaJYeZeg/viewform?usp=pp_url&entry.946569307=Compara+Tasas"
        target="_blank"
        rel="noopener noreferrer"
      >
        <UButton class="gap-2">
          <UIcon name="i-lucide-handshake" class="size-4" />
          Pedir asesoramiento
        </UButton>
      </NuxtLink>
    </template>
  </UCard>
</template>

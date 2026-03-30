<script setup lang="ts">
import { AvatarFallback } from 'radix-vue'

defineProps<{ class?: string }>()
</script>

<template>
  <AvatarFallback
    :class="[
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground',
      $props.class,
    ]"
  >
    <slot />
  </AvatarFallback>
</template>

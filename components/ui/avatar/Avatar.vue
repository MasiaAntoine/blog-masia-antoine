<script setup lang="ts">
import { AvatarRoot } from 'radix-vue'

defineProps<{ class?: string }>()
</script>

<template>
  <AvatarRoot
    :class="[
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      $props.class,
    ]"
  >
    <slot />
  </AvatarRoot>
</template>

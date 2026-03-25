<script setup lang="ts">
import { cn } from '~/utils/cn'

const props = defineProps<{
  class?: string
}>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-xl border border-border bg-background shadow-sm transition-shadow duration-200',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>

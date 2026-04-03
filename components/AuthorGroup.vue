<script setup lang="ts">
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'

interface Profile {
  id: string
  name: string
  role: string
  avatar_url: string | null
}

defineProps<{ profiles: Profile[] }>()

function initials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<template>
  <div v-if="profiles.length" class="flex -space-x-3 justify-center sm:justify-start">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="group relative"
      >
        <Avatar class="h-11 w-11 border-2 border-background ring-1 ring-border transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
          <AvatarImage v-if="profile.avatar_url" :src="profile.avatar_url" :alt="profile.name" />
          <AvatarFallback>{{ initials(profile.name) }}</AvatarFallback>
        </Avatar>

        <!-- Tooltip -->
        <div class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-xl border border-border bg-background px-3 py-2 text-center opacity-0 shadow-xl transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
          <p class="text-xs font-semibold text-foreground">{{ profile.name }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ profile.role }}</p>
        </div>
      </div>
  </div>
</template>

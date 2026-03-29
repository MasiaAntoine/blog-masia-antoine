<script setup lang="ts">
defineProps<{
  title?: string
  tags?: string[]
  compact?: boolean
  author?: {
    name?: string | null
    role?: string | null
    avatar?: string | null
  } | null
}>()
</script>

<template>
  <div
    class="relative h-full w-full overflow-hidden bg-[#0f172a] flex flex-col"
    :class="compact ? 'p-4' : 'p-6 sm:p-8'"
  >
    <!-- Cercles décoratifs -->
    <div class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-500/10" />
    <div class="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-500/6" />
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.04]"
      style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 32px 32px;"
    />

    <!-- Logo + nom du blog -->
    <div class="relative flex items-center gap-2">
      <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-xs font-bold text-white">B</div>
      <span class="text-sm font-semibold text-slate-400">Le Blog d'Antoine</span>
    </div>

    <!-- Tags + titre -->
    <div class="relative my-auto py-4">
      <div v-if="tags?.length" class="mb-2.5 flex flex-wrap gap-1.5">
        <span
          v-for="tag in tags.slice(0, 3)"
          :key="tag"
          class="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-300"
        >{{ tag }}</span>
      </div>
      <p
        class="font-bold leading-snug text-slate-100"
        :class="compact ? 'line-clamp-2 text-sm' : 'line-clamp-3 text-base sm:text-lg'"
      >{{ title }}</p>
    </div>

    <!-- Auteur (masqué en mode compact) -->
    <div
      v-if="!compact && author"
      class="relative flex items-center gap-2.5 border-t border-white/[0.07] pt-3"
    >
      <img
        v-if="author.avatar"
        :src="author.avatar ?? ''"
        :alt="author.name ?? ''"
        class="h-8 w-8 shrink-0 rounded-full object-cover"
      />
      <div class="min-w-0">
        <p class="truncate text-xs font-semibold text-slate-200">{{ author.name }}</p>
        <p class="truncate text-xs text-slate-500">{{ author.role }}</p>
      </div>
    </div>
  </div>
</template>

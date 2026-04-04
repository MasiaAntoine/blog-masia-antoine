<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  tags?: string[]
  /** sm = cartes grille, md = featured secondaire, lg = hero */
  size?: 'sm' | 'md' | 'lg'
  /** @deprecated utiliser size */
  compact?: boolean
  author?: {
    name?: string | null
    role?: string | null
    avatar?: string | null
    coverColor?: string | null
  } | null
  /** Couleur de fond. Priorité sur author.coverColor. Défaut : #0f172a */
  color?: string
}>(), { size: 'lg' })

const bgColor = computed(() => props.color ?? props.author?.coverColor ?? '#0f172a')
</script>

<template>
  <div
    class="relative h-full w-full overflow-hidden flex flex-col"
    :style="{ backgroundColor: bgColor }"
    :class="{
      'p-3': size === 'sm',
      'p-4': size === 'md',
      'p-6 sm:p-8': size === 'lg',
    }"
  >
    <!-- Cercles décoratifs -->
    <div class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/[0.07]" />
    <div class="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/[0.04]" />
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.04]"
      style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 32px 32px;"
    />

    <!-- Logo + nom du blog -->
    <div class="relative flex items-center gap-1.5 shrink-0">
      <div
        class="flex shrink-0 items-center justify-center rounded-md bg-white/20 font-bold text-white"
        :class="size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-6 w-6 text-xs'"
      >B</div>
      <span
        class="font-semibold text-white/50"
        :class="size === 'sm' ? 'text-[10px]' : 'text-xs'"
      >Le Blog d'Antoine</span>
    </div>

    <!-- Tags + titre -->
    <div class="relative my-auto" :class="size === 'sm' ? 'py-2' : 'py-3'">
      <div v-if="tags?.length" class="mb-1.5 flex flex-wrap gap-1">
        <span
          v-for="tag in tags.slice(0, size === 'sm' ? 2 : 3)"
          :key="tag"
          class="rounded-full bg-white/15 font-medium text-white/70"
          :class="size === 'sm' ? 'px-1.5 py-px text-[9px]' : 'px-2 py-0.5 text-[10px]'"
        >{{ tag }}</span>
      </div>
      <p
        class="font-bold leading-snug text-white/90"
        :class="{
          'line-clamp-2 text-[11px]': size === 'sm',
          'line-clamp-2 text-sm': size === 'md',
          'line-clamp-3 text-base sm:text-lg': size === 'lg',
        }"
      >{{ title }}</p>
    </div>

    <!-- Auteur -->
    <div
      v-if="author && size !== 'sm' || author && size === 'sm'"
      class="relative flex shrink-0 items-center border-t border-white/[0.07]"
      :class="size === 'sm' ? 'gap-1.5 pt-2' : 'gap-2.5 pt-3'"
    >
      <img
        v-if="author?.avatar"
        :src="author.avatar ?? ''"
        :alt="author.name ?? ''"
        class="shrink-0 rounded-full object-cover"
        :class="size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'"
      />
      <div
        v-else-if="author?.name"
        class="flex shrink-0 items-center justify-center rounded-full bg-white/20 font-bold text-white/70"
        :class="size === 'sm' ? 'h-5 w-5 text-[8px]' : 'h-7 w-7 text-xs'"
      >
        {{ author.name.charAt(0) }}
      </div>
      <div class="min-w-0">
        <p
          class="truncate font-semibold text-white/80"
          :class="size === 'sm' ? 'text-[9px]' : 'text-[11px]'"
        >{{ author.name }}</p>
        <p
          v-if="size !== 'sm'"
          class="truncate text-white/40 text-[10px]"
        >{{ author.role }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
  url: string
  image: string
  cta?: string
}>()
</script>

<template>
  <aside
    class="not-prose my-10 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:gap-6"
    aria-label="Recommandation de ressource"
  >
    <!-- Couverture -->
    <a
      :href="url"
      target="_blank"
      rel="noopener noreferrer sponsored"
      class="mx-auto shrink-0 sm:mx-0"
      :aria-label="`Voir ${title}`"
    >
      <img
        :src="image"
        :alt="title"
        class="h-36 w-24 rounded-lg object-cover shadow-md transition-transform hover:scale-105"
        loading="lazy"
      />
    </a>

    <!-- Texte -->
    <div class="flex flex-col gap-3 text-center sm:text-left">
      <p class="text-xs font-semibold uppercase tracking-widest text-primary/70">
        Pour aller plus loin
      </p>
      <h3 class="text-base font-bold leading-snug text-foreground">
        {{ title }}
      </h3>
      <p class="text-sm leading-relaxed text-muted-foreground">
        {{ description }}
      </p>
      <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer sponsored"
        class="inline-flex w-fit items-center gap-1.5 self-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:self-start"
      >
        {{ cta ?? 'Voir sur Amazon' }}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
        </svg>
      </a>
    </div>
  </aside>
</template>

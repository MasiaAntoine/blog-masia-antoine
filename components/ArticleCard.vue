<script setup lang="ts">
import { Calendar, Clock, ArrowRight } from 'lucide-vue-next'
import { highlight } from '~/utils/highlight'

import type { PublicArticle } from '~/types/article'

const props = defineProps<{
  article: PublicArticle
  searchQuery?: string
}>()

const formattedDate = computed(() =>
  new Date(props.article.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
)

const slug = computed(() => (props.article.path ?? '').replace('/blog/', ''))

const highlightedTitle = computed(() =>
  highlight(props.article.title, props.searchQuery ?? '')
)
const highlightedDesc = computed(() =>
  highlight(props.article.description, props.searchQuery ?? '')
)
</script>

<template>
  <NuxtLink
    :to="`/blog/${slug}`"
    class="group flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
  >
    <!-- Miniature -->
    <div class="h-48 w-full overflow-hidden bg-muted">
      <img
        v-if="article.cover"
        :src="article.cover"
        :alt="article.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      <ArticleCover
        v-else
        :title="article.title"
        :tags="article.tags"
        :author="article.author"
        size="sm"
      />
    </div>

    <!-- Contenu -->
    <div class="flex flex-1 flex-col p-5">
      <!-- Tags -->
      <div v-if="article.tags?.length" class="mb-3 flex flex-wrap gap-1.5">
        <UiBadge v-for="tag in article.tags.slice(0, 3)" :key="tag" variant="muted">
          {{ tag }}
        </UiBadge>
      </div>

      <!-- Titre -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <h2
        class="mb-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary"
        v-html="highlightedTitle"
      />

      <!-- Description -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p
        class="mb-4 flex-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground"
        v-html="highlightedDesc"
      />

      <!-- Méta -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1.5">
            <Calendar class="h-3.5 w-3.5 shrink-0" />
            {{ formattedDate }}
          </span>
          <span v-if="article.readingTime" class="flex items-center gap-1.5">
            <Clock class="h-3.5 w-3.5 shrink-0" />
            {{ article.readingTime }}
          </span>
        </div>
        <ArrowRight
          class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
        />
      </div>
    </div>
  </NuxtLink>
</template>

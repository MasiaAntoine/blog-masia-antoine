<script setup lang="ts">
import { Calendar, Clock, ArrowRight } from 'lucide-vue-next'
import { highlight } from '~/utils/highlight'

interface Article {
  id: string
  path: string
  title: string
  description: string
  date: string
  tags?: string[]
  cover?: string
  body?: any
}

const props = defineProps<{
  article: Article
  hero?: boolean
  searchQuery?: string
}>()

const formattedDate = computed(() =>
  new Date(props.article.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
)

const slug = computed(() => (props.article.path ?? '').replace('/blog/', ''))

const readingTime = computed(() =>
  props.article.body ? useReadingTime(props.article.body) : null
)

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
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
  >
    <!-- Miniature -->
    <div class="w-full overflow-hidden bg-muted" :class="hero ? 'h-64 sm:h-72' : 'h-48'">
      <img
        v-if="article.cover"
        :src="article.cover"
        :alt="article.title"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        :loading="hero ? 'eager' : 'lazy'"
        :fetchpriority="hero ? 'high' : 'auto'"
        decoding="async"
      />
      <ArticleCover
        v-else
        :title="article.title"
        :tags="article.tags"
        :compact="!hero"
      />
    </div>

    <!-- Fond décoratif au hover -->
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
    />

    <!-- Contenu -->
    <div class="relative flex flex-1 flex-col p-6" :class="hero ? 'sm:p-8' : ''">
      <!-- Tags -->
      <div v-if="article.tags?.length" class="mb-3 flex flex-wrap gap-1.5">
        <UiBadge v-for="tag in article.tags.slice(0, 4)" :key="tag" variant="muted">
          {{ tag }}
        </UiBadge>
      </div>

      <!-- Titre -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <h2
        class="mb-3 font-bold leading-tight text-foreground transition-colors group-hover:text-primary"
        :class="hero ? 'text-2xl sm:text-3xl' : 'text-xl'"
        v-html="highlightedTitle"
      />

      <!-- Description -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p
        class="flex-1 leading-relaxed text-muted-foreground"
        :class="[hero ? 'text-base line-clamp-3' : 'text-sm line-clamp-2', 'mb-5']"
        v-html="highlightedDesc"
      />

      <!-- Méta + CTA -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 text-xs text-muted-foreground">
          <span class="flex items-center gap-1.5">
            <Calendar class="h-3.5 w-3.5 shrink-0" />
            {{ formattedDate }}
          </span>
          <span v-if="readingTime" class="flex items-center gap-1.5">
            <Clock class="h-3.5 w-3.5 shrink-0" />
            {{ readingTime }}
          </span>
        </div>
        <span
          class="flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          Lire
          <ArrowRight class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>

    <!-- Barre accent -->
    <div class="h-0.5 w-0 bg-gradient-to-r from-primary to-primary/40 transition-all duration-500 group-hover:w-full" />
  </NuxtLink>
</template>

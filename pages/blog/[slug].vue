<script setup lang="ts">
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-vue-next'
import type { PublicArticle, PublicArticleFull } from '~/types/article'

const route = useRoute()
const slug = route.params.slug as string

const { data: article } = await useAsyncData(`blog-${slug}`, () =>
  $fetch<PublicArticleFull>(`/api/articles/${slug}`)
)

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
}

// Tracking des vues (uniquement côté client, après hydratation)
if (import.meta.client && article.value?.id) {
  usePageTracking(article.value.id)
}

// Articles précédent et suivant
const { data: allArticles } = await useAsyncData('all-slugs', () =>
  $fetch<PublicArticle[]>('/api/articles')
)

const currentIndex = computed(() =>
  allArticles.value?.findIndex((a) => a.slug === slug) ?? -1
)

const prevArticle = computed(() =>
  currentIndex.value !== -1 && currentIndex.value < (allArticles.value?.length ?? 0) - 1
    ? allArticles.value![currentIndex.value + 1]
    : null
)

const nextArticle = computed(() =>
  currentIndex.value > 0 ? allArticles.value![currentIndex.value - 1] : null
)

import { SITE_URL } from '~/utils/site'
const AUTHOR = {
  name: 'MASIA Antoine',
  url: 'https://masia-antoine.fr',
  sameAs: ['https://github.com/MasiaAntoine', 'https://www.linkedin.com/in/antoine-masia-403a17228/'],
}

useSeoMeta({
  title: () => `${article.value?.title ?? ''} — Le Blog d'Antoine`,
  description: () => article.value?.description ?? '',
  ogTitle: () => article.value?.title ?? '',
  ogDescription: () => article.value?.description ?? '',
  ogType: 'article',
  ogUrl: () => `${SITE_URL}/blog/${slug}`,
  articlePublishedTime: () => article.value?.date ?? '',
  articleAuthor: [article.value?.author?.name ?? AUTHOR.name],
  twitterCard: 'summary_large_image',
  twitterTitle: () => article.value?.title ?? '',
  twitterDescription: () => article.value?.description ?? '',
})

if (article.value?.cover) {
  useSeoMeta({
    ogImage: article.value.cover,
    twitterImage: article.value.cover,
  })
} else {
  defineOgImage('BlogPost', {
    title: article.value?.title,
    description: article.value?.description,
    tags: article.value?.tags,
    authorName: article.value?.author?.name,
    authorRole: article.value?.author?.role,
    authorAvatar: article.value?.author?.avatar,
    coverColor: article.value?.author?.coverColor ?? undefined,
  })
}

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.value?.title ?? '',
          description: article.value?.description ?? '',
          datePublished: article.value?.date ?? '',
          image: article.value?.cover ?? undefined,
          url: `${SITE_URL}/blog/${slug}`,
          inLanguage: 'fr',
          author: {
            '@type': 'Person',
            name: article.value?.author?.name ?? AUTHOR.name,
            url: AUTHOR.url,
            sameAs: AUTHOR.sameAs,
          },
          publisher: {
            '@type': 'Person',
            name: article.value?.author?.name ?? AUTHOR.name,
            url: AUTHOR.url,
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/blog/${slug}`,
          },
        })
      ),
    },
  ],
})

const formattedDate = computed(() => {
  if (!article.value?.date) return ''
  return new Date(article.value.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const tocLinks = computed(() => article.value?.toc ?? [])
const readingTime = computed(() => article.value?.readingTime ?? null)

function trackSidebarClick() {
  if (!article.value?.id) return
  const key = 'blog_session_id'
  const id = sessionStorage.getItem(key)
    ?? (() => { const s = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2); sessionStorage.setItem(key, s); return s })()
  $fetch('/api/track/click', { method: 'POST', body: { article_id: article.value.id, session_id: id, source: 'sidebar' } }).catch(() => {})
}
</script>

<template>
  <div v-if="article" class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <div class="lg:grid lg:grid-cols-[1fr_220px] lg:gap-20">
      <article class="min-w-0">
        <!-- Retour -->
        <NuxtLink
          to="/"
          class="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft class="h-4 w-4" />
          Tous les articles
        </NuxtLink>

        <!-- En-tête -->
        <header class="mb-10">
          <!-- Miniature -->
          <div class="mb-8 h-64 overflow-hidden rounded-xl">
            <img
              v-if="article.cover"
              :src="article.cover"
              :alt="article.title"
              class="h-full w-full object-cover"
              fetchpriority="high"
              decoding="async"
            />
            <ArticleCover
              v-else
              :title="article.title"
              :tags="article.tags"
              :author="article.author"
            />
          </div>

          <div v-if="article.tags?.length" class="mb-4 flex flex-wrap gap-1.5">
            <UiBadge v-for="tag in article.tags" :key="tag" variant="muted">
              {{ tag }}
            </UiBadge>
          </div>

          <h1 class="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {{ article.title }}
          </h1>

          <p class="mb-6 text-lg leading-relaxed text-muted-foreground">
            {{ article.description }}
          </p>

          <div class="flex flex-wrap items-center gap-5 border-b border-border pb-8 text-sm text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <Calendar class="h-4 w-4 shrink-0" />
              {{ formattedDate }}
            </span>
            <span v-if="readingTime" class="flex items-center gap-1.5">
              <Clock class="h-4 w-4 shrink-0" />
              {{ readingTime }}
            </span>
          </div>
        </header>

        <!-- Corps de l'article (markdown → HTML) -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="prose prose-gray max-w-none
                 prose-headings:scroll-mt-20
                 prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                 prose-code:before:content-none prose-code:after:content-none"
          v-html="article.contentHtml"
        />

        <!-- Placement produit -->
        <ProductPlacement
          v-if="article.product"
          :article-id="article.id"
          :title="article.product.title"
          :description="article.product.description"
          :url="article.product.url"
          :image="article.product.image"
          :cta="article.product.cta"
        />

        <!-- Auteur -->
        <div v-if="article.author" class="mt-12">
          <AuthorCard
            :name="article.author.name"
            :role="article.author.role"
            :avatar="article.author.avatar"
          />
        </div>

        <!-- Navigation précédent / suivant -->
        <nav
          v-if="prevArticle || nextArticle"
          class="mt-12 border-t border-border pt-8"
          aria-label="Navigation entre articles"
        >
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NuxtLink
              v-if="nextArticle"
              :to="nextArticle.path"
              class="group flex flex-col gap-2 rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <span class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ArrowLeft class="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                Article suivant
              </span>
              <div class="flex items-center gap-3">
                <div v-if="nextArticle.cover" class="h-12 w-16 shrink-0 overflow-hidden rounded-md">
                  <img :src="nextArticle.cover ?? ''" :alt="nextArticle.title" class="h-full w-full object-cover" loading="lazy" />
                </div>
                <p class="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  {{ nextArticle.title }}
                </p>
              </div>
            </NuxtLink>

            <div v-else class="hidden sm:block" />

            <NuxtLink
              v-if="prevArticle"
              :to="prevArticle.path"
              class="group flex flex-col gap-2 rounded-xl border border-border bg-background p-4 text-right transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <span class="flex items-center justify-end gap-1.5 text-xs font-medium text-muted-foreground">
                Article précédent
                <ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
              <div class="flex items-center justify-end gap-3">
                <p class="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  {{ prevArticle.title }}
                </p>
                <div v-if="prevArticle.cover" class="h-12 w-16 shrink-0 overflow-hidden rounded-md">
                  <img :src="prevArticle.cover ?? ''" :alt="prevArticle.title" class="h-full w-full object-cover" loading="lazy" />
                </div>
              </div>
            </NuxtLink>
          </div>
        </nav>
      </article>

      <!-- Table des matières + mini produit -->
      <aside class="hidden lg:block lg:self-start lg:sticky lg:top-24">
        <TableOfContents :links="tocLinks" />

        <!-- Mini placement produit -->
        <div v-if="article.product" class="mt-6 border-t border-border pt-6">
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Pour aller plus loin
          </p>
          <div class="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <a
              :href="article.product.url"
              target="_blank"
              rel="noopener noreferrer sponsored"
              class="shrink-0"
              :aria-label="`Voir ${article.product.title}`"
              @click="trackSidebarClick"
            >
              <img
                :src="article.product.image"
                :alt="article.product.title"
                class="h-20 w-14 rounded-lg object-cover shadow-sm transition-transform duration-200 hover:scale-105"
                loading="lazy"
              />
            </a>
            <div class="min-w-0 space-y-2">
              <p class="text-xs font-semibold leading-snug text-foreground">
                {{ article.product.title }}
              </p>
              <a
                :href="article.product.url"
                target="_blank"
                rel="noopener noreferrer sponsored"
                class="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                @click="trackSidebarClick"
              >
                {{ article.product.cta ?? 'Voir sur Amazon' }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M7 7h10v10" /><path d="M7 17 17 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

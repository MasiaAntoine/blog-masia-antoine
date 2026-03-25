<script setup lang="ts">
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-vue-next'

const route = useRoute()
const slug = route.params.slug as string


const { data: article } = await useAsyncData(`blog-${slug}`, () =>
  queryCollection('blog').path('/blog/' + slug).first()
)

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
}

// Articles précédent et suivant
const { data: allArticles } = await useAsyncData('all-slugs', () =>
  queryCollection('blog').select('path', 'title', 'description', 'cover', 'date').order('date', 'DESC').all()
)

const currentIndex = computed(() =>
  allArticles.value?.findIndex((a) => a.path === `/blog/${slug}`) ?? -1
)

// Articles triés par date desc → index plus grand = plus ancien = précédent
const prevArticle = computed(() =>
  currentIndex.value !== -1 && currentIndex.value < (allArticles.value?.length ?? 0) - 1
    ? allArticles.value![currentIndex.value + 1]
    : null
)

// Index plus petit = plus récent = suivant
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
  articleAuthor: [AUTHOR.name],
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
  defineOgImage({
    component: 'BlogPostSatori',
    title: article.value?.title,
    description: article.value?.description,
    tags: article.value?.tags,
    authorName: article.value?.author?.name,
    authorRole: article.value?.author?.role,
    authorAvatar: article.value?.author?.avatar,
  })
}

// JSON-LD BlogPosting (Google rich results + entité "auteur")
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
            name: AUTHOR.name,
            url: AUTHOR.url,
            sameAs: AUTHOR.sameAs,
          },
          publisher: {
            '@type': 'Person',
            name: AUTHOR.name,
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

const tocLinks = computed(() => article.value?.body?.toc?.links ?? [])

const readingTime = computed(() =>
  article.value?.body ? useReadingTime(article.value.body) : null
)
</script>

<template>
  <div v-if="article" class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <!-- Layout avec TOC latérale sur desktop -->
    <div class="lg:grid lg:grid-cols-[1fr_220px] lg:gap-20">
      <!-- Contenu principal -->
      <!-- min-w-0 empêche l'article de dépasser la colonne du grid (min-width: auto par défaut) -->
      <article class="min-w-0">
        <!-- Retour -->
        <NuxtLink
          to="/"
          class="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft class="h-4 w-4" />
          Tous les articles
        </NuxtLink>

        <!-- En-tête de l'article -->
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

          <h1
            class="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {{ article.title }}
          </h1>

          <p class="mb-6 text-lg leading-relaxed text-muted-foreground">
            {{ article.description }}
          </p>

          <div
            class="flex flex-wrap items-center gap-5 border-b border-border pb-8 text-sm text-muted-foreground"
          >
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

        <!-- Corps de l'article -->
        <ContentRenderer
          :value="article"
          class="prose prose-gray max-w-none
                 prose-headings:scroll-mt-20
                 prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                 prose-code:before:content-none prose-code:after:content-none"
        />

        <!-- Placement produit -->
        <ProductPlacement
          v-if="article.product"
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
            :profile-url="article.author.profileUrl"
          />
        </div>

        <!-- Navigation précédent / suivant -->
        <nav
          v-if="prevArticle || nextArticle"
          class="mt-12 border-t border-border pt-8"
          aria-label="Navigation entre articles"
        >
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <!-- Article suivant (plus récent) — gauche -->
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
                <div
                  v-if="nextArticle.cover"
                  class="h-12 w-16 shrink-0 overflow-hidden rounded-md"
                >
                  <img
                    :src="nextArticle.cover"
                    :alt="nextArticle.title"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p class="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  {{ nextArticle.title }}
                </p>
              </div>
            </NuxtLink>

            <!-- Placeholder si pas de suivant -->
            <div v-else class="hidden sm:block" />

            <!-- Article précédent (plus ancien) — droite -->
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
                <div
                  v-if="prevArticle.cover"
                  class="h-12 w-16 shrink-0 overflow-hidden rounded-md"
                >
                  <img
                    :src="prevArticle.cover"
                    :alt="prevArticle.title"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </NuxtLink>
          </div>
        </nav>
      </article>

      <!-- Table des matières (desktop uniquement) -->
      <!-- self-start empêche l'aside de s'étirer à la hauteur du grid (sinon sticky n'a rien à quoi se coller) -->
      <aside class="hidden lg:block lg:self-start lg:sticky lg:top-24">
        <TableOfContents :links="tocLinks" />
      </aside>
    </div>
  </div>
</template>

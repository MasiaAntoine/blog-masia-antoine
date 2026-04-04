<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import type { PublicArticle } from '~/types/article'

const { data: articles } = await useAsyncData('articles', () =>
  $fetch<PublicArticle[]>('/api/articles')
)

interface Profile { id: string; name: string; role: string; avatar_url: string | null }
const { data: profiles } = await useAsyncData('profiles', () =>
  $fetch<Profile[]>('/api/profiles')
)

import { SITE_URL } from '~/utils/site'

useSeoMeta({
  title: "Le Blog d'Antoine — MASIA Antoine",
  description:
    "Le blog de MASIA Antoine — développeur Full-Stack, DevOps & CyberSécurité. Veille technique, guides pratiques et retours d'expérience.",
  ogTitle: "Le Blog d'Antoine — MASIA Antoine",
  ogDescription:
    "Le blog de MASIA Antoine — développeur Full-Stack, DevOps & CyberSécurité. Veille technique, guides pratiques et retours d'expérience.",
  ogType: 'website',
  ogUrl: SITE_URL,
  twitterCard: 'summary',
  twitterTitle: "Le Blog d'Antoine — MASIA Antoine",
  twitterDescription:
    "Le blog de MASIA Antoine — développeur Full-Stack, DevOps & CyberSécurité.",
})

// JSON-LD Blog + Person (Google Knowledge Graph)
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Blog',
            '@id': `${SITE_URL}/#blog`,
            name: "Le Blog d'Antoine",
            url: SITE_URL,
            description:
              "Veille technique, guides pratiques et retours d'expérience par MASIA Antoine.",
            inLanguage: 'fr',
            author: { '@id': `${SITE_URL}/#author` },
          },
          {
            '@type': 'Person',
            '@id': `${SITE_URL}/#author`,
            name: 'MASIA Antoine',
            url: 'https://masia-antoine.fr',
            jobTitle: 'Développeur Full-Stack, DevOps & CyberSécurité',
            image: 'https://avatars.githubusercontent.com/u/115811899',
            sameAs: [
              'https://github.com/MasiaAntoine',
              'https://www.linkedin.com/in/antoine-masia-403a17228/',
              'https://masia-antoine.fr',
            ],
          },
        ],
      }),
    },
  ],
})

// ─── Recherche & filtres ────────────────────────────────────────
const searchQuery = ref('')
const activeTags = ref<string[]>([])
const selectedAuthors = ref<string[]>([])

const allTags = computed(() => {
  const set = new Set<string>()
  articles.value?.forEach((a) => a.tags?.forEach((t: string) => set.add(t)))
  return Array.from(set).sort()
})

const isFiltering = computed(
  () => searchQuery.value.trim().length > 0 || activeTags.value.length > 0 || selectedAuthors.value.length > 0,
)

function clearFilters() {
  searchQuery.value = ''
  activeTags.value = []
  selectedAuthors.value = []
  visibleCount.value = INITIAL_COUNT
}

// ─── Articles filtrés ──────────────────────────────────────────
const filteredArticles = computed(() => {
  let list = articles.value ?? []
  if (activeTags.value.length > 0) {
    list = list.filter((a) => activeTags.value.every(t => a.tags?.includes(t)))
  }
  if (selectedAuthors.value.length > 0) {
    const selectedNames = new Set(
      (profiles.value ?? [])
        .filter(p => selectedAuthors.value.includes(p.id))
        .map(p => p.name),
    )
    list = list.filter((a) => a.author?.name && selectedNames.has(a.author.name))
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.tags?.some((t: string) => t.toLowerCase().includes(q)),
    )
  }
  return list
})

// ─── Mode normal (sans filtre) ─────────────────────────────────
const featuredArticles = computed(() => (articles.value ?? []).slice(0, 3))

const INITIAL_COUNT = 6
const LOAD_MORE_COUNT = 6
const visibleCount = ref(INITIAL_COUNT)

const regularArticles = computed(() =>
  (articles.value ?? []).slice(3, 3 + visibleCount.value)
)
const totalRegular = computed(() => Math.max(0, (articles.value?.length ?? 0) - 3))
const canLoadMore = computed(() => visibleCount.value < totalRegular.value)

watch([searchQuery, activeTags, selectedAuthors], () => {
  visibleCount.value = INITIAL_COUNT
})

// ─── Mode filtrage ─────────────────────────────────────────────
const FILTERED_INITIAL = 12
const FILTERED_MORE = 6
const filteredVisible = ref(FILTERED_INITIAL)

const visibleFiltered = computed(() =>
  filteredArticles.value.slice(0, filteredVisible.value)
)
const canLoadMoreFiltered = computed(
  () => filteredVisible.value < filteredArticles.value.length,
)

watch(isFiltering, () => {
  filteredVisible.value = FILTERED_INITIAL
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <!-- ── Hero ──────────────────────────────────────────────── -->
    <section class="mb-14">
      <p class="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
        <span class="h-px w-6 bg-primary" />
        Le Blog d'Antoine
      </p>
      <h1 class="mb-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        Ce qu'on <span class="text-primary">apprend</span>,<br class="hidden sm:block" />
        ce qu'on <span class="text-primary">maîtrise</span>.
      </h1>
      <p class="mb-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Des auteurs aux parcours différents — tech, psychologie, finance et bien d'autres —
        qui partagent ce qu'ils explorent vraiment.
        <span class="text-foreground font-medium">Pas de filtre, juste ce qu'on vit.</span>
      </p>

      <!-- Avatars des auteurs -->
      <AuthorGroup v-if="profiles?.length" :profiles="profiles" />
    </section>

    <!-- ── Recherche + Tags ──────────────────────────────────── -->
    <section class="mb-12 space-y-4">
      <!-- Barre de recherche + filtre -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1 max-w-xl">
          <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Rechercher un article, un sujet…"
            class="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer la recherche"
            @click="searchQuery = ''"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Filtre (tags + auteurs) -->
        <TagFilterPopover
          :active-tags="activeTags"
          :tags="allTags"
          :profiles="profiles ?? []"
          :selected-authors="selectedAuthors"
          @update:active-tags="activeTags = $event"
          @update:selected-authors="selectedAuthors = $event"
        />
      </div>

      <!-- Résumé du filtre actif -->
      <div v-if="isFiltering" class="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          <strong class="text-foreground">{{ filteredArticles.length }}</strong>
          article{{ filteredArticles.length !== 1 ? 's' : '' }} trouvé{{ filteredArticles.length !== 1 ? 's' : '' }}
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md text-xs text-primary hover:underline"
          @click="clearFilters"
        >
          <X class="h-3 w-3" />
          Réinitialiser
        </button>
      </div>
    </section>

    <!-- ══ MODE FILTRAGE ══════════════════════════════════════ -->
    <template v-if="isFiltering">
      <div v-if="visibleFiltered.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ArticleCard
          v-for="article in visibleFiltered"
          :key="article.id"
          :article="article"
          :search-query="searchQuery"
        />
      </div>

      <div
        v-else
        class="rounded-xl border border-dashed border-border px-6 py-20 text-center"
      >
        <p class="text-sm text-muted-foreground">Aucun article ne correspond à votre recherche.</p>
        <button
          type="button"
          class="mt-3 text-sm text-primary hover:underline"
          @click="clearFilters"
        >
          Réinitialiser les filtres
        </button>
      </div>

      <div v-if="canLoadMoreFiltered" class="mt-10 flex justify-center">
        <button
          class="inline-flex items-center gap-2.5 rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary/40 hover:text-primary hover:shadow-md"
          @click="filteredVisible += FILTERED_MORE"
        >
          Voir plus
          <span class="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            +{{ Math.min(FILTERED_MORE, filteredArticles.length - filteredVisible) }}
          </span>
        </button>
      </div>
    </template>

    <!-- ══ MODE NORMAL ════════════════════════════════════════ -->
    <template v-else>
      <!-- Articles en vedette (top 3) -->
      <section v-if="featuredArticles.length" class="mb-16">
        <div class="mb-8 flex items-center gap-3">
          <h2 class="text-xl font-semibold text-foreground">À la une</h2>
          <span class="h-px flex-1 bg-border" />
        </div>

        <div class="mb-4">
          <ArticleCardFeatured v-if="featuredArticles[0]" :article="featuredArticles[0]" :hero="true" />
        </div>

        <div v-if="featuredArticles.length > 1" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ArticleCardFeatured
            v-for="article in featuredArticles.slice(1, 3)"
            :key="article.id"
            :article="article"
          />
        </div>
      </section>

      <!-- Grille des articles suivants -->
      <section v-if="regularArticles.length">
        <div class="mb-8 flex items-center gap-3">
          <h2 class="text-xl font-semibold text-foreground">Tous les articles</h2>
          <span class="h-px flex-1 bg-border" />
          <span class="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {{ articles?.length ?? 0 }} articles
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleCard
            v-for="article in regularArticles"
            :key="article.id"
            :article="article"
          />
        </div>

        <div v-if="canLoadMore" class="mt-12 flex justify-center">
          <button
            class="group inline-flex items-center gap-2.5 rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary/40 hover:text-primary hover:shadow-md"
            @click="visibleCount += LOAD_MORE_COUNT"
          >
            Voir plus d'articles
            <span class="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              +{{ Math.min(LOAD_MORE_COUNT, totalRegular - visibleCount) }}
            </span>
          </button>
        </div>

        <div v-else-if="totalRegular > 0" class="mt-10 text-center text-sm text-muted-foreground">
          Vous avez tout lu — revenez bientôt pour de nouveaux articles !
        </div>
      </section>
    </template>
  </div>
</template>

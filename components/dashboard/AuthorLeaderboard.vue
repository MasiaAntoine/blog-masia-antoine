<script setup lang="ts">
import { Users, Eye, Crown, FileText } from 'lucide-vue-next'

interface AuthorEntry {
  authorId: string
  name: string
  avatar: string | null
  coverColor: string
  sessions: number
  views: number
  articles: number
}

type Metric = 'sessions' | 'views' | 'articles'
type Period = 'today' | '7d' | '30d' | '90d' | '365d'

const props = defineProps<{ period: Period }>()

const metric = ref<Metric>('sessions')
const data = ref<AuthorEntry[]>([])
const loading = ref(true)

async function fetch_() {
  loading.value = true
  data.value = await $fetch<AuthorEntry[]>('/api/stats/leaderboard', {
    query: { period: props.period },
  }).catch(() => [])
  loading.value = false
}

watch(() => props.period, fetch_, { immediate: true })

const sorted = computed(() =>
  [...data.value].sort((a, b) => b[metric.value] - a[metric.value]),
)

const top3 = computed(() => sorted.value.slice(0, 3))
const rest  = computed(() => sorted.value.slice(3))

// Ordre podium : 2ème à gauche, 1er au centre, 3ème à droite
const podiumOrder = computed(() => {
  const t = top3.value
  if (t.length === 1) return [t[0]]
  if (t.length === 2) return [t[1], t[0]]
  return [t[1], t[0], t[2]]
})

function podiumRank(entry: AuthorEntry): number {
  return sorted.value.indexOf(entry) + 1
}

function podiumHeight(rank: number): string {
  return rank === 1 ? 'h-28' : rank === 2 ? 'h-20' : 'h-16'
}

function podiumLabel(rank: number): string {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
}

function metricValue(entry: AuthorEntry): number {
  return metric.value === 'sessions' ? entry.sessions : entry.views
}

function formatNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString()
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="rounded-xl border border-border bg-background p-6">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-foreground">Classement des auteurs</h2>
        <p class="mt-0.5 text-xs text-muted-foreground">Qui génère le plus de trafic sur le blog</p>
      </div>
      <!-- Toggle métrique -->
      <div class="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
        <button
          :class="[
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
            metric === 'sessions' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="metric = 'sessions'"
        >
          <Users class="h-3.5 w-3.5" /> Visiteurs
        </button>
        <button
          :class="[
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
            metric === 'views' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="metric = 'views'"
        >
          <Eye class="h-3.5 w-3.5" /> Vues
        </button>
        <button
          :class="[
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
            metric === 'articles' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="metric = 'articles'"
        >
          <FileText class="h-3.5 w-3.5" /> Articles
        </button>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="flex items-end justify-center gap-6">
        <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-2">
          <div class="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div class="h-3 w-16 animate-pulse rounded bg-muted" />
          <div class="w-20 animate-pulse rounded-t-lg bg-muted" :class="i === 2 ? 'h-28' : i === 1 ? 'h-20' : 'h-16'" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!sorted.length" class="py-12 text-center text-sm text-muted-foreground">
      Aucune donnée sur cette période.
    </div>

    <div v-else>
      <!-- Podium top 3 -->
      <div class="mb-8 flex items-end justify-center gap-4 sm:gap-8">
        <div
          v-for="entry in podiumOrder"
          :key="entry.authorId"
          class="flex flex-col items-center gap-2"
        >
          <!-- Avatar + couronne -->
          <div class="relative">
            <Crown
              v-if="podiumRank(entry) === 1"
              class="absolute -top-5 left-1/2 h-4 w-4 -translate-x-1/2 text-yellow-500"
            />
            <div
              v-if="entry.avatar"
              class="overflow-hidden rounded-full border-2 shadow-md"
              :class="podiumRank(entry) === 1 ? 'h-14 w-14 border-yellow-400' : 'h-11 w-11 border-border'"
            >
              <img :src="entry.avatar" :alt="entry.name" class="h-full w-full object-cover" />
            </div>
            <div
              v-else
              class="flex items-center justify-center rounded-full border-2 font-bold text-white shadow-md"
              :class="[
                podiumRank(entry) === 1 ? 'h-14 w-14 text-base border-yellow-400' : 'h-11 w-11 text-sm border-border',
              ]"
              :style="{ backgroundColor: entry.coverColor }"
            >
              {{ initials(entry.name) }}
            </div>
          </div>

          <!-- Nom + métrique -->
          <div class="text-center">
            <p class="max-w-[80px] truncate text-xs font-semibold text-foreground">{{ entry.name.split(' ')[0] }}</p>
            <p class="text-xs text-muted-foreground">{{ formatNum(metricValue(entry)) }}</p>
          </div>

          <!-- Barre podium -->
          <div
            class="w-20 rounded-t-xl flex items-center justify-center sm:w-24"
            :class="podiumHeight(podiumRank(entry))"
            :style="{ backgroundColor: entry.coverColor + '33' }"
          >
            <span class="text-xl">{{ podiumLabel(podiumRank(entry)) }}</span>
          </div>
        </div>
      </div>

      <!-- Reste du classement -->
      <div v-if="rest.length" class="space-y-1">
        <div
          v-for="(entry, i) in rest"
          :key="entry.authorId"
          class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/40"
        >
          <span class="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">{{ i + 4 }}</span>
          <div
            v-if="entry.avatar"
            class="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border"
          >
            <img :src="entry.avatar" :alt="entry.name" class="h-full w-full object-cover" />
          </div>
          <div
            v-else
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            :style="{ backgroundColor: entry.coverColor }"
          >
            {{ initials(entry.name) }}
          </div>
          <span class="flex-1 truncate text-sm font-medium text-foreground">{{ entry.name }}</span>
          <span class="text-sm font-semibold text-foreground">{{ formatNum(metricValue(entry)) }}</span>
          <span class="w-16 text-xs text-muted-foreground">{{ metric === 'sessions' ? 'visiteurs' : metric === 'views' ? 'vues' : 'articles' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users, Eye, FileText, Crown, Trophy } from 'lucide-vue-next'

definePageMeta({ middleware: 'dashboard', layout: 'dashboard' })

type Metric = 'sessions' | 'views' | 'articles'
type Period = 'today' | '7d' | '30d' | '90d' | '365d'

interface AuthorEntry {
  authorId: string
  name: string
  role: string
  avatar: string | null
  coverColor: string
  sessions: number
  views: number
  articles: number
}

const periods: { key: Period; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
  { key: '365d', label: '1 an' },
]

const metrics: { key: Metric; label: string; icon: any }[] = [
  { key: 'sessions', label: 'Visiteurs', icon: Users },
  { key: 'views', label: 'Vues', icon: Eye },
  { key: 'articles', label: 'Articles', icon: FileText },
]

const currentPeriod = ref<Period>('30d')
const currentMetric = ref<Metric>('sessions')
const data = ref<AuthorEntry[]>([])
const loading = ref(true)

async function fetchData() {
  loading.value = true
  data.value = await $fetch<AuthorEntry[]>('/api/stats/leaderboard', {
    query: { period: currentPeriod.value },
  }).catch(() => [])
  loading.value = false
}

watch(currentPeriod, fetchData, { immediate: true })

const sorted = computed(() =>
  [...data.value].sort((a, b) => b[currentMetric.value] - a[currentMetric.value]),
)

const top3 = computed(() => sorted.value.slice(0, 3))
const rest = computed(() => sorted.value.slice(3))

// Ordre podium : 2ème à gauche, 1er au centre, 3ème à droite
const podiumOrder = computed(() => {
  const t = top3.value
  if (t.length === 0) return []
  if (t.length === 1) return [{ entry: t[0]!, rank: 1 }]
  if (t.length === 2) return [{ entry: t[1]!, rank: 2 }, { entry: t[0]!, rank: 1 }]
  return [
    { entry: t[1]!, rank: 2 },
    { entry: t[0]!, rank: 1 },
    { entry: t[2]!, rank: 3 },
  ]
})

const podiumHeights: Record<number, string> = { 1: 'h-36', 2: 'h-24', 3: 'h-16' }
const podiumBarStyles: Record<number, { bg: string; border: string; medal: { ribbon: string; circle: string; shine: string; number: string } }> = {
  1: {
    bg: '#F59E0B',
    border: '#D97706',
    medal: { ribbon: '#F59E0B', circle: '#FCD34D', shine: '#FEF9E7', number: '#92400E' },
  },
  2: {
    bg: '#94A3B8',
    border: '#64748B',
    medal: { ribbon: '#94A3B8', circle: '#CBD5E1', shine: '#F8FAFC', number: '#334155' },
  },
  3: {
    bg: '#CD7C2F',
    border: '#B45309',
    medal: { ribbon: '#D97706', circle: '#FCA34D', shine: '#FEF3C7', number: '#78350F' },
  },
}

function metricValue(entry: AuthorEntry): number {
  return entry[currentMetric.value]
}

function metricLabel(v: number): string {
  const m = metrics.find(m => m.key === currentMetric.value)
  if (currentMetric.value === 'articles') return v === 1 ? 'article' : 'articles'
  if (currentMetric.value === 'sessions') return v === 1 ? 'visiteur' : 'visiteurs'
  return v === 1 ? 'vue' : 'vues'
  return m?.label.toLowerCase() ?? ''
}

function formatNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString()
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="p-6 lg:p-8">
    <!-- Header -->
    <div class="mb-8 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Trophy class="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-foreground">Classement</h1>
        <p class="mt-0.5 text-sm text-muted-foreground">Tous les auteurs du blog</p>
      </div>
    </div>

    <!-- Contrôles -->
    <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <!-- Période -->
      <div class="flex w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1 sm:w-auto">
        <button
          v-for="p in periods"
          :key="p.key"
          :class="[
            'shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition-all touch-manipulation',
            currentPeriod === p.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="currentPeriod = p.key"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Métrique -->
      <div class="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
        <button
          v-for="m in metrics"
          :key="m.key"
          :class="[
            'flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all touch-manipulation',
            currentMetric === m.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="currentMetric = m.key"
        >
          <component :is="m.icon" class="h-3.5 w-3.5" />
          {{ m.label }}
        </button>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading">
      <div class="mb-10 flex items-end justify-center gap-8">
        <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-3">
          <div class="h-16 w-16 animate-pulse rounded-full bg-muted" />
          <div class="h-3 w-20 animate-pulse rounded bg-muted" />
          <div class="w-28 animate-pulse rounded-t-2xl bg-muted" :class="i === 2 ? 'h-36' : i === 1 ? 'h-24' : 'h-16'" />
        </div>
      </div>
      <div class="space-y-2">
        <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded-xl bg-muted/40" />
      </div>
    </div>

    <div v-else-if="!sorted.length" class="py-20 text-center text-sm text-muted-foreground">
      Aucun auteur enregistré.
    </div>

    <div v-else>
      <!-- ── Podium ── -->
      <div class="mb-10 flex items-end justify-center gap-6 sm:gap-10">
        <div
          v-for="{ entry, rank } in podiumOrder"
          :key="entry.authorId"
          class="flex flex-col items-center gap-3"
        >
          <!-- Avatar -->
          <div class="relative">
            <Crown
              v-if="rank === 1"
              class="absolute -top-6 left-1/2 h-5 w-5 -translate-x-1/2 text-yellow-500 drop-shadow"
            />
            <div
              v-if="entry.avatar"
              class="overflow-hidden rounded-full border-2 shadow-lg"
              :class="rank === 1 ? 'h-20 w-20 border-yellow-400' : rank === 2 ? 'h-14 w-14 border-border' : 'h-12 w-12 border-border'"
            >
              <img :src="entry.avatar" :alt="entry.name" class="h-full w-full object-cover" />
            </div>
            <div
              v-else
              class="flex items-center justify-center rounded-full border-2 font-bold text-white shadow-lg"
              :class="rank === 1 ? 'h-20 w-20 text-xl border-yellow-400' : rank === 2 ? 'h-14 w-14 text-base border-border' : 'h-12 w-12 text-sm border-border'"
              :style="{ backgroundColor: entry.coverColor }"
            >
              {{ initials(entry.name) }}
            </div>
          </div>

          <!-- Nom + score -->
          <div class="text-center">
            <p class="max-w-[90px] truncate text-sm font-bold text-foreground sm:max-w-[120px]">
              {{ entry.name.split(' ')[0] }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ formatNum(metricValue(entry)) }} {{ metricLabel(metricValue(entry)) }}
            </p>
          </div>

          <!-- Barre style Duolingo -->
          <div
            class="relative w-24 overflow-hidden rounded-t-2xl sm:w-32"
            :class="podiumHeights[rank]"
            :style="{
              backgroundColor: podiumBarStyles[rank]!.bg,
              boxShadow: `inset 0 -4px 0 ${podiumBarStyles[rank]!.border}`,
            }"
          >
            <!-- Bande blanche effet shine -->
            <div class="absolute inset-x-3 top-2.5 h-2.5 rounded-full bg-white/40" />

            <!-- Rond avec chiffre -->
            <div class="absolute inset-0 flex items-center justify-center">
              <svg :width="rank === 1 ? 36 : 30" :height="rank === 1 ? 36 : 30" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="16" :fill="podiumBarStyles[rank]!.medal.circle" />
                <circle cx="18" cy="18" r="16" :stroke="podiumBarStyles[rank]!.medal.ribbon" stroke-width="1.5" fill="none" />
                <ellipse cx="14" cy="13" rx="3.5" ry="2" :fill="podiumBarStyles[rank]!.medal.shine" opacity="0.6" />
                <text x="18" y="23" text-anchor="middle" font-family="system-ui, sans-serif"
                  :font-size="rank === 1 ? '15' : '13'" font-weight="800"
                  :fill="podiumBarStyles[rank]!.medal.number">{{ rank }}</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Liste (4ème et au-delà) ── -->
      <div v-if="rest.length" class="overflow-hidden rounded-xl border border-border">
        <div
          v-for="(entry, i) in rest"
          :key="entry.authorId"
          class="flex items-center gap-4 border-b border-border px-5 py-4 last:border-0 transition-colors hover:bg-muted/30"
        >
          <!-- Rang -->
          <span class="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">
            {{ i + 4 }}
          </span>

          <!-- Avatar -->
          <div
            v-if="entry.avatar"
            class="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border"
          >
            <img :src="entry.avatar" :alt="entry.name" class="h-full w-full object-cover" />
          </div>
          <div
            v-else
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm text-white"
            :style="{ backgroundColor: entry.coverColor }"
          >
            {{ initials(entry.name) }}
          </div>

          <!-- Nom + rôle -->
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-foreground">{{ entry.name }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ entry.role }}</p>
          </div>

          <!-- Score -->
          <div class="text-right">
            <p class="text-sm font-bold text-foreground">{{ formatNum(metricValue(entry)) }}</p>
            <p class="text-xs text-muted-foreground">{{ metricLabel(metricValue(entry)) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

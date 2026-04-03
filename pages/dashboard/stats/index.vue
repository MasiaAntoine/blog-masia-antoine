<script setup lang="ts">
import {
  Eye, Users, Clock, BarChart2, MousePointerClick,
  TrendingUp, TrendingDown, Minus, ExternalLink,
} from 'lucide-vue-next'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import type { ScriptableContext, ChartArea } from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

definePageMeta({ middleware: 'dashboard', layout: 'dashboard' })

// ── Période ────────────────────────────────────────────────
type Period = 'today' | '7d' | '30d' | '90d' | '365d'
const periods: { key: Period; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
  { key: '365d', label: '1 an' },
]
const currentPeriod = ref<Period>('30d')

// ── Types ──────────────────────────────────────────────────
interface ArticleRow {
  id: string
  title: string
  slug: string
  published: boolean
  views: number
  sessions: number
  avgDuration: number
  clicks: number
}

interface GlobalStats {
  period: { days: number; from: string; to: string; isToday: boolean }
  current: { views: number; sessions: number; avgDuration: number; clicks: number }
  changes: { views: number; sessions: number; avgDuration: number; clicks: number }
  viewsOverTime: { date: string; count: number }[]
  clicksOverTime: { date: string; count: number }[]
  articles: ArticleRow[]
}

const stats = ref<GlobalStats | null>(null)
const loading = ref(true)
const error = ref('')

async function fetchStats() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await $fetch<GlobalStats>(`/api/stats/global?period=${currentPeriod.value}`)
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Erreur lors du chargement.'
  }
  finally {
    loading.value = false
  }
}

watch(currentPeriod, fetchStats)
onMounted(fetchStats)

// ── Formatage ──────────────────────────────────────────────
function formatNum(n: number) { return new Intl.NumberFormat('fr-FR').format(n) }

function formatDuration(s: number): string {
  if (!s) return '—'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const sec = s % 60
  return sec ? `${m}m ${sec}s` : `${m}m`
}

function formatShortDate(d: string): string {
  if (d.endsWith('h')) return d
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function changeClass(n: number) {
  return n > 0 ? 'text-green-500' : n < 0 ? 'text-red-500' : 'text-muted-foreground'
}

function changeLabel(n: number | undefined): string {
  if (!n) return '—'
  return `${n > 0 ? '+' : ''}${n}%`
}

// ── Graphiques ─────────────────────────────────────────────
const MAX_LABELS = 10

function makeGradient(ctx: CanvasRenderingContext2D, area: ChartArea, rgb: string): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom)
  gradient.addColorStop(0, `rgba(${rgb}, 0.28)`)
  gradient.addColorStop(0.45, `rgba(${rgb}, 0.08)`)
  gradient.addColorStop(1, `rgba(${rgb}, 0)`)
  return gradient
}

function buildChartData(points: { date: string; count: number }[], color: string, rgb: string) {
  const step = Math.max(1, Math.ceil(points.length / MAX_LABELS))
  return {
    labels: points.map((v, i) =>
      i % step === 0 || i === points.length - 1 ? formatShortDate(v.date) : '',
    ),
    datasets: [{
      data: points.map(v => v.count),
      borderColor: color,
      backgroundColor: (ctx: ScriptableContext<'line'>) => {
        const { chart } = ctx
        if (!chart.chartArea) return `rgba(${rgb}, 0.1)`
        return makeGradient(chart.ctx, chart.chartArea, rgb)
      },
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBorderWidth: 2,
      pointHoverBackgroundColor: color,
      pointHoverBorderColor: '#fff',
      borderWidth: 2.5,
    }],
  }
}

function buildChartOptions(labelSuffix: string) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(9, 16, 33, 0.97)',
        borderColor: 'rgba(51, 65, 85, 1)',
        borderWidth: 1,
        titleColor: 'rgba(248, 250, 252, 1)',
        bodyColor: 'rgba(148, 163, 184, 1)',
        padding: { x: 12, y: 10 },
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items: { label: string }[]) => items[0]?.label ?? '',
          label: (item: { formattedValue: string }) => ` ${item.formattedValue} ${labelSuffix}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: 'rgba(100, 116, 139, 0.9)',
          font: { size: 11 },
          maxRotation: 0,
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        grace: '5%',
        grid: {
          color: 'rgba(30, 41, 59, 0.7)',
          drawTicks: false,
          lineWidth: 1,
        },
        border: { display: false },
        ticks: {
          color: 'rgba(100, 116, 139, 0.9)',
          font: { size: 11 },
          padding: 10,
          maxTicksLimit: 5,
          precision: 0,
        },
      },
    },
  }
}

const viewsChartData = computed(() =>
  buildChartData(stats.value?.viewsOverTime ?? [], '#3b82f6', '59, 130, 246'),
)
const clicksChartData = computed(() =>
  buildChartData(stats.value?.clicksOverTime ?? [], '#10b981', '16, 185, 129'),
)
const viewsChartOptions = buildChartOptions('vue')
const clicksChartOptions = buildChartOptions('clic')

// ── Tri du tableau ─────────────────────────────────────────
type SortKey = 'views' | 'sessions' | 'avgDuration' | 'clicks'
const sortBy = ref<SortKey>('views')

const sortedArticles = computed(() => {
  if (!stats.value?.articles) return []
  return [...stats.value.articles].sort((a, b) => b[sortBy.value] - a[sortBy.value])
})

const kpis = computed(() => [
  { key: 'views', label: 'Vues totales', icon: Eye, value: stats.value?.current.views ?? 0, change: stats.value?.changes.views ?? 0, fmt: formatNum },
  { key: 'sessions', label: 'Visiteurs uniques', icon: Users, value: stats.value?.current.sessions ?? 0, change: stats.value?.changes.sessions ?? 0, fmt: formatNum },
  { key: 'avgDuration', label: 'Temps moyen', icon: Clock, value: stats.value?.current.avgDuration ?? 0, change: stats.value?.changes.avgDuration ?? 0, fmt: formatDuration },
  { key: 'clicks', label: 'Clics CTA', icon: MousePointerClick, value: stats.value?.current.clicks ?? 0, change: stats.value?.changes.clicks ?? 0, fmt: formatNum },
])
</script>

<template>
  <div class="p-6 lg:p-8">

    <!-- En-tête -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <BarChart2 class="h-5 w-5 text-primary" />
          <h1 class="text-2xl font-bold text-foreground">Statistiques globales</h1>
        </div>
        <p class="mt-0.5 text-sm text-muted-foreground">Vue d'ensemble de tous vos articles</p>
      </div>

      <!-- Onglets période -->
      <div class="flex w-full shrink-0 items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1 sm:w-auto">
        <button
          v-for="p in periods"
          :key="p.key"
          :class="[
            'shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition-all duration-150 touch-manipulation',
            currentPeriod === p.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="currentPeriod = p.key"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Erreur -->
    <div v-if="error" class="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-sm text-destructive">
      {{ error }}
    </div>

    <!-- ── KPI Cards ──────────────────────────────────────── -->
    <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div
        v-for="kpi in kpis"
        :key="kpi.label"
        class="rounded-xl border border-border bg-background p-5"
      >
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{{ kpi.label }}</p>
          <component :is="kpi.icon" class="h-4 w-4 text-muted-foreground" />
        </div>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded-lg bg-muted/50" />
        <template v-else>
          <p class="text-3xl font-bold tabular-nums text-foreground">{{ kpi.fmt(kpi.value) }}</p>
          <div class="mt-2 flex flex-wrap items-center gap-1 text-xs">
            <TrendingUp v-if="kpi.change > 0" class="h-3.5 w-3.5 text-green-500" />
            <TrendingDown v-else-if="kpi.change < 0" class="h-3.5 w-3.5 text-red-500" />
            <Minus v-else class="h-3.5 w-3.5 text-muted-foreground" />
            <span :class="['font-medium', changeClass(kpi.change)]">{{ changeLabel(kpi.change) }}</span>
            <span class="text-muted-foreground">vs période préc.</span>
          </div>
        </template>
      </div>
    </div>

    <!-- ── Graphiques ─────────────────────────────────────── -->
    <div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

      <!-- Vues -->
      <div class="rounded-xl border border-border bg-background p-5">
        <div class="mb-1 flex items-center justify-between">
          <p class="text-sm font-semibold text-foreground">Évolution des vues</p>
          <Eye class="h-4 w-4 text-muted-foreground" />
        </div>
        <p v-if="stats?.period.isToday" class="mb-4 text-xs text-muted-foreground">Par heure (UTC)</p>
        <div v-else class="mb-4" />
        <div v-if="loading" class="h-64 animate-pulse rounded-lg bg-muted/30" />
        <div v-else-if="!stats?.current.views" class="flex h-64 items-center justify-center">
          <p class="text-sm text-muted-foreground">Aucune vue sur cette période.</p>
        </div>
        <ClientOnly v-else>
          <div class="h-64">
            <Line :data="viewsChartData" :options="viewsChartOptions" />
          </div>
        </ClientOnly>
      </div>

      <!-- Clics -->
      <div class="rounded-xl border border-border bg-background p-5">
        <div class="mb-1 flex items-center justify-between">
          <p class="text-sm font-semibold text-foreground">Clics sur les placements produit</p>
          <MousePointerClick class="h-4 w-4 text-muted-foreground" />
        </div>
        <p v-if="stats?.period.isToday" class="mb-4 text-xs text-muted-foreground">Par heure (UTC)</p>
        <div v-else class="mb-4" />
        <div v-if="loading" class="h-64 animate-pulse rounded-lg bg-muted/30" />
        <div v-else-if="!stats?.current.clicks" class="flex h-64 items-center justify-center">
          <p class="text-sm text-muted-foreground">Aucun clic sur cette période.</p>
        </div>
        <ClientOnly v-else>
          <div class="h-64">
            <Line :data="clicksChartData" :options="clicksChartOptions" />
          </div>
        </ClientOnly>
      </div>
    </div>

    <!-- ── Tableau par article ─────────────────────────────── -->
    <div class="overflow-x-auto rounded-xl border border-border">

      <!-- En-tête tableau -->
      <div class="flex flex-col gap-2 border-b border-border bg-muted/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Articles</p>
        <!-- Tri -->
        <div class="flex items-center gap-1.5">
          <span class="shrink-0 text-xs text-muted-foreground">Trier par</span>
          <select
            v-model="sortBy"
            class="min-h-[36px] flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 sm:flex-none"
          >
            <option value="views">Vues</option>
            <option value="sessions">Visiteurs</option>
            <option value="avgDuration">Durée moy.</option>
            <option value="clicks">Clics</option>
          </select>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="divide-y divide-border">
        <div v-for="i in 4" :key="i" class="flex items-center gap-4 px-5 py-4">
          <div class="h-4 flex-1 animate-pulse rounded bg-muted/40" />
          <div class="h-4 w-12 animate-pulse rounded bg-muted/40" />
          <div class="h-4 w-12 animate-pulse rounded bg-muted/40" />
          <div class="h-4 w-12 animate-pulse rounded bg-muted/40" />
          <div class="h-4 w-12 animate-pulse rounded bg-muted/40" />
        </div>
      </div>

      <!-- Vide -->
      <div v-else-if="!sortedArticles.length" class="px-5 py-12 text-center text-sm text-muted-foreground">
        Aucun article trouvé.
      </div>

      <!-- Lignes -->
      <table v-else class="w-full min-w-[560px] text-sm">
        <thead class="hidden border-b border-border bg-muted/20 text-xs font-medium text-muted-foreground sm:table-header-group">
          <tr>
            <th class="px-5 py-2.5 text-left">Article</th>
            <th class="px-4 py-2.5 text-right">Vues</th>
            <th class="hidden px-4 py-2.5 text-right md:table-cell">Visiteurs</th>
            <th class="hidden px-4 py-2.5 text-right lg:table-cell">Durée moy.</th>
            <th class="hidden px-4 py-2.5 text-right md:table-cell">Clics</th>
            <th class="px-4 py-2.5 text-right">Stats</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="art in sortedArticles"
            :key="art.id"
            class="group bg-background transition-colors hover:bg-muted/20"
          >
            <!-- Titre + slug -->
            <td class="px-5 py-3.5">
              <div class="min-w-0">
                <p class="truncate font-medium text-foreground">{{ art.title }}</p>
                <div class="flex min-w-0 items-center gap-2">
                  <span class="min-w-0 truncate font-mono text-xs text-muted-foreground">/blog/{{ art.slug }}</span>
                  <span
                    :class="[
                      'shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium',
                      art.published
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-muted text-muted-foreground',
                    ]"
                  >
                    {{ art.published ? 'Publié' : 'Brouillon' }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Vues -->
            <td class="px-4 py-3.5 text-right tabular-nums">
              <span class="font-semibold text-foreground">{{ formatNum(art.views) }}</span>
            </td>

            <!-- Visiteurs -->
            <td class="hidden px-4 py-3.5 text-right tabular-nums text-muted-foreground md:table-cell">
              {{ formatNum(art.sessions) }}
            </td>

            <!-- Durée moy. -->
            <td class="hidden px-4 py-3.5 text-right tabular-nums text-muted-foreground lg:table-cell">
              {{ formatDuration(art.avgDuration) }}
            </td>

            <!-- Clics -->
            <td class="hidden px-4 py-3.5 text-right tabular-nums md:table-cell">
              <span :class="art.clicks > 0 ? 'font-semibold text-green-600 dark:text-green-400' : 'text-muted-foreground'">
                {{ formatNum(art.clicks) }}
              </span>
            </td>

            <!-- Lien stats article -->
            <td class="px-4 py-3.5 text-right">
              <div class="flex items-center justify-end gap-0.5">
                <a
                  v-if="art.published"
                  :href="`/blog/${art.slug}`"
                  target="_blank"
                  class="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground touch-manipulation"
                  title="Voir l'article"
                >
                  <ExternalLink class="h-3.5 w-3.5" />
                </a>
                <NuxtLink
                  :to="`/dashboard/articles/${art.id}/stats`"
                  class="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary touch-manipulation"
                  title="Statistiques détaillées"
                >
                  <BarChart2 class="h-3.5 w-3.5" />
                </NuxtLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

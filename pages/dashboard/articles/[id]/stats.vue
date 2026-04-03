<script setup lang="ts">
import type { Component } from 'vue'
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus,
  Eye, Users, Clock, BarChart2, MousePointerClick, ExternalLink,
  Smartphone, Monitor, Tablet, Laptop, Terminal,
  Search, Link2, Globe, Share2, Youtube, MessageCircle, MapPin,
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

const route = useRoute()
const articleId = route.params.id as string

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
interface BreakdownRow { name: string; sessions: number; views: number; code?: string | null }
interface TimePoint { date: string; count: number }

interface StatsResponse {
  article: { id: string; title: string; slug: string }
  period: { days: number; from: string; to: string; isToday: boolean }
  current: { views: number; sessions: number; avgDuration: number; clicks: number }
  changes: { views: number; sessions: number; avgDuration: number; clicks: number }
  viewsOverTime: TimePoint[]
  clicksOverTime: TimePoint[]
  referrers: BreakdownRow[]
  os: BreakdownRow[]
  devices: BreakdownRow[]
  countries: BreakdownRow[]
  cities: BreakdownRow[]
  product: {
    title: string
    description: string
    url: string
    image: string
    cta: string
  } | null
}

const stats = ref<StatsResponse | null>(null)
const loading = ref(true)
const error = ref('')

async function fetchStats() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await $fetch<StatsResponse>(`/api/stats/${articleId}?period=${currentPeriod.value}`)
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Erreur lors du chargement des statistiques.'
  }
  finally {
    loading.value = false
  }
}

watch(currentPeriod, fetchStats)
onMounted(fetchStats)

// ── Formatage ──────────────────────────────────────────────
function formatNum(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

function formatDuration(s: number): string {
  if (s <= 0) return '—'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const sec = s % 60
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`
}

function formatShortDate(dateStr: string): string {
  // Pour la période "today", les dates sont déjà au format "Xh"
  if (dateStr.endsWith('h')) return dateStr
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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

function buildChartData(points: TimePoint[], color: string, rgb: string) {
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

// ── Helpers breakdowns ─────────────────────────────────────
function rowPct(row: BreakdownRow, list: BreakdownRow[]): number {
  const total = list.reduce((s, r) => s + r.sessions, 0)
  if (!total) return 0
  return Math.round((row.sessions / total) * 100)
}

// Génère un drapeau Unicode à partir d'un code ISO 2 lettres (ex: "FR" → "🇫🇷")
function getFlagEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '🌍'
  return [...code.toUpperCase()]
    .map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0)))
    .join('')
}

const REFERRER_ICON_MAP: Record<string, Component> = {
  'google.com': Search, 'bing.com': Search, 'duckduckgo.com': Search,
  'qwant.com': Search, 'ecosia.org': Search, 'yahoo.com': Search,
  'twitter.com': Share2, 'x.com': Share2, 'facebook.com': Share2,
  'linkedin.com': Share2, 'instagram.com': Share2, 'threads.net': Share2,
  'youtube.com': Youtube,
  'reddit.com': MessageCircle,
  'direct': Link2,
}

const OS_ICON_MAP: Record<string, Component> = {
  iOS: Smartphone,
  Android: Smartphone,
  Mac: Laptop,
  Windows: Monitor,
  ChromeOS: Monitor,
  Ubuntu: Terminal,
  Linux: Terminal,
}

const DEVICE_ICON_MAP: Record<string, Component> = {
  Mobile: Smartphone,
  Desktop: Monitor,
  Tablet: Tablet,
}

function referrerIcon(row: BreakdownRow): Component { return REFERRER_ICON_MAP[row.name] ?? Globe }
function osIcon(row: BreakdownRow): Component { return OS_ICON_MAP[row.name] ?? Monitor }
function deviceIcon(row: BreakdownRow): Component { return DEVICE_ICON_MAP[row.name] ?? Monitor }
function countryIcon(row: BreakdownRow): string { return getFlagEmoji(row.code) }
function cityIcon(_row: BreakdownRow): Component { return MapPin }

function changeClass(n: number): string {
  return n > 0 ? 'text-green-500' : n < 0 ? 'text-red-500' : 'text-muted-foreground'
}

function changeLabel(n: number | undefined): string {
  if (!n) return 'Aucune donnée précédente'
  return `${n > 0 ? '+' : ''}${n}%`
}
</script>

<template>
  <div class="p-6 lg:p-8">

    <!-- Navigation -->
    <div class="mb-6 flex min-w-0 flex-wrap items-center gap-2">
      <NuxtLink
        to="/dashboard/articles"
        class="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft class="h-4 w-4" />
        Mes articles
      </NuxtLink>
      <span class="shrink-0 text-border">/</span>
      <span class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {{ stats?.article.title ?? '…' }}
      </span>
    </div>

    <!-- En-tête + sélecteur de période -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <BarChart2 class="h-5 w-5 text-primary" />
          <h1 class="text-2xl font-bold text-foreground">Statistiques</h1>
        </div>
        <p v-if="stats?.article.slug" class="mt-0.5 font-mono text-xs text-muted-foreground">
          /blog/{{ stats.article.slug }}
        </p>
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

    <!-- ── Card produit (rappel) ──────────────────────────── -->
    <div v-if="stats?.product" class="mb-8 flex flex-col gap-4 overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:gap-6">
      <img
        :src="stats.product.image"
        :alt="stats.product.title"
        class="mx-auto h-28 w-20 shrink-0 rounded-lg object-cover shadow-md sm:mx-0"
        loading="lazy"
      />
      <div class="flex flex-col gap-1.5 text-center sm:text-left">
        <p class="text-xs font-semibold uppercase tracking-widest text-primary/70">Placement produit</p>
        <p class="text-base font-bold leading-snug text-foreground">{{ stats.product.title }}</p>
        <p class="text-sm leading-relaxed text-muted-foreground">{{ stats.product.description }}</p>
        <a
          :href="stats.product.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex w-fit items-center gap-1.5 self-center rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 sm:self-start"
        >
          <ExternalLink class="h-3 w-3" />
          {{ stats.product.cta }}
        </a>
      </div>
      <!-- KPI clics sur la card produit elle-même -->
      <div class="shrink-0 rounded-xl border border-border bg-background p-4 text-center sm:ml-auto">
        <div v-if="loading" class="h-7 w-16 animate-pulse rounded bg-muted/50 mx-auto" />
        <template v-else>
          <p class="text-2xl font-bold tabular-nums text-foreground">{{ formatNum(stats?.current.clicks ?? 0) }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">clics CTA</p>
          <div class="mt-1 flex items-center justify-center gap-1">
            <TrendingUp v-if="(stats?.changes.clicks ?? 0) > 0" class="h-3 w-3 text-green-500" />
            <TrendingDown v-else-if="(stats?.changes.clicks ?? 0) < 0" class="h-3 w-3 text-red-500" />
            <Minus v-else class="h-3 w-3 text-muted-foreground" />
            <span :class="['text-xs font-medium', changeClass(stats?.changes.clicks ?? 0)]">
              {{ changeLabel(stats?.changes.clicks) }}
            </span>
          </div>
        </template>
      </div>
    </div>

    <!-- ── KPI Cards ──────────────────────────────────────── -->
    <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

      <!-- Vues -->
      <div class="rounded-xl border border-border bg-background p-5">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Vues</p>
          <Eye class="h-4 w-4 text-muted-foreground" />
        </div>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded-lg bg-muted/50" />
        <p v-else class="text-3xl font-bold tabular-nums text-foreground">{{ formatNum(stats?.current.views ?? 0) }}</p>
        <div v-if="!loading" class="mt-2 flex flex-wrap items-center gap-1 text-xs">
          <TrendingUp v-if="(stats?.changes.views ?? 0) > 0" class="h-3.5 w-3.5 text-green-500" />
          <TrendingDown v-else-if="(stats?.changes.views ?? 0) < 0" class="h-3.5 w-3.5 text-red-500" />
          <Minus v-else class="h-3.5 w-3.5 text-muted-foreground" />
          <span :class="['font-medium', changeClass(stats?.changes.views ?? 0)]">
            {{ changeLabel(stats?.changes.views) }}
          </span>
        </div>
      </div>

      <!-- Visiteurs uniques -->
      <div class="rounded-xl border border-border bg-background p-5">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Visiteurs</p>
          <Users class="h-4 w-4 text-muted-foreground" />
        </div>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded-lg bg-muted/50" />
        <p v-else class="text-3xl font-bold tabular-nums text-foreground">{{ formatNum(stats?.current.sessions ?? 0) }}</p>
        <div v-if="!loading" class="mt-2 flex flex-wrap items-center gap-1 text-xs">
          <TrendingUp v-if="(stats?.changes.sessions ?? 0) > 0" class="h-3.5 w-3.5 text-green-500" />
          <TrendingDown v-else-if="(stats?.changes.sessions ?? 0) < 0" class="h-3.5 w-3.5 text-red-500" />
          <Minus v-else class="h-3.5 w-3.5 text-muted-foreground" />
          <span :class="['font-medium', changeClass(stats?.changes.sessions ?? 0)]">
            {{ changeLabel(stats?.changes.sessions) }}
          </span>
        </div>
      </div>

      <!-- Temps moyen -->
      <div class="rounded-xl border border-border bg-background p-5">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Temps moyen</p>
          <Clock class="h-4 w-4 text-muted-foreground" />
        </div>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded-lg bg-muted/50" />
        <template v-else>
          <p class="text-3xl font-bold tabular-nums text-foreground">
            {{ (stats?.current.avgDuration ?? 0) > 0 ? formatDuration(stats!.current.avgDuration) : '—' }}
          </p>
          <p v-if="!(stats?.current.avgDuration)" class="mt-1 text-xs text-muted-foreground">
            Mesuré à la fermeture
          </p>
          <div v-else class="mt-2 flex flex-wrap items-center gap-1 text-xs">
            <TrendingUp v-if="(stats?.changes.avgDuration ?? 0) > 0" class="h-3.5 w-3.5 text-green-500" />
            <TrendingDown v-else-if="(stats?.changes.avgDuration ?? 0) < 0" class="h-3.5 w-3.5 text-red-500" />
            <Minus v-else class="h-3.5 w-3.5 text-muted-foreground" />
            <span :class="['font-medium', changeClass(stats?.changes.avgDuration ?? 0)]">
              {{ changeLabel(stats?.changes.avgDuration) }}
            </span>
          </div>
        </template>
      </div>

      <!-- Clics CTA -->
      <div class="rounded-xl border border-border bg-background p-5">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Clics CTA</p>
          <MousePointerClick class="h-4 w-4 text-muted-foreground" />
        </div>
        <div v-if="loading" class="h-8 w-24 animate-pulse rounded-lg bg-muted/50" />
        <p v-else class="text-3xl font-bold tabular-nums text-foreground">
          {{ formatNum(stats?.current.clicks ?? 0) }}
        </p>
        <div v-if="!loading && stats?.product === null" class="mt-1">
          <p class="text-xs text-muted-foreground">Pas de produit sur cet article</p>
        </div>
        <div v-else-if="!loading" class="mt-2 flex flex-wrap items-center gap-1 text-xs">
          <TrendingUp v-if="(stats?.changes.clicks ?? 0) > 0" class="h-3.5 w-3.5 text-green-500" />
          <TrendingDown v-else-if="(stats?.changes.clicks ?? 0) < 0" class="h-3.5 w-3.5 text-red-500" />
          <Minus v-else class="h-3.5 w-3.5 text-muted-foreground" />
          <span :class="['font-medium', changeClass(stats?.changes.clicks ?? 0)]">
            {{ changeLabel(stats?.changes.clicks) }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Graphiques côte à côte ─────────────────────────── -->
    <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

      <!-- Évolution des vues -->
      <div class="rounded-xl border border-border bg-background p-5">
        <p class="mb-1 text-sm font-semibold text-foreground">Évolution des vues</p>
        <p v-if="stats?.period.isToday" class="mb-4 text-xs text-muted-foreground">Par heure (UTC)</p>
        <div v-else class="mb-4" />

        <div v-if="loading" class="h-64 animate-pulse rounded-lg bg-muted/30" />
        <div v-else-if="!stats?.current.views" class="flex h-64 flex-col items-center justify-center text-center">
          <Eye class="mb-3 h-8 w-8 text-muted-foreground/30" />
          <p class="text-sm text-muted-foreground">Aucune vue sur cette période.</p>
        </div>
        <ClientOnly v-else>
          <div class="h-64">
            <Line :data="viewsChartData" :options="viewsChartOptions" />
          </div>
        </ClientOnly>
      </div>

      <!-- Évolution des clics -->
      <div class="rounded-xl border border-border bg-background p-5">
        <p class="mb-1 text-sm font-semibold text-foreground">Clics sur le placement produit</p>
        <p v-if="stats?.period.isToday" class="mb-4 text-xs text-muted-foreground">Par heure (UTC)</p>
        <div v-else class="mb-4" />

        <div v-if="loading" class="h-64 animate-pulse rounded-lg bg-muted/30" />
        <div v-else-if="!stats?.product" class="flex h-64 flex-col items-center justify-center text-center">
          <MousePointerClick class="mb-3 h-8 w-8 text-muted-foreground/30" />
          <p class="text-sm text-muted-foreground">Aucun placement produit sur cet article.</p>
        </div>
        <div v-else-if="!stats.current.clicks" class="flex h-64 flex-col items-center justify-center text-center">
          <MousePointerClick class="mb-3 h-8 w-8 text-muted-foreground/30" />
          <p class="text-sm text-muted-foreground">Aucun clic sur cette période.</p>
        </div>
        <ClientOnly v-else>
          <div class="h-64">
            <Line :data="clicksChartData" :options="clicksChartOptions" />
          </div>
        </ClientOnly>
      </div>
    </div>

    <!-- ── Sources + Appareils ────────────────────────────── -->
    <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <DashboardStatsBreakdownCard
        title="Sources de trafic"
        :rows="stats?.referrers ?? []"
        :loading="loading"
        :row-pct="r => rowPct(r, stats?.referrers ?? [])"
        :icon="r => referrerIcon(r)"
      />
      <DashboardStatsBreakdownCard
        title="Appareils"
        :rows="stats?.devices ?? []"
        :loading="loading"
        :row-pct="r => rowPct(r, stats?.devices ?? [])"
        :icon="r => deviceIcon(r)"
      />
    </div>

    <!-- ── OS + Pays ──────────────────────────────────────── -->
    <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <DashboardStatsBreakdownCard
        title="Systèmes d'exploitation"
        :rows="stats?.os ?? []"
        :loading="loading"
        :row-pct="r => rowPct(r, stats?.os ?? [])"
        :icon="r => osIcon(r)"
      />
      <DashboardStatsBreakdownCard
        title="Pays"
        :rows="stats?.countries ?? []"
        :loading="loading"
        :row-pct="r => rowPct(r, stats?.countries ?? [])"
        :icon="r => countryIcon(r)"
      />
    </div>

    <!-- ── Villes ─────────────────────────────────────────── -->
    <DashboardStatsBreakdownCard
      title="Villes"
      :rows="stats?.cities ?? []"
      :loading="loading"
      :row-pct="r => rowPct(r, stats?.cities ?? [])"
      :icon="r => cityIcon(r)"
    />

  </div>
</template>

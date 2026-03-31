import { serverSupabaseClient } from '#supabase/server'

interface PageView {
  article_id: string
  session_id: string
  duration_seconds: number
  created_at: string
}

interface Click {
  article_id: string
  session_id: string
  created_at: string
}

type TimePoint = { date: string; count: number }

// ── Helpers (même logique que [articleId].get.ts) ──────────

function groupByDay(rows: { created_at: string }[], from: Date, days: number): TimePoint[] {
  const map: Record<string, number> = {}
  for (let i = 0; i <= days; i++) {
    const d = new Date(from.getTime() + i * 86_400_000)
    map[d.toISOString().slice(0, 10)] = 0
  }
  for (const r of rows) {
    const key = r.created_at.slice(0, 10)
    if (key in map) map[key]++
  }
  return Object.entries(map).map(([date, count]) => ({ date, count }))
}

function groupByHour(rows: { created_at: string }[]): TimePoint[] {
  const map: Record<string, number> = {}
  for (let h = 0; h < 24; h++) map[h.toString().padStart(2, '0')] = 0
  for (const r of rows) {
    const hour = new Date(r.created_at).getUTCHours().toString().padStart(2, '0')
    if (hour in map) map[hour]++
  }
  return Object.entries(map).map(([h, count]) => ({ date: `${parseInt(h)}h`, count }))
}

function pct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function computeAvgDuration(views: PageView[]): number {
  const with_ = views.filter(v => v.duration_seconds > 0)
  if (!with_.length) return 0
  return Math.round(with_.reduce((s, v) => s + v.duration_seconds, 0) / with_.length)
}

// ── Handler ────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const { period = '30d' } = getQuery(event) as { period?: string }

  const client = await serverSupabaseClient(event)

  const { data: { user } } = await client.auth.getUser()
  if (!user) throw createError({ statusCode: 401, message: 'Non authentifié.' })

  // Récupérer tous les articles de l'auteur
  const { data: articles } = await client
    .from('articles')
    .select('id, title, slug, published')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  if (!articles?.length) {
    return {
      period: { days: 30, isToday: false },
      current: { views: 0, sessions: 0, avgDuration: 0, clicks: 0 },
      changes: { views: 0, sessions: 0, avgDuration: 0, clicks: 0 },
      viewsOverTime: [],
      clicksOverTime: [],
      articles: [],
    }
  }

  const articleIds = articles.map(a => a.id)

  // ── Plages de dates ────────────────────────────────────────
  const isToday = period === 'today'
  const days = isToday ? 1 : period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30
  const now = new Date()
  const from = isToday
    ? new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z')
    : new Date(now.getTime() - days * 86_400_000)
  const prevFrom = new Date(from.getTime() - days * 86_400_000)

  // ── Requêtes en parallèle ──────────────────────────────────
  const [curViewsRes, prevViewsRes, curClicksRes, prevClicksRes] = await Promise.all([
    client
      .from('page_views')
      .select('article_id, session_id, duration_seconds, created_at')
      .in('article_id', articleIds)
      .gte('created_at', from.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true }),

    client
      .from('page_views')
      .select('article_id, session_id, duration_seconds')
      .in('article_id', articleIds)
      .gte('created_at', prevFrom.toISOString())
      .lt('created_at', from.toISOString()),

    client
      .from('product_clicks')
      .select('article_id, session_id, created_at')
      .in('article_id', articleIds)
      .gte('created_at', from.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true }),

    client
      .from('product_clicks')
      .select('article_id, session_id')
      .in('article_id', articleIds)
      .gte('created_at', prevFrom.toISOString())
      .lt('created_at', from.toISOString()),
  ])

  const curViews = (curViewsRes.data ?? []) as PageView[]
  const prevViews = (prevViewsRes.data ?? []) as PageView[]
  const curClicks = (curClicksRes.data ?? []) as Click[]
  const prevClicks = (prevClicksRes.data ?? []) as Click[]

  // ── KPIs globaux ───────────────────────────────────────────
  const curSessions = new Set(curViews.map(v => v.session_id)).size
  const prevSessions = new Set(prevViews.map(v => v.session_id)).size

  // ── Graphiques globaux ─────────────────────────────────────
  const viewsOverTime = isToday ? groupByHour(curViews) : groupByDay(curViews, from, days)
  const clicksOverTime = isToday ? groupByHour(curClicks) : groupByDay(curClicks, from, days)

  // ── Stats par article ──────────────────────────────────────
  const perArticle = articles.map((art) => {
    const views = curViews.filter(v => v.article_id === art.id)
    const clicks = curClicks.filter(c => c.article_id === art.id)
    return {
      id: art.id,
      title: art.title,
      slug: art.slug,
      published: art.published,
      views: views.length,
      sessions: new Set(views.map(v => v.session_id)).size,
      avgDuration: computeAvgDuration(views),
      clicks: clicks.length,
    }
  }).sort((a, b) => b.views - a.views)

  return {
    period: { days, from: from.toISOString(), to: now.toISOString(), isToday },
    current: {
      views: curViews.length,
      sessions: curSessions,
      avgDuration: computeAvgDuration(curViews),
      clicks: curClicks.length,
    },
    changes: {
      views: pct(curViews.length, prevViews.length),
      sessions: pct(curSessions, prevSessions),
      avgDuration: pct(computeAvgDuration(curViews), computeAvgDuration(prevViews)),
      clicks: pct(curClicks.length, prevClicks.length),
    },
    viewsOverTime,
    clicksOverTime,
    articles: perArticle,
  }
})

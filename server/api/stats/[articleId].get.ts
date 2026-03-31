import { serverSupabaseClient } from '#supabase/server'

interface PageView {
  id: string
  session_id: string
  duration_seconds: number
  referrer_domain: string | null
  os: string | null
  device_type: string | null
  country: string | null
  country_code: string | null
  city: string | null
  created_at: string
}

interface Click {
  id: string
  session_id: string
  created_at: string
}

interface BreakdownRow {
  name: string
  sessions: number
  views: number
  code?: string | null
}

type TimePoint = { date: string; count: number }

// ── Groupement par jour ────────────────────────────────────
function groupByDay(rows: { created_at: string }[], from: Date, days: number): TimePoint[] {
  const map: Record<string, number> = {}
  // +1 pour inclure le jour actuel
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

// ── Groupement par heure (période "Aujourd'hui") ───────────
function groupByHour(rows: { created_at: string }[]): TimePoint[] {
  const map: Record<string, number> = {}
  for (let h = 0; h < 24; h++) {
    map[h.toString().padStart(2, '0')] = 0
  }
  for (const r of rows) {
    const hour = new Date(r.created_at).getUTCHours().toString().padStart(2, '0')
    if (hour in map) map[hour]++
  }
  return Object.entries(map).map(([h, count]) => ({ date: `${parseInt(h)}h`, count }))
}

// ── Agrégation par breakdown ───────────────────────────────
function breakdown(views: PageView[], key: keyof PageView, skipNull = false): BreakdownRow[] {
  const map: Record<string, { sessions: Set<string>; views: number }> = {}
  for (const v of views) {
    const val = v[key] as string | null
    if (!val) {
      if (skipNull) continue
    }
    const name = val || 'Inconnu'
    if (!map[name]) map[name] = { sessions: new Set(), views: 0 }
    map[name]!.sessions.add(v.session_id)
    map[name]!.views++
  }
  return Object.entries(map)
    .map(([name, { sessions, views }]) => ({ name, sessions: sessions.size, views }))
    .sort((a, b) => b.sessions - a.sessions)
}

function aggregateReferrers(views: PageView[]): BreakdownRow[] {
  const withDirect = views.map(v => ({ ...v, referrer_domain: v.referrer_domain || 'direct' }))
  return breakdown(withDirect, 'referrer_domain', false).slice(0, 10)
}

// Breakdown pays : groupe par country_code pour exposer le code ISO au frontend (drapeaux)
function countryBreakdown(views: PageView[]): BreakdownRow[] {
  const map: Record<string, { name: string; code: string | null; sessions: Set<string>; views: number }> = {}
  for (const v of views) {
    if (!v.country) continue
    const key = v.country_code || v.country
    if (!map[key]) map[key] = { name: v.country, code: v.country_code ?? null, sessions: new Set(), views: 0 }
    map[key]!.sessions.add(v.session_id)
    map[key]!.views++
  }
  return Object.values(map)
    .map(({ name, code, sessions, views }) => ({ name, code, sessions: sessions.size, views }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 20)
}

// ── Stats agrégées ─────────────────────────────────────────
function computeStats(views: PageView[]) {
  const totalViews = views.length
  const uniqueSessions = new Set(views.map(v => v.session_id)).size
  const withDuration = views.filter(v => v.duration_seconds > 0)
  const avgDuration = withDuration.length
    ? Math.round(withDuration.reduce((s, v) => s + v.duration_seconds, 0) / withDuration.length)
    : 0
  return { totalViews, uniqueSessions, avgDuration }
}

function pct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// ── Handler ────────────────────────────────────────────────
export default defineEventHandler(async (event) => {
  const articleId = getRouterParam(event, 'articleId')
  const { period = '30d' } = getQuery(event) as { period?: string }

  const client = await serverSupabaseClient(event)

  const { data: { user } } = await client.auth.getUser()
  if (!user) throw createError({ statusCode: 401, message: 'Non authentifié.' })

  // Vérifier propriété + récupérer les données produit
  const { data: article } = await client
    .from('articles')
    .select('id, title, slug, product')
    .eq('id', articleId!)
    .eq('author_id', user.id)
    .single()

  if (!article) throw createError({ statusCode: 403, message: 'Accès refusé.' })

  // ── Plages de dates ────────────────────────────────────────
  const isToday = period === 'today'
  const days = isToday ? 1 : period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30
  const now = new Date()

  // Pour "today" : début de la journée UTC
  const from = isToday
    ? new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z')
    : new Date(now.getTime() - days * 86_400_000)

  const prevFrom = new Date(from.getTime() - days * 86_400_000)

  // ── Requêtes Supabase ──────────────────────────────────────
  const [currentViewsRes, previousViewsRes, currentClicksRes, previousClicksRes] = await Promise.all([
    client
      .from('page_views')
      .select('id, session_id, duration_seconds, referrer_domain, os, device_type, country, country_code, city, created_at')
      .eq('article_id', articleId!)
      .gte('created_at', from.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true }),

    client
      .from('page_views')
      .select('id, session_id, duration_seconds')
      .eq('article_id', articleId!)
      .gte('created_at', prevFrom.toISOString())
      .lt('created_at', from.toISOString()),

    client
      .from('product_clicks')
      .select('id, session_id, created_at')
      .eq('article_id', articleId!)
      .gte('created_at', from.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true }),

    client
      .from('product_clicks')
      .select('id, session_id')
      .eq('article_id', articleId!)
      .gte('created_at', prevFrom.toISOString())
      .lt('created_at', from.toISOString()),
  ])

  const current = (currentViewsRes.data ?? []) as PageView[]
  const previous = (previousViewsRes.data ?? []) as PageView[]
  const currentClicks = (currentClicksRes.data ?? []) as Click[]
  const previousClicks = (previousClicksRes.data ?? []) as Click[]

  const cur = computeStats(current)
  const prev = computeStats(previous)

  // Groupement temporel selon la période
  const viewsOverTime = isToday
    ? groupByHour(current)
    : groupByDay(current, from, days)

  const clicksOverTime = isToday
    ? groupByHour(currentClicks)
    : groupByDay(currentClicks, from, days)

  // Extraire les données produit de l'article
  type ProductData = {
    title?: string
    description?: string
    url?: string
    image?: string
    cta?: string
  }
  const rawProduct = article.product as ProductData | null
  const product = rawProduct?.url
    ? {
        title: rawProduct.title ?? '',
        description: rawProduct.description ?? '',
        url: rawProduct.url ?? '',
        image: rawProduct.image ?? '',
        cta: rawProduct.cta ?? 'Voir sur Amazon',
      }
    : null

  return {
    article: { id: article.id, title: article.title, slug: article.slug },
    period: { days, from: from.toISOString(), to: now.toISOString(), isToday },
    current: {
      views: cur.totalViews,
      sessions: cur.uniqueSessions,
      avgDuration: cur.avgDuration,
      clicks: currentClicks.length,
    },
    changes: {
      views: pct(cur.totalViews, prev.totalViews),
      sessions: pct(cur.uniqueSessions, prev.uniqueSessions),
      avgDuration: pct(cur.avgDuration, prev.avgDuration),
      clicks: pct(currentClicks.length, previousClicks.length),
    },
    viewsOverTime,
    clicksOverTime,
    referrers: aggregateReferrers(current),
    os: breakdown(current, 'os'),
    devices: breakdown(current, 'device_type'),
    countries: countryBreakdown(current),
    cities: breakdown(current, 'city', true).slice(0, 20),
    product,
  }
})

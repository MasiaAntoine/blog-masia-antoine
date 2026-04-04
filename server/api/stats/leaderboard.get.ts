import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { period = '30d' } = getQuery(event) as { period?: string }

  // Client authentifié (pas besoin de service role grâce à la policy "authenticated_read_views")
  const client = await serverSupabaseClient(event)

  const { data: { user } } = await client.auth.getUser()
  if (!user) throw createError({ statusCode: 401, message: 'Non authentifié.' })

  // ── Plage de dates ─────────────────────────────────────────
  const isToday = period === 'today'
  const days = isToday ? 1 : period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30
  const now = new Date()
  const from = isToday
    ? new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z')
    : new Date(now.getTime() - days * 86_400_000)

  // ── Tous les profils avec un nom ───────────────────────────
  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, name, role, avatar_url, cover_color')
    .not('name', 'is', null)
    .neq('name', '')
    .order('name', { ascending: true })

  if (profilesError) throw createError({ statusCode: 500, message: profilesError.message })
  if (!profiles?.length) return []

  const authorIds = profiles.map(p => p.id)

  // ── Articles publiés par auteur ────────────────────────────
  const { data: articles } = await client
    .from('articles')
    .select('id, author_id, created_at')
    .eq('published', true)
    .in('author_id', authorIds)

  const articleIds = (articles ?? []).map(a => a.id)
  const articleCount: Record<string, number> = {}
  const articleAuthor: Record<string, string> = {}
  for (const a of articles ?? []) {
    // Compte uniquement les articles publiés dans la période sélectionnée
    const publishedAt = new Date(a.created_at)
    if (publishedAt >= from && publishedAt <= now) {
      articleCount[a.author_id] = (articleCount[a.author_id] ?? 0) + 1
    }
    articleAuthor[a.id] = a.author_id
  }

  // ── Vues sur la période (policy "authenticated_read_views") ─
  const viewsByAuthor: Record<string, { sessions: Set<string>; views: number }> = {}
  for (const id of authorIds) viewsByAuthor[id] = { sessions: new Set(), views: 0 }

  if (articleIds.length) {
    const { data: views } = await client
      .from('page_views')
      .select('article_id, session_id')
      .in('article_id', articleIds)
      .gte('created_at', from.toISOString())
      .lte('created_at', now.toISOString())

    for (const v of views ?? []) {
      const authorId = articleAuthor[v.article_id]
      if (!authorId || !viewsByAuthor[authorId]) continue
      viewsByAuthor[authorId]!.sessions.add(v.session_id)
      viewsByAuthor[authorId]!.views++
    }
  }

  // ── Résultat — tous les auteurs ────────────────────────────
  return profiles.map(p => ({
    authorId: p.id,
    name: p.name,
    role: p.role ?? '',
    avatar: p.avatar_url ?? null,
    coverColor: (p.cover_color as string | null) ?? '#0f172a',
    sessions: viewsByAuthor[p.id]?.sessions.size ?? 0,
    views: viewsByAuthor[p.id]?.views ?? 0,
    articles: articleCount[p.id] ?? 0,
  }))
})

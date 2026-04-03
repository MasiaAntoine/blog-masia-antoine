import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Récupère les IDs des auteurs qui ont au moins 1 article publié
  const { data: published } = await client
    .from('articles')
    .select('author_id')
    .eq('published', true)

  const authorIds = [...new Set((published ?? []).map(a => a.author_id))]

  if (!authorIds.length) return []

  const { data, error } = await client
    .from('profiles')
    .select('id, name, role, avatar_url')
    .in('id', authorIds)
    .not('name', 'is', null)
    .neq('name', '')
    .order('name', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return (data ?? []) as { id: string; name: string; role: string; avatar_url: string | null }[]
})

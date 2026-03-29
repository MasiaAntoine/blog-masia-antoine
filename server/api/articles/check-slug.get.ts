import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { slug, exclude } = getQuery(event) as { slug?: string; exclude?: string }

  if (!slug?.trim()) {
    return { available: false, error: 'Slug manquant.' }
  }

  const client = await serverSupabaseClient(event)

  let query = client
    .from('articles')
    .select('id')
    .eq('slug', slug.trim())
    .limit(1)

  // En mode édition, exclure l'article courant
  if (exclude) {
    query = query.neq('id', exclude)
  }

  const { data, error } = await query

  if (error) {
    return { available: false, error: error.message }
  }

  return { available: data.length === 0 }
})

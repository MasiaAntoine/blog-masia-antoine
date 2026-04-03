import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data: { user } } = await client.auth.getUser()
  if (!user) throw createError({ statusCode: 401, message: 'Non authentifié.' })

  const body = await readBody(event) as {
    title?: string
    description?: string
    url?: string
    image?: string
    cta?: string
  }

  if (!body.title?.trim() || !body.url?.trim()) {
    throw createError({ statusCode: 400, message: 'Le nom et l\'URL du produit sont requis.' })
  }

  const { data, error } = await client
    .from('product_placement_presets')
    .insert({
      author_id: user.id,
      title: body.title.trim(),
      description: body.description?.trim() ?? '',
      url: body.url.trim(),
      image: body.image?.trim() ?? '',
      cta: body.cta?.trim() || 'Voir sur Amazon',
    })
    .select('id, title, description, url, image, cta, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})

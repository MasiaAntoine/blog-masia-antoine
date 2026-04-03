import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID manquant.' })

  const client = await serverSupabaseClient(event)

  const { data: { user } } = await client.auth.getUser()
  if (!user) throw createError({ statusCode: 401, message: 'Non authentifié.' })

  const { error } = await client
    .from('product_placement_presets')
    .delete()
    .eq('id', id)
    .eq('author_id', user.id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})

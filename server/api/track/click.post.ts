import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    article_id?: string
    session_id?: string
  }

  const { article_id, session_id } = body
  if (!article_id || !session_id) return { ok: false }

  const client = await serverSupabaseClient(event)
  const { error } = await client
    .from('product_clicks')
    .insert({ article_id, session_id })

  return { ok: !error }
})

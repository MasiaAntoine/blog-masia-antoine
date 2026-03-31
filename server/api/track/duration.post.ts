import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // sendBeacon envoie du texte brut ou FormData — gérer les deux cas
  const contentType = getHeader(event, 'content-type') ?? ''
  let body: { view_id?: string; duration_seconds?: number }

  if (contentType.includes('application/json')) {
    body = await readBody(event)
  }
  else {
    const raw = await readRawBody(event)
    try {
      body = JSON.parse(raw ?? '{}')
    }
    catch {
      return { ok: false }
    }
  }

  const { view_id, duration_seconds } = body

  if (!view_id || typeof duration_seconds !== 'number' || duration_seconds < 1) {
    return { ok: false }
  }

  const client = await serverSupabaseClient(event)

  // N'update que si duration_seconds est encore 0 (la RLS policy le garantit aussi)
  await client
    .from('page_views')
    .update({ duration_seconds: Math.min(Math.round(duration_seconds), 86400) })
    .eq('id', view_id)
    .eq('duration_seconds', 0)

  return { ok: true }
})

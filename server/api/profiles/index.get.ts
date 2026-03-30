import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('profiles')
    .select('id, name, role, avatar_url')
    .not('name', 'is', null)
    .neq('name', '')
    .order('name', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return (data ?? []) as { id: string; name: string; role: string; avatar_url: string | null }[]
})

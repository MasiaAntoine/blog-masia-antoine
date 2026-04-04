import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('articles')
    .select('id, title, description, slug, date, tags, cover, product, content, author:profiles!author_id(name, role, avatar_url, cover_color)')
    .eq('published', true)
    .order('date', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return (data ?? []).map((article: any) => ({
    id: article.id,
    title: article.title,
    description: article.description,
    slug: article.slug,
    path: `/blog/${article.slug}`,
    date: article.date,
    tags: article.tags ?? [],
    cover: article.cover ?? null,
    product: article.product ?? null,
    readingTime: computeReadingTime(article.content ?? ''),
    author: article.author
      ? {
          name: article.author.name,
          role: article.author.role,
          avatar: article.author.avatar_url,
          coverColor: article.author.cover_color ?? null,
        }
      : null,
  }))
})

function computeReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min de lecture`
}

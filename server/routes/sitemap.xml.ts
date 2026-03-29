import { serverSupabaseClient } from '#supabase/server'

const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL ?? 'https://blog.masia-antoine.fr'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data: docs } = await client
    .from('articles')
    .select('slug, date')
    .eq('published', true)
    .order('date', { ascending: false })

  interface SitemapEntry {
    url: string
    priority: string
    changefreq: string
    lastmod?: string
  }

  const staticRoutes: SitemapEntry[] = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
  ]

  const contentRoutes: SitemapEntry[] = (docs ?? []).map((doc: { slug: string; date: string }) => ({
    url: `/blog/${doc.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: doc.date ? new Date(doc.date).toISOString() : undefined,
  }))

  const allRoutes = [...staticRoutes, ...contentRoutes]

  const urlEntries = allRoutes
    .map(({ url, priority, changefreq, lastmod }) => {
      const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
      return `  <url>
    <loc>${SITE_URL}${url}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${lastmodTag}
  </url>`
    })
    .join('\n')

  setHeader(event, 'Content-Type', 'application/xml; charset=UTF-8')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
})

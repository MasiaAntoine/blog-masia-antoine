import { serverSupabaseClient } from '#supabase/server'
import { marked, type Tokens } from 'marked'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const slug = getRouterParam(event, 'slug')

  const { data: article, error } = await client
    .from('articles')
    .select('*, author:profiles!author_id(name, role, avatar_url, cover_color)')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error || !article) {
    throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
  }

  const toc = extractToc(article.content ?? '')
  const contentHtml = await renderMarkdown(article.content ?? '')

  return {
    id: article.id,
    title: article.title,
    description: article.description,
    slug: article.slug,
    path: `/blog/${article.slug}`,
    date: article.date,
    tags: article.tags ?? [],
    cover: article.cover ?? null,
    product: article.product ?? null,
    content: article.content,
    contentHtml,
    toc,
    readingTime: computeReadingTime(article.content ?? ''),
    author: article.author
      ? {
          name: article.author.name,
          role: article.author.role,
          avatar: article.author.avatar_url,
          coverColor: article.author.cover_color ?? null,
        }
      : null,
  }
})

// ── Markdown → HTML avec marked ────────────────────────────────
async function renderMarkdown(markdown: string): Promise<string> {
  const renderer = new marked.Renderer()

  // Ajouter des id sur les headings pour les ancres TOC
  renderer.heading = ({ text, depth }: Tokens.Heading): string => {
    const id = slugifyHeading(text)
    return `<h${depth} id="${id}">${text}</h${depth}>\n`
  }

  return await marked(markdown, { renderer })
}

// ── Extraction TOC ─────────────────────────────────────────────
interface TocLink {
  id: string
  text: string
  depth: number
  children: TocLink[]
}

function extractToc(markdown: string): TocLink[] {
  const lines = markdown.split('\n')
  const flat: TocLink[] = []

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/)
    if (match) {
      const depth = match[1]!.length
      const text = match[2]!.trim()
      flat.push({ id: slugifyHeading(text), text, depth, children: [] })
    }
  }

  // Imbriquer h3 dans h2
  const nested: TocLink[] = []
  let currentH2: TocLink | null = null

  for (const link of flat) {
    if (link.depth === 2) {
      currentH2 = { ...link, children: [] }
      nested.push(currentH2)
    } else if (link.depth === 3 && currentH2) {
      currentH2.children.push(link)
    }
  }

  return nested
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function computeReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min de lecture`
}

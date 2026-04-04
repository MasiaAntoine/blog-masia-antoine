export interface PublicArticle {
  id: string
  title: string
  description: string
  slug: string
  path: string
  date: string
  tags: string[]
  cover: string | null
  product: {
    title: string
    description: string
    url: string
    image: string
    cta?: string
  } | null
  readingTime: string
  author: {
    name: string
    role: string
    avatar: string | null
    coverColor: string | null
  } | null
}

export interface PublicArticleFull extends PublicArticle {
  content: string
  contentHtml: string
  toc: TocLink[]
}

export interface TocLink {
  id: string
  text: string
  depth: number
  children: TocLink[]
}

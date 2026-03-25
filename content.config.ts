import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.string(),
        tags: z.array(z.string()).default([]),
        cover: z.string().optional(),
        author: z.object({
          name: z.string(),
          role: z.string(),
          avatar: z.string(),
        }),
        product: z
          .object({
            title: z.string(),
            description: z.string(),
            url: z.string(),
            image: z.string(),
            cta: z.string().optional(),
          })
          .optional(),
      }),
    }),
  },
})

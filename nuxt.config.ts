// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV === 'development' },

  devServer: {
    host: process.env.NUXT_HOST ?? 'localhost',
    port: Number(process.env.NUXT_PORT ?? 3000),
  },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    'nuxt-og-image',
    '@nuxtjs/color-mode',
    '@vercel/analytics',
    '@vercel/speed-insights',
  ],

  supabase: {
    redirect: false,
    types: '~/types/database.types.ts',
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? 'https://blog.masia-antoine.fr',
    name: "Le Blog d'Antoine",
  },

  ogImage: {},

  // En production (Vercel) : ISR sur les pages publiques pour les cacher à l'edge.
  // En local Docker : ssr: true uniquement — l'ISR y utilise un cache fichier
  // qui peut se corrompre si un fichier "blog" existe déjà à l'endroit
  // où Nuxt tente de créer le dossier "blog/".
  routeRules: process.env.NODE_ENV === 'production'
    ? {
        '/':                    { isr: 60 },
        '/blog/**':             { isr: 60 },
        '/_og/**':              { ssr: true },  // OG images toujours générées à la demande
        '/dashboard/**':        { ssr: true },
        '/auth/**':             { ssr: true },
      }
    : {
        '/':                    { ssr: true },
        '/blog/**':             { ssr: true },
        '/dashboard/**':        { ssr: true },
        '/auth/**':             { ssr: true },
      },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: { lang: 'fr' },
      title: "Le Blog d'Antoine",
      meta: [
        {
          name: 'description',
          content:
            "Je documente ce que j'apprends et maîtrise — surtout de la tech. Veille, guides pratiques et retours d'expérience.",
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})

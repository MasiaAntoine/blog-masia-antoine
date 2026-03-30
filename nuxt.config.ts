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

  // SSR + ISR : pages publiques cachées à l'edge, revalidées toutes les 60s
  routeRules: {
    '/':         { isr: 60 },
    '/blog/**':  { isr: 60 },
    '/dashboard/**': { ssr: true },
    '/auth/**':  { ssr: true },
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

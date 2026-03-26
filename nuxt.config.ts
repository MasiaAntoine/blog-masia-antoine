// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV === 'development' },

  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
    'nuxt-og-image',
    '@vercel/analytics',
  ],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? 'https://blog.masia-antoine.fr',
    name: "Le Blog d'Antoine",
  },

  ogImage: {
    fonts: ['Inter:400', 'Inter:700'],
    defaults: {
      renderer: 'satori',
    },
  },

  content: {
    highlight: {
      theme: 'github-light',
      langs: ['js', 'ts', 'vue', 'bash', 'json', 'css', 'html', 'markdown'],
    },
    markdown: {
      toc: {
        depth: 3,
        searchDepth: 3,
      },
    },
    build: {
      pathPrefix: false,
    },
  },

  css: ['~/assets/css/main.css'],

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/sitemap.xml'],
    },
  },

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

<script setup lang="ts">
import type { ArticleFormData } from '~/components/dashboard/ArticleForm.vue'

definePageMeta({ middleware: 'dashboard', layout: 'dashboard' })

const client = useSupabaseClient()
const route = useRoute()
const articleId = route.params.id as string

const { isProfileComplete, profileLoading } = useProfileGuard()

watch(profileLoading, (loading) => {
  if (!loading && !isProfileComplete.value) {
    navigateTo('/dashboard/profile')
  }
})

const form = ref<ArticleFormData | null>(null)
const originalSlug = ref('')
const pageLoading = ref(true)
const loading = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user?.id) {
    await navigateTo('/auth/login')
    return
  }

  const { data, error } = await client
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .eq('author_id', user.id)
    .single()

  if (error || !data) {
    await navigateTo('/dashboard/articles')
    return
  }

  originalSlug.value = data.slug

  type ProductJson = { title?: string; description?: string; url?: string; image?: string; cta?: string }
  const product = data.product as ProductJson | null

  form.value = {
    title: data.title,
    description: data.description,
    slug: data.slug,
    date: data.date,
    tags: data.tags ?? [],
    cover: data.cover ?? '',
    content: data.content ?? '',
    published: data.published,
    product: product
      ? {
          enabled: true,
          title: product.title ?? '',
          description: product.description ?? '',
          url: product.url ?? '',
          image: product.image ?? '',
          cta: product.cta ?? 'Voir sur Amazon',
        }
      : {
          enabled: false,
          title: '',
          description: '',
          url: '',
          image: '',
          cta: 'Voir sur Amazon',
        },
  }

  pageLoading.value = false
})

async function save() {
  if (!form.value) return
  if (!form.value.title || !form.value.slug || !form.value.description || !form.value.content) {
    errorMsg.value = 'Les champs Titre, Slug, Description et Contenu sont obligatoires.'
    return
  }
  if (!form.value.tags.length) {
    errorMsg.value = 'Au moins un tag est requis.'
    return
  }

  errorMsg.value = ''
  loading.value = true

  const product = form.value.product.enabled
    ? {
        title: form.value.product.title,
        description: form.value.product.description,
        url: form.value.product.url,
        image: form.value.product.image,
        cta: form.value.product.cta || 'Voir sur Amazon',
      }
    : null

  const { error } = await client
    .from('articles')
    .update({
      title: form.value.title,
      description: form.value.description,
      slug: form.value.slug,
      date: form.value.date,
      tags: form.value.tags,
      cover: form.value.cover || null,
      content: form.value.content,
      published: form.value.published,
      product,
    })
    .eq('id', articleId)

  loading.value = false

  if (error) {
    errorMsg.value = error.message.includes('duplicate')
      ? `Le slug "${form.value.slug}" est déjà utilisé.`
      : `Erreur : ${error.message}`
    return
  }

  await navigateTo('/dashboard/articles')
}
</script>

<template>
  <div class="p-6 lg:p-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-foreground">Modifier l'article</h1>
      <p v-if="originalSlug" class="mt-1 font-mono text-sm text-muted-foreground">/blog/{{ originalSlug }}</p>
    </div>

    <div v-if="pageLoading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-xl border border-border bg-muted/30" />
    </div>

    <template v-else-if="form">
      <div v-if="errorMsg" class="mb-6 rounded-xl bg-destructive/10 px-5 py-4 text-sm text-destructive">
        {{ errorMsg }}
      </div>
      <DashboardArticleForm
        v-model="form"
        :loading="loading"
        :current-id="articleId"
        submit-label="Enregistrer les modifications"
        @submit="save"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ArticleFormData } from '~/components/dashboard/ArticleForm.vue'

definePageMeta({ middleware: 'dashboard', layout: 'dashboard' })

const client = useSupabaseClient()
const { isProfileComplete, profileLoading } = useProfileGuard()

// Bloquer l'accès si profil incomplet dès que la vérification est terminée
watch(profileLoading, (loading) => {
  if (!loading && !isProfileComplete.value) {
    navigateTo('/dashboard/profile')
  }
})

const today = new Date().toISOString().split('T')[0] ?? new Date().toISOString().slice(0, 10)

const form = ref<ArticleFormData>({
  title: '',
  description: '',
  slug: '',
  date: today,
  tags: [],
  cover: '',
  content: '',
  published: false,
  product: {
    enabled: false,
    title: '',
    description: '',
    url: '',
    image: '',
    cta: 'Voir sur Amazon',
  },
})

const loading = ref(false)
const errorMsg = ref('')

async function save() {
  if (!form.value.title || !form.value.slug || !form.value.description || !form.value.content) {
    errorMsg.value = 'Les champs Titre, Slug, Description et Contenu sont obligatoires.'
    return
  }
  if (!form.value.tags.length) {
    errorMsg.value = 'Au moins un tag est requis.'
    return
  }

  const { data: { user } } = await client.auth.getUser()
  if (!user?.id) {
    errorMsg.value = 'Session expirée, veuillez vous reconnecter.'
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

  const { error } = await client.from('articles').insert({
    author_id: user.id,
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
      <h1 class="text-2xl font-bold text-foreground">Nouvel article</h1>
      <p class="mt-1 text-sm text-muted-foreground">Rédigez et publiez un nouvel article</p>
    </div>

    <div v-if="errorMsg" class="mb-6 rounded-xl bg-destructive/10 px-5 py-4 text-sm text-destructive">
      {{ errorMsg }}
    </div>

    <DashboardArticleForm
      v-model="form"
      :loading="loading"
      submit-label="Créer l'article"
      @submit="save"
    />
  </div>
</template>

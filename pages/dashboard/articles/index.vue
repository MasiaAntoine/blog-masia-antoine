<script setup lang="ts">
import { Plus, Eye, EyeOff, Pencil, Trash2, ExternalLink, AlertTriangle, BarChart2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '~/components/ui/dialog'

definePageMeta({ middleware: 'dashboard', layout: 'dashboard' })

const client = useSupabaseClient()
const { isProfileComplete, profileLoading } = useProfileGuard()

interface Article {
  id: string
  title: string
  slug: string
  date: string
  tags: string[]
  published: boolean
  created_at: string
}

const articles = ref<Article[]>([])
const loading = ref(true)
const deletingId = ref<string | null>(null)
const togglingId = ref<string | null>(null)
const userId = ref<string | null>(null)

// Dialog de confirmation suppression
const deleteDialog = ref(false)
const articleToDelete = ref<Article | null>(null)

function confirmDelete(article: Article) {
  articleToDelete.value = article
  deleteDialog.value = true
}

async function fetchArticles() {
  if (!userId.value) return
  loading.value = true
  const { data } = await client
    .from('articles')
    .select('id, title, slug, date, tags, published, created_at')
    .eq('author_id', userId.value)
    .order('created_at', { ascending: false })
  articles.value = (data as Article[]) ?? []
  loading.value = false
}

onMounted(async () => {
  const { data: { user } } = await client.auth.getUser()
  userId.value = user?.id ?? null
  await fetchArticles()
})

async function togglePublish(article: Article) {
  togglingId.value = article.id
  await client
    .from('articles')
    .update({ published: !article.published })
    .eq('id', article.id)
  article.published = !article.published
  togglingId.value = null
}

async function deleteArticle() {
  if (!articleToDelete.value) return
  const id = articleToDelete.value.id
  deleteDialog.value = false
  deletingId.value = id
  await client.from('articles').delete().eq('id', id)
  articles.value = articles.value.filter((a) => a.id !== id)
  deletingId.value = null
  articleToDelete.value = null
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="p-6 lg:p-8">
    <!-- Skeleton pendant le chargement du profil -->
    <div v-if="profileLoading" class="space-y-4">
      <div class="h-10 w-48 animate-pulse rounded-lg bg-muted/50" />
      <div class="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
    </div>

    <!-- Profil incomplet : blocage visuel -->
    <DashboardProfileRequired v-else-if="!isProfileComplete" />

    <!-- Contenu normal -->
    <template v-else>

    <!-- En-tête -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Mes articles</h1>
        <p class="mt-1 text-sm text-muted-foreground">Gérez vos articles et brouillons</p>
      </div>
      <NuxtLink
        to="/dashboard/articles/new"
        class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto sm:py-2.5"
      >
        <Plus class="h-4 w-4" />
        Nouvel article
      </NuxtLink>
    </div>

    <!-- Chargement -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-xl border border-border bg-muted/30" />
    </div>

    <!-- Liste vide -->
    <div
      v-else-if="!articles.length"
      class="rounded-xl border border-dashed border-border px-6 py-20 text-center"
    >
      <p class="text-sm text-muted-foreground">Aucun article pour le moment.</p>
      <NuxtLink
        to="/dashboard/articles/new"
        class="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <Plus class="h-3.5 w-3.5" />
        Créer votre premier article
      </NuxtLink>
    </div>

    <!-- Table articles -->
    <div v-else class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full min-w-[500px] text-sm">
        <thead class="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th class="px-5 py-3 text-left">Titre</th>
            <th class="hidden px-5 py-3 text-left sm:table-cell">Date</th>
            <th class="hidden px-5 py-3 text-left lg:table-cell">Tags</th>
            <th class="px-5 py-3 text-left">Statut</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="article in articles"
            :key="article.id"
            class="bg-background transition-colors hover:bg-muted/20"
          >
            <!-- Titre -->
            <td class="max-w-[200px] px-5 py-4 sm:max-w-xs">
              <p class="truncate font-medium text-foreground">{{ article.title }}</p>
              <p class="mt-0.5 truncate font-mono text-xs text-muted-foreground">/blog/{{ article.slug }}</p>
            </td>

            <!-- Date -->
            <td class="hidden whitespace-nowrap px-5 py-4 text-muted-foreground sm:table-cell">
              {{ formatDate(article.date) }}
            </td>

            <!-- Tags -->
            <td class="hidden px-5 py-4 lg:table-cell">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in article.tags.slice(0, 2)"
                  :key="tag"
                  class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {{ tag }}
                </span>
                <span v-if="article.tags.length > 2" class="text-xs text-muted-foreground">
                  +{{ article.tags.length - 2 }}
                </span>
              </div>
            </td>

            <!-- Statut -->
            <td class="px-5 py-4">
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  article.published
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-muted text-muted-foreground',
                ]"
              >
                {{ article.published ? 'Publié' : 'Brouillon' }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-3 py-4 sm:px-5">
              <div class="flex items-center justify-end gap-0.5 sm:gap-1">
                <!-- Voir sur le blog (si publié) -->
                <a
                  v-if="article.published"
                  :href="`/blog/${article.slug}`"
                  target="_blank"
                  class="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground touch-manipulation"
                  title="Voir sur le blog"
                >
                  <ExternalLink class="h-4 w-4" />
                </a>

                <!-- Toggle publish -->
                <button
                  :disabled="togglingId === article.id"
                  class="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 touch-manipulation"
                  :title="article.published ? 'Dépublier' : 'Publier'"
                  @click="togglePublish(article)"
                >
                  <EyeOff v-if="article.published" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </button>

                <!-- Stats -->
                <NuxtLink
                  :to="`/dashboard/articles/${article.id}/stats`"
                  class="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary touch-manipulation"
                  title="Statistiques"
                >
                  <BarChart2 class="h-4 w-4" />
                </NuxtLink>

                <!-- Modifier -->
                <NuxtLink
                  :to="`/dashboard/articles/${article.id}/edit`"
                  class="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground touch-manipulation"
                  title="Modifier"
                >
                  <Pencil class="h-4 w-4" />
                </NuxtLink>

                <!-- Supprimer -->
                <button
                  :disabled="deletingId === article.id"
                  class="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 touch-manipulation"
                  title="Supprimer"
                  @click="confirmDelete(article)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    </template><!-- /v-else profil complet -->

    <!-- Dialog confirmation suppression -->
    <Dialog v-model:open="deleteDialog">
      <DialogContent>
        <DialogHeader>
          <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle class="h-5 w-5 text-destructive" />
          </div>
          <DialogTitle>Supprimer l'article ?</DialogTitle>
          <DialogDescription>
            <span class="font-medium text-foreground">« {{ articleToDelete?.title }} »</span>
            sera définitivement supprimé. Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            @click="deleteDialog = false"
          >
            Annuler
          </button>
          <button
            :disabled="!!deletingId"
            class="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            @click="deleteArticle"
          >
            {{ deletingId ? 'Suppression…' : 'Supprimer définitivement' }}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronRight, ChevronLeft, Check, Loader2,
  Plus, Package, AlertCircle, Wand2, Save, BookmarkPlus,
} from 'lucide-vue-next'
import type { ComponentPublicInstance } from 'vue'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({ middleware: 'dashboard', layout: 'dashboard' })

const client = useSupabaseClient()
const route = useRoute()
const articleId = route.params.id as string

const { isProfileComplete, profileLoading } = useProfileGuard()
watch(profileLoading, (loading) => {
  if (!loading && !isProfileComplete.value) navigateTo('/dashboard/profile')
})

// ── Chargement de l'article ────────────────────────────────────
const pageLoading = ref(true)
const originalSlug = ref('')

interface FormState {
  title: string; description: string; slug: string; date: string
  tags: string[]; cover: string; content: string; published: boolean
  product: { enabled: boolean; title: string; description: string; url: string; image: string; cta: string }
}

const form = ref<FormState>({
  title: '', description: '', slug: '', date: '', tags: [],
  cover: '', content: '', published: false,
  product: { enabled: false, title: '', description: '', url: '', image: '', cta: 'Voir sur Amazon' },
})

onMounted(async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user?.id) { await navigateTo('/auth/login'); return }

  const { data, error } = await client
    .from('articles').select('*')
    .eq('id', articleId).eq('author_id', user.id).single()

  if (error || !data) { await navigateTo('/dashboard/articles'); return }

  originalSlug.value = data.slug
  slugSuggestion.value = data.slug
  slugStatus.value = 'available'

  type ProductJson = { title?: string; description?: string; url?: string; image?: string; cta?: string }
  const product = data.product as ProductJson | null

  form.value = {
    title: data.title, description: data.description, slug: data.slug,
    date: data.date, tags: data.tags ?? [], cover: data.cover ?? '',
    content: data.content ?? '', published: data.published,
    product: product
      ? { enabled: true, title: product.title ?? '', description: product.description ?? '',
          url: product.url ?? '', image: product.image ?? '', cta: product.cta ?? 'Voir sur Amazon' }
      : { enabled: false, title: '', description: '', url: '', image: '', cta: 'Voir sur Amazon' },
  }

  pageLoading.value = false
})

// ── Stepper ────────────────────────────────────────────────────
const STEPS = [
  { label: 'Métadonnées' },
  { label: 'Contenu' },
  { label: 'Placement produit' },
  { label: 'Enregistrer' },
]
const currentStep = ref(1)
const stepError = ref('')

function nextStep() {
  stepError.value = ''
  if (currentStep.value === 1) {
    if (!form.value.title.trim()) { stepError.value = 'Le titre est requis.'; return }
    if (!form.value.slug.trim()) { stepError.value = 'Le slug est requis.'; return }
    if (slugStatus.value === 'taken') { stepError.value = 'Ce slug est déjà utilisé.'; return }
    if (slugStatus.value === 'checking') { stepError.value = 'Vérification du slug en cours…'; return }
    if (!form.value.description.trim()) { stepError.value = 'La description est requise.'; return }
    if (!form.value.date) { stepError.value = 'La date est requise.'; return }
    if (!form.value.tags.length) { stepError.value = 'Au moins un tag est requis.'; return }
  }
  if (currentStep.value === 2 && !form.value.content.trim()) {
    stepError.value = 'Le contenu est requis.'; return
  }
  if (currentStep.value < STEPS.length) currentStep.value++
}

function prevStep() {
  stepError.value = ''
  if (currentStep.value > 1) currentStep.value--
}

// ── Slug ───────────────────────────────────────────────────────
let slugEdited = false
const slugSuggestion = ref('')

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

function onTitleInput(e: Event) {
  const title = (e.target as HTMLInputElement).value
  const suggested = slugify(title)
  slugSuggestion.value = suggested
  if (!slugEdited) {
    form.value = { ...form.value, title, slug: suggested }
    debouncedCheck(suggested)
  } else {
    form.value = { ...form.value, title }
  }
}

function onSlugInput(e: Event) {
  slugEdited = true
  const val = slugify((e.target as HTMLInputElement).value)
  ;(e.target as HTMLInputElement).value = val
  form.value = { ...form.value, slug: val }
  debouncedCheck(val)
}

function applySuggestion() {
  slugEdited = false
  form.value = { ...form.value, slug: slugSuggestion.value }
  checkSlug(slugSuggestion.value)
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'
const slugStatus = ref<SlugStatus>('idle')

async function checkSlug(slug: string) {
  if (!slug.trim()) { slugStatus.value = 'idle'; return }
  slugStatus.value = 'checking'
  try {
    const res = await $fetch<{ available: boolean }>(`/api/articles/check-slug?slug=${slug}&exclude=${articleId}`)
    slugStatus.value = res.available ? 'available' : 'taken'
  } catch { slugStatus.value = 'error' }
}

const debouncedCheck = useDebounceFn(checkSlug, 400)

// ── Tags ───────────────────────────────────────────────────────
const tagInput = ref('')

function addTag() {
  const tag = normalizeTag(tagInput.value)
  if (tag && !form.value.tags.includes(tag)) form.value.tags = [...form.value.tags, tag]
  tagInput.value = ''
}

function removeTag(tag: string) {
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
}

// ── Suggestions produit ────────────────────────────────────────
const presetPicker = ref<ComponentPublicInstance & { refresh: () => void } | null>(null)
const savingPreset = ref(false)
const presetSaved = ref(false)

async function saveAsPreset() {
  if (!form.value.product.title || !form.value.product.url) return
  savingPreset.value = true
  try {
    await $fetch('/api/product-presets', {
      method: 'POST',
      body: {
        title: form.value.product.title,
        description: form.value.product.description,
        url: form.value.product.url,
        image: form.value.product.image,
        cta: form.value.product.cta,
      },
    })
    presetSaved.value = true
    presetPicker.value?.refresh()
    setTimeout(() => { presetSaved.value = false }, 2500)
  }
  catch { /* silent */ }
  finally { savingPreset.value = false }
}

function applyPreset(preset: { title: string; description: string; url: string; image: string; cta: string }) {
  form.value.product.title = preset.title
  form.value.product.description = preset.description
  form.value.product.url = preset.url
  form.value.product.image = preset.image
  form.value.product.cta = preset.cta
}

// ── Sauvegarde ─────────────────────────────────────────────────
const saving = ref(false)
const saveError = ref('')

async function save() {
  saveError.value = ''
  saving.value = true

  const product = form.value.product.enabled ? {
    title: form.value.product.title, description: form.value.product.description,
    url: form.value.product.url, image: form.value.product.image,
    cta: form.value.product.cta || 'Voir sur Amazon',
  } : null

  const { error } = await client.from('articles').update({
    title: form.value.title, description: form.value.description,
    slug: form.value.slug, date: form.value.date, tags: form.value.tags,
    cover: form.value.cover || null, content: form.value.content,
    published: form.value.published, product,
  }).eq('id', articleId)

  saving.value = false

  if (error) {
    saveError.value = error.message.includes('duplicate')
      ? `Le slug "${form.value.slug}" est déjà utilisé.`
      : `Erreur : ${error.message}`
    return
  }

  await navigateTo('/dashboard/articles')
}

const estimatedReadingTime = computed(() => {
  const words = form.value.content.trim().split(/\s+/).filter(Boolean).length
  return `~${Math.max(1, Math.round(words / 200))} min de lecture`
})
</script>

<template>
  <div class="p-6 lg:p-8">

    <!-- Skeleton chargement -->
    <div v-if="pageLoading" class="space-y-4">
      <div class="h-10 w-64 animate-pulse rounded-lg bg-muted/50" />
      <div class="h-3 w-full animate-pulse rounded-full bg-muted/40" />
      <div class="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
    </div>

    <template v-else>
      <!-- En-tête -->
      <div class="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Modifier l'article</h1>
          <p v-if="originalSlug" class="mt-1 font-mono text-sm text-muted-foreground">/blog/{{ originalSlug }}</p>
        </div>
        <DashboardMarkdownGuideDialog />
      </div>

      <!-- Indicateur d'étapes -->
      <div class="mb-8 flex items-start">
        <template v-for="(step, i) in STEPS" :key="i">
          <div class="flex flex-col items-center">
            <div
              :class="[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
                currentStep > i + 1
                  ? 'border-primary bg-primary text-primary-foreground'
                  : currentStep === i + 1
                    ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'border-border bg-background text-muted-foreground',
              ]"
            >
              <Check v-if="currentStep > i + 1" class="h-4 w-4" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              :class="[
                'mt-2 hidden whitespace-nowrap text-xs font-medium sm:block',
                currentStep === i + 1 ? 'text-foreground' : 'text-muted-foreground',
              ]"
            >{{ step.label }}</span>
          </div>
          <div
            v-if="i < STEPS.length - 1"
            :class="['mt-4 h-0.5 flex-1 transition-colors duration-300', currentStep > i + 1 ? 'bg-primary' : 'bg-border']"
          />
        </template>
      </div>

      <!-- Contenu de l'étape -->
      <div class="rounded-xl border border-border bg-background p-6 lg:p-8">

        <!-- Étape 1 : Métadonnées -->
        <div v-if="currentStep === 1" class="space-y-5">
          <div>
            <h2 class="text-lg font-bold text-foreground">Métadonnées</h2>
            <p class="mt-0.5 text-sm text-muted-foreground">Informations de base de l'article</p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground" for="title">
              Titre <span class="text-destructive">*</span>
            </label>
            <input
              id="title"
              :value="form.title"
              type="text"
              placeholder="Mon super article"
              class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              @input="onTitleInput"
            />
            <div v-if="slugSuggestion && slugSuggestion !== form.slug" class="mt-2 flex items-center gap-2">
              <Wand2 class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span class="text-xs text-muted-foreground">Suggestion :</span>
              <button
                type="button"
                class="inline-flex items-center rounded-md border border-dashed border-primary/40 bg-primary/5 px-2 py-0.5 font-mono text-xs text-primary transition-colors hover:bg-primary/10"
                @click="applySuggestion"
              >{{ slugSuggestion }}</button>
              <span class="text-xs text-muted-foreground">— cliquez pour appliquer</span>
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground" for="slug">
              Slug (URL) <span class="text-destructive">*</span>
            </label>
            <div class="flex items-center gap-2">
              <span class="shrink-0 text-xs text-muted-foreground">/blog/</span>
              <div class="relative flex-1">
                <input
                  id="slug"
                  :value="form.slug"
                  type="text"
                  placeholder="mon-super-article"
                  :class="[
                    'w-full rounded-lg border bg-muted/30 py-2.5 pl-4 pr-10 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2',
                    slugStatus === 'taken' ? 'border-destructive focus:ring-destructive/40'
                    : slugStatus === 'available' ? 'border-green-500 focus:ring-green-500/40'
                    : 'border-border focus:ring-primary/40',
                  ]"
                  @input="onSlugInput"
                />
                <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <Loader2 v-if="slugStatus === 'checking'" class="h-4 w-4 animate-spin text-muted-foreground" />
                  <Check v-else-if="slugStatus === 'available'" class="h-4 w-4 text-green-500" />
                  <AlertCircle v-else-if="slugStatus === 'taken' || slugStatus === 'error'" class="h-4 w-4 text-destructive" />
                </div>
              </div>
            </div>
            <p v-if="slugStatus === 'available'" class="mt-1.5 text-xs text-green-600 dark:text-green-400">Ce slug est disponible.</p>
            <p v-else-if="slugStatus === 'taken'" class="mt-1.5 text-xs text-destructive">Ce slug est déjà utilisé par un autre article.</p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground" for="description">
              Description <span class="text-destructive">*</span>
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="2"
              placeholder="Résumé en 1-2 phrases"
              class="w-full resize-none rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="mt-1 text-xs text-muted-foreground">{{ form.description.length }}/160 caractères recommandés</p>
          </div>

          <div class="max-w-xs">
            <label class="mb-1.5 block text-sm font-medium text-foreground" for="date">
              Date <span class="text-destructive">*</span>
            </label>
            <input
              id="date"
              v-model="form.date"
              type="date"
              class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Tags <span class="text-destructive">*</span>
            </label>
            <div class="mb-2 flex flex-wrap gap-1.5">
              <span
                v-for="tag in form.tags"
                :key="tag"
                class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {{ tag }}
                <button type="button" class="transition-colors hover:text-destructive" @click="removeTag(tag)">
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="tagInput"
                type="text"
                placeholder="Ajouter un tag… (Entrée ou virgule)"
                class="flex-1 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                @keydown="onTagKeydown"
              />
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                @click="addTag"
              >
                <Plus class="h-4 w-4" />
                Ajouter
              </button>
            </div>
          </div>

          <!-- Publié -->
          <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5 transition-colors hover:bg-muted/50">
            <input
              v-model="form.published"
              type="checkbox"
              class="h-4 w-4 rounded accent-primary"
            />
            <span class="text-sm font-medium text-foreground">Article publié</span>
          </label>
        </div>

        <!-- Étape 2 : Contenu -->
        <div v-else-if="currentStep === 2" class="space-y-4">
          <div>
            <h2 class="text-lg font-bold text-foreground">Contenu</h2>
            <p class="mt-0.5 text-sm text-muted-foreground">Rédigez votre article en Markdown</p>
          </div>
          <ClientOnly>
            <DashboardMarkdownEditor
              :model-value="form.content"
              @update:model-value="form.content = $event"
            />
            <template #fallback>
              <div class="h-96 animate-pulse rounded-xl border border-border bg-muted/30" />
            </template>
          </ClientOnly>
        </div>

        <!-- Étape 3 : Placement produit -->
        <div v-else-if="currentStep === 3" class="space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-foreground">Placement produit</h2>
              <p class="mt-0.5 text-sm text-muted-foreground">Optionnel — affiché entre le contenu et la signature</p>
            </div>
            <label class="flex cursor-pointer items-center gap-2">
              <input v-model="form.product.enabled" type="checkbox" class="h-4 w-4 rounded accent-primary" />
              <span class="text-sm text-muted-foreground">Activer</span>
            </label>
          </div>

          <template v-if="form.product.enabled">
            <!-- Suggestions enregistrées -->
            <DashboardProductPresetPicker
              ref="presetPicker"
              @apply="applyPreset"
            />

            <!-- Champs du produit -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-foreground">Nom du produit</label>
                <input v-model="form.product.title" type="text" placeholder="La CyberSécurité en 10 Chapitres"
                  class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-foreground">Description</label>
                <textarea v-model="form.product.description" rows="2"
                  class="w-full resize-none rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-foreground">URL du produit</label>
                <input v-model="form.product.url" type="url" placeholder="https://amazon.fr/..."
                  class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-foreground">URL de l'image</label>
                <input v-model="form.product.image" type="url"
                  class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-foreground">Texte du bouton</label>
                <input v-model="form.product.cta" type="text" placeholder="Voir sur Amazon"
                  class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>

            <!-- Enregistrer comme suggestion -->
            <div class="flex items-center justify-between gap-4 rounded-xl border border-dashed border-border px-4 py-3">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-foreground">Enregistrer dans mes suggestions</p>
                <p class="text-xs text-muted-foreground">
                  Sauvegardez ce produit pour le réutiliser en un clic sur vos prochains articles.
                </p>
              </div>
              <button
                type="button"
                :disabled="!form.product.title || !form.product.url || savingPreset"
                class="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                :class="presetSaved ? 'text-green-600 border-green-500/40' : 'text-muted-foreground'"
                :title="!form.product.title || !form.product.url ? 'Remplissez au moins le nom et l\'URL' : ''"
                @click="saveAsPreset"
              >
                <Check v-if="presetSaved && !savingPreset" class="h-4 w-4" />
                <Loader2 v-else-if="savingPreset" class="h-4 w-4 animate-spin" />
                <BookmarkPlus v-else class="h-4 w-4" />
                {{ savingPreset ? 'Sauvegarde…' : presetSaved ? 'Enregistré !' : 'Enregistrer' }}
              </button>
            </div>
          </template>

          <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
            <Package class="mb-3 h-9 w-9 text-muted-foreground/40" />
            <p class="text-sm text-muted-foreground">Activez pour afficher un encart produit dans l'article</p>
          </div>
        </div>

        <!-- Étape 4 : Enregistrer -->
        <div v-else-if="currentStep === 4" class="space-y-6">
          <div>
            <h2 class="text-lg font-bold text-foreground">Récapitulatif</h2>
            <p class="mt-0.5 text-sm text-muted-foreground">Vérifiez avant d'enregistrer</p>
          </div>

          <div class="space-y-3 rounded-xl border border-border bg-muted/20 p-5">
            <p class="text-lg font-bold leading-snug text-foreground">{{ form.title }}</p>
            <p class="text-sm text-muted-foreground">{{ form.description }}</p>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
              <span>📅 {{ form.date }}</span>
              <span>⏱ {{ estimatedReadingTime }}</span>
              <span>🔗 /blog/{{ form.slug }}</span>
              <span :class="form.published ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'">
                {{ form.published ? '✅ Publié' : '📝 Brouillon' }}
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in form.tags"
                :key="tag"
                class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >{{ tag }}</span>
            </div>
            <div v-if="form.product.enabled" class="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              <Package class="h-3.5 w-3.5 shrink-0" />
              Placement produit : {{ form.product.title || '—' }}
            </div>
          </div>

          <p v-if="saveError" class="text-sm text-destructive">{{ saveError }}</p>

          <button
            type="button"
            :disabled="saving"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            @click="save"
          >
            <Loader2 v-if="saving" class="h-5 w-5 animate-spin" />
            <Save v-else class="h-5 w-5" />
            {{ saving ? 'Enregistrement…' : 'Enregistrer les modifications' }}
          </button>
        </div>

      </div>

      <!-- Espace pour la barre fixe -->
      <div class="h-20" />

      <!-- Barre navigation fixe -->
      <div class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm lg:left-60" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
        <p v-if="stepError" class="px-4 pt-2 text-center text-xs text-destructive sm:hidden">{{ stepError }}</p>
        <div class="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            v-if="currentStep > 1"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground touch-manipulation"
            @click="prevStep"
          >
            <ChevronLeft class="h-4 w-4" />
            Retour
          </button>
          <div v-else />

          <div class="flex items-center gap-3">
            <p v-if="stepError" class="hidden text-sm text-destructive sm:block">{{ stepError }}</p>
            <button
              v-if="currentStep < STEPS.length"
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 touch-manipulation"
              @click="nextStep"
            >
              Suivant
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

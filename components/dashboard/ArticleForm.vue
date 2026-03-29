<script setup lang="ts">
import { X, Plus, Package, Check, Loader2, AlertCircle, Wand2 } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

export interface ArticleFormData {
  title: string
  description: string
  slug: string
  date: string
  tags: string[]
  cover: string
  content: string
  published: boolean
  product: {
    enabled: boolean
    title: string
    description: string
    url: string
    image: string
    cta: string
  }
}

const props = defineProps<{
  modelValue: ArticleFormData
  loading?: boolean
  submitLabel?: string
  /** ID de l'article courant (mode édition) pour l'exclure du check de slug */
  currentId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ArticleFormData]
  submit: []
}>()

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function update<K extends keyof ArticleFormData>(key: K, value: ArticleFormData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function updateProduct<K extends keyof ArticleFormData['product']>(key: K, value: ArticleFormData['product'][K]) {
  emit('update:modelValue', {
    ...props.modelValue,
    product: { ...props.modelValue.product, [key]: value },
  })
}

// ── Slug ───────────────────────────────────────────────────────
let slugEdited = false

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Suggestion générée depuis le titre (affichée sous le titre)
const slugSuggestion = ref('')

function onTitleInput(e: Event) {
  const title = (e.target as HTMLInputElement).value
  const suggested = slugify(title)
  slugSuggestion.value = suggested

  if (!slugEdited) {
    // Un seul emit groupé pour éviter la course entre les deux updates
    emit('update:modelValue', { ...props.modelValue, title, slug: suggested })
    debouncedCheck(suggested)
  } else {
    emit('update:modelValue', { ...props.modelValue, title })
  }
}

function applySuggestion() {
  slugEdited = false
  update('slug', slugSuggestion.value)
  checkSlug(slugSuggestion.value)
}

function onSlugInput(e: Event) {
  slugEdited = true
  const val = slugify((e.target as HTMLInputElement).value)
  // Normalise à la volée
  ;(e.target as HTMLInputElement).value = val
  update('slug', val)
  debouncedCheck(val)
}

// ── Vérification disponibilité slug ───────────────────────────
type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'
const slugStatus = ref<SlugStatus>('idle')

async function checkSlug(slug: string) {
  if (!slug.trim()) { slugStatus.value = 'idle'; return }
  slugStatus.value = 'checking'
  try {
    const params = new URLSearchParams({ slug })
    if (props.currentId) params.set('exclude', props.currentId)
    const res = await $fetch<{ available: boolean }>(`/api/articles/check-slug?${params}`)
    slugStatus.value = res.available ? 'available' : 'taken'
  } catch {
    slugStatus.value = 'error'
  }
}

const debouncedCheck = useDebounceFn(checkSlug, 400)

// Vérifier au montage si un slug est déjà prérempli (mode édition)
onMounted(() => {
  if (props.modelValue.slug) {
    slugSuggestion.value = props.modelValue.slug
    checkSlug(props.modelValue.slug)
  }
})

// ── Tags ───────────────────────────────────────────────────────
const tagInput = ref('')

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    update('tags', [...form.value.tags, tag])
  }
  tagInput.value = ''
}

function removeTag(tag: string) {
  update('tags', form.value.tags.filter((t) => t !== tag))
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  }
}
</script>

<template>
  <form class="space-y-8" @submit.prevent="$emit('submit')">

    <!-- ── Métadonnées ───────────────────────────────────────── -->
    <section class="rounded-xl border border-border bg-background p-6 space-y-5">
      <h2 class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Métadonnées</h2>

      <!-- Titre -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-foreground" for="title">
          Titre <span class="text-destructive">*</span>
        </label>
        <input
          id="title"
          :value="form.title"
          type="text"
          required
          placeholder="Mon super article"
          class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          @input="onTitleInput"
        />

        <!-- Suggestion de slug depuis le titre -->
        <div v-if="slugSuggestion && slugSuggestion !== form.slug" class="mt-2 flex items-center gap-2">
          <Wand2 class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span class="text-xs text-muted-foreground">Suggestion :</span>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-primary/40 bg-primary/5 px-2 py-0.5 font-mono text-xs text-primary transition-colors hover:bg-primary/10"
            @click="applySuggestion"
          >
            {{ slugSuggestion }}
          </button>
          <span class="text-xs text-muted-foreground">— cliquez pour appliquer</span>
        </div>
      </div>

      <!-- Slug -->
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
              required
              placeholder="mon-super-article"
              :class="[
                'w-full rounded-lg border bg-muted/30 py-2.5 pl-4 pr-10 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2',
                slugStatus === 'taken'
                  ? 'border-destructive focus:ring-destructive/40'
                  : slugStatus === 'available'
                    ? 'border-green-500 focus:ring-green-500/40'
                    : 'border-border focus:ring-primary/40',
              ]"
              @input="onSlugInput"
            />
            <!-- Indicateur status -->
            <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <Loader2 v-if="slugStatus === 'checking'" class="h-4 w-4 animate-spin text-muted-foreground" />
              <Check v-else-if="slugStatus === 'available'" class="h-4 w-4 text-green-500" />
              <AlertCircle v-else-if="slugStatus === 'taken' || slugStatus === 'error'" class="h-4 w-4 text-destructive" />
            </div>
          </div>
        </div>

        <!-- Message disponibilité -->
        <p v-if="slugStatus === 'available'" class="mt-1.5 text-xs text-green-600 dark:text-green-400">
          Ce slug est disponible.
        </p>
        <p v-else-if="slugStatus === 'taken'" class="mt-1.5 text-xs text-destructive">
          Ce slug est déjà utilisé par un autre article. Choisissez-en un autre.
        </p>
        <p v-else class="mt-1 text-xs text-muted-foreground">
          Généré automatiquement depuis le titre — sans majuscule, accent ni caractère spécial.
        </p>
      </div>

      <!-- Description -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-foreground" for="description">
          Description <span class="text-destructive">*</span>
        </label>
        <textarea
          id="description"
          :value="form.description"
          required
          rows="2"
          placeholder="Résumé en 1-2 phrases (SEO, carte article)"
          class="w-full resize-none rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          @input="update('description', ($event.target as HTMLTextAreaElement).value)"
        />
        <p class="mt-1 text-xs text-muted-foreground">{{ form.description.length }}/160 caractères recommandés</p>
      </div>

      <!-- Date + Publié -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-foreground" for="date">
            Date <span class="text-destructive">*</span>
          </label>
          <input
            id="date"
            :value="form.date"
            type="date"
            required
            class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            @input="update('date', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="flex items-end">
          <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5 transition-colors hover:bg-muted/50">
            <input
              type="checkbox"
              :checked="form.published"
              class="h-4 w-4 rounded accent-primary"
              @change="update('published', ($event.target as HTMLInputElement).checked)"
            />
            <span class="text-sm font-medium text-foreground">Publier l'article</span>
          </label>
        </div>
      </div>

      <!-- Tags -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-foreground">
          Tags <span class="text-destructive">*</span>
        </label>
        <div class="flex flex-wrap gap-1.5 mb-2">
          <span
            v-for="tag in form.tags"
            :key="tag"
            class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            {{ tag }}
            <button type="button" class="hover:text-destructive" @click="removeTag(tag)">
              <X class="h-3 w-3" />
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
    </section>

    <!-- ── Contenu ───────────────────────────────────────────── -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Contenu <span class="text-destructive">*</span>
      </h2>
      <ClientOnly>
        <DashboardMarkdownEditor
          :model-value="form.content"
          @update:model-value="update('content', $event)"
        />
        <template #fallback>
          <div class="h-64 rounded-xl border border-border bg-muted/30 animate-pulse" />
        </template>
      </ClientOnly>
    </section>

    <!-- ── Placement produit ────────────────────────────────── -->
    <section class="rounded-xl border border-border bg-background p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Package class="h-4 w-4 text-muted-foreground" />
          <h2 class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Placement produit (optionnel)</h2>
        </div>
        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            :checked="form.product.enabled"
            class="h-4 w-4 rounded accent-primary"
            @change="updateProduct('enabled', ($event.target as HTMLInputElement).checked)"
          />
          <span class="text-sm text-muted-foreground">Activer</span>
        </label>
      </div>

      <template v-if="form.product.enabled">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="mb-1.5 block text-sm font-medium text-foreground">Nom du produit</label>
            <input
              :value="form.product.title"
              type="text"
              placeholder="La CyberSécurité en 10 Chapitres"
              class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              @input="updateProduct('title', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <div class="sm:col-span-2">
            <label class="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <textarea
              :value="form.product.description"
              rows="2"
              placeholder="Ce qu'on vient de couvrir, vous le retrouverez plus en détail dans mon livre."
              class="w-full resize-none rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              @input="updateProduct('description', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground">URL du produit</label>
            <input
              :value="form.product.url"
              type="url"
              placeholder="https://amazon.fr/..."
              class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              @input="updateProduct('url', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground">URL de l'image</label>
            <input
              :value="form.product.image"
              type="url"
              placeholder="https://..."
              class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              @input="updateProduct('image', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground">Texte du bouton</label>
            <input
              :value="form.product.cta"
              type="text"
              placeholder="Voir sur Amazon"
              class="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              @input="updateProduct('cta', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </template>
    </section>

    <!-- ── Bouton submit ────────────────────────────────────── -->
    <div class="flex justify-end gap-3 pb-8">
      <NuxtLink
        to="/dashboard/articles"
        class="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        Annuler
      </NuxtLink>
      <button
        type="submit"
        :disabled="loading || slugStatus === 'taken' || slugStatus === 'checking'"
        :title="slugStatus === 'taken' ? 'Le slug est déjà utilisé' : slugStatus === 'checking' ? 'Vérification du slug…' : undefined"
        class="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ loading ? 'Enregistrement…' : (submitLabel ?? 'Enregistrer') }}
      </button>
    </div>
  </form>
</template>

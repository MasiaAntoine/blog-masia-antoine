<script setup lang="ts">
import {
  FileText, Pencil, Sparkles, X, ChevronRight, ChevronLeft,
  Send, Check, Loader2, Plus, Package, AlertCircle, Wand2,
} from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'
import { Dialog, DialogContent } from '~/components/ui/dialog'

definePageMeta({ middleware: 'dashboard', layout: 'dashboard' })

const client = useSupabaseClient()
const { isProfileComplete, profileLoading } = useProfileGuard()

watch(profileLoading, (loading) => {
  if (!loading && !isProfileComplete.value) navigateTo('/dashboard/profile')
})

const today = new Date().toISOString().split('T')[0] ?? new Date().toISOString().slice(0, 10)

// ── Mode selection ─────────────────────────────────────────────
type Mode = 'manual' | 'import'
const modeDialogOpen = ref(true)
const mode = ref<Mode | null>(null)

// Si l'utilisateur ferme le dialog sans choisir → retour à la liste
watch(modeDialogOpen, (open) => {
  if (!open && !mode.value) navigateTo('/dashboard/articles')
})

function selectMode(m: Mode) {
  mode.value = m
  modeDialogOpen.value = false
  if (m === 'import') showImportPanel.value = true
}

// ── Form state ─────────────────────────────────────────────────
const form = ref({
  title: '',
  description: '',
  slug: '',
  date: today,
  tags: [] as string[],
  content: '',
  product: {
    enabled: false,
    title: '',
    description: '',
    url: '',
    image: '',
    cta: 'Voir sur Amazon',
  },
})

// ── Stepper ────────────────────────────────────────────────────
const STEPS = [
  { label: 'Métadonnées' },
  { label: 'Contenu' },
  { label: 'Placement produit' },
  { label: 'Publier' },
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
    stepError.value = 'Le contenu est requis.'
    return
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
    const res = await $fetch<{ available: boolean }>(`/api/articles/check-slug?slug=${slug}`)
    slugStatus.value = res.available ? 'available' : 'taken'
  } catch { slugStatus.value = 'error' }
}

const debouncedCheck = useDebounceFn(checkSlug, 400)

// ── Tags ───────────────────────────────────────────────────────
const tagInput = ref('')

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) form.value.tags = [...form.value.tags, tag]
  tagInput.value = ''
}

function removeTag(tag: string) {
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
}

// ── Import Markdown ────────────────────────────────────────────
const showImportPanel = ref(false)
const importRaw = ref('')
const importError = ref('')

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: raw.trim() }
  const yamlBlock = match[1]!
  const body = match[2]!.trim()
  const meta: Record<string, unknown> = {}
  const lines = yamlBlock.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]!
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue }
    const rootMatch = line.match(/^(\w+):\s*(.*)$/)
    if (!rootMatch) { i++; continue }
    const key = rootMatch[1]!
    let val = rootMatch[2]!.trim()
    if (val.startsWith('[')) {
      meta[key] = val.replace(/^\[|\]$/g, '').split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
      i++; continue
    }
    if (val) {
      val = val.replace(/^['"]|['"]$/g, '')
      meta[key] = val === 'true' ? true : val === 'false' ? false : val
      i++; continue
    }
    const obj: Record<string, string> = {}
    i++
    while (i < lines.length) {
      const child = lines[i]!
      const childMatch = child.match(/^  (\w+):\s*['"]?(.*?)['"]?\s*$/)
      if (!childMatch) break
      obj[childMatch[1]!] = childMatch[2]!
      i++
    }
    meta[key] = obj
  }
  return { meta, body }
}

function applyImport() {
  importError.value = ''
  if (!importRaw.value.trim()) { importError.value = 'Collez votre fichier Markdown ici.'; return }
  const { meta, body } = parseFrontmatter(importRaw.value)
  if (!meta.title) { importError.value = 'Frontmatter introuvable ou champ `title` manquant. Vérifiez que votre fichier commence par `---`.'; return }
  const title = String(meta.title ?? '')
  const suggested = slugify(title)
  slugSuggestion.value = suggested
  const rawProduct = meta.product as Record<string, string> | undefined
  form.value = {
    ...form.value,
    title,
    slug: suggested,
    description: String(meta.description ?? ''),
    date: String(meta.date ?? today),
    tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
    content: body,
    product: {
      enabled: !!rawProduct?.url,
      title: rawProduct?.title ?? '',
      description: rawProduct?.description ?? '',
      url: rawProduct?.url ?? '',
      image: rawProduct?.image ?? '',
      cta: rawProduct?.cta ?? 'Voir sur Amazon',
    },
  }
  checkSlug(suggested)
  showImportPanel.value = false
  importRaw.value = ''
}

// ── Publish ────────────────────────────────────────────────────
const saving = ref(false)
const saveError = ref('')

async function publish() {
  saveError.value = ''
  saving.value = true
  const { data: { user } } = await client.auth.getUser()
  if (!user?.id) { saveError.value = 'Session expirée, veuillez vous reconnecter.'; saving.value = false; return }
  const product = form.value.product.enabled ? {
    title: form.value.product.title, description: form.value.product.description,
    url: form.value.product.url, image: form.value.product.image,
    cta: form.value.product.cta || 'Voir sur Amazon',
  } : null
  const { error } = await client.from('articles').insert({
    author_id: user.id, title: form.value.title, description: form.value.description,
    slug: form.value.slug, date: form.value.date, tags: form.value.tags,
    cover: null, content: form.value.content, published: true, product,
  })
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

    <!-- ── Dialog de choix de mode ───────────────────────────── -->
    <Dialog v-model:open="modeDialogOpen">
      <DialogContent size="lg" class="p-0">
        <div class="border-b border-border px-6 py-5 pr-14">
          <p class="text-lg font-semibold text-foreground">Créer un article</p>
          <p class="mt-0.5 text-sm text-muted-foreground">Choisissez votre mode de création</p>
        </div>
        <div class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <button
            type="button"
            class="group flex flex-col items-start gap-4 rounded-xl border-2 border-border bg-background p-5 text-left transition-all hover:border-primary/60 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/40"
            @click="selectMode('manual')"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
              <Pencil class="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <div>
              <p class="font-semibold text-foreground">Manuel</p>
              <p class="mt-1 text-sm text-muted-foreground">Remplissez les champs étape par étape depuis zéro.</p>
            </div>
          </button>
          <button
            type="button"
            class="group flex flex-col items-start gap-4 rounded-xl border-2 border-border bg-background p-5 text-left transition-all hover:border-primary/60 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/40"
            @click="selectMode('import')"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
              <FileText class="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <div>
              <p class="font-semibold text-foreground">Importer un Markdown</p>
              <p class="mt-1 text-sm text-muted-foreground">Collez un fichier <code class="rounded bg-muted px-1 py-0.5 text-xs">.md</code> pour pré-remplir tous les champs automatiquement.</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── En-tête ────────────────────────────────────────────── -->
    <div v-if="mode" class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Nouvel article</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Mode :
          <button class="font-medium text-primary underline-offset-2 hover:underline" @click="modeDialogOpen = true; mode = null">
            {{ mode === 'import' ? 'Import Markdown' : 'Manuel' }}
          </button>
        </p>
      </div>
      <DashboardMarkdownGuideDialog />
    </div>

    <!-- ── Panneau import Markdown ───────────────────────────── -->
    <div v-if="showImportPanel" class="mb-8 overflow-hidden rounded-xl border border-dashed border-primary/40 bg-primary/5">
      <div class="flex items-center gap-3 border-b border-border/50 px-5 py-4">
        <FileText class="h-4 w-4 text-primary" />
        <p class="text-sm font-semibold text-foreground">Collez votre fichier Markdown</p>
      </div>
      <div class="space-y-3 px-5 pb-5 pt-4">
        <textarea
          v-model="importRaw"
          rows="10"
          placeholder="Collez ici le contenu de votre fichier .md (frontmatter + contenu)…"
          class="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          spellcheck="false"
        />
        <p v-if="importError" class="text-xs text-destructive">{{ importError }}</p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            @click="applyImport"
          >
            <Sparkles class="h-4 w-4" />
            Pré-remplir les champs
          </button>
        </div>
      </div>
    </div>

    <!-- ── Stepper ────────────────────────────────────────────── -->
    <template v-if="mode && !showImportPanel">

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
            :class="[
              'mt-4 h-0.5 flex-1 transition-colors duration-300',
              currentStep > i + 1 ? 'bg-primary' : 'bg-border',
            ]"
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

          <!-- Titre -->
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
            <p v-else class="mt-1 text-xs text-muted-foreground">Généré automatiquement — sans majuscule, accent ni caractère spécial.</p>
          </div>

          <!-- Description -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground" for="description">
              Description <span class="text-destructive">*</span>
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="2"
              placeholder="Résumé en 1-2 phrases (SEO, carte article)"
              class="w-full resize-none rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="mt-1 text-xs text-muted-foreground">{{ form.description.length }}/160 caractères recommandés</p>
          </div>

          <!-- Date -->
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

          <!-- Tags -->
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
          </template>

          <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
            <Package class="mb-3 h-9 w-9 text-muted-foreground/40" />
            <p class="text-sm text-muted-foreground">Activez pour afficher un encart produit dans l'article</p>
            <p class="mt-0.5 text-xs text-muted-foreground">Vous pouvez aussi passer cette étape</p>
          </div>
        </div>

        <!-- Étape 4 : Publier -->
        <div v-else-if="currentStep === 4" class="space-y-6">
          <div>
            <h2 class="text-lg font-bold text-foreground">Récapitulatif</h2>
            <p class="mt-0.5 text-sm text-muted-foreground">Vérifiez avant de publier</p>
          </div>

          <div class="space-y-3 rounded-xl border border-border bg-muted/20 p-5">
            <p class="text-lg font-bold leading-snug text-foreground">{{ form.title }}</p>
            <p class="text-sm text-muted-foreground">{{ form.description }}</p>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
              <span>📅 {{ form.date }}</span>
              <span>⏱ {{ estimatedReadingTime }}</span>
              <span>🔗 /blog/{{ form.slug }}</span>
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
            @click="publish"
          >
            <Loader2 v-if="saving" class="h-5 w-5 animate-spin" />
            <Send v-else class="h-5 w-5" />
            {{ saving ? 'Publication en cours…' : 'Publier l\'article' }}
          </button>
        </div>

      </div>

      <!-- Espace pour compenser la barre fixe -->
      <div class="h-20" />

    </template>

    <!-- ── Barre de navigation fixe en bas ───────────────────── -->
    <div
      v-if="mode && !showImportPanel"
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm lg:left-60"
    >
      <div class="flex items-center justify-between px-6 py-3 lg:px-8">
        <button
          v-if="currentStep > 1"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          @click="prevStep"
        >
          <ChevronLeft class="h-4 w-4" />
          Retour
        </button>
        <div v-else />

        <div class="flex items-center gap-3">
          <p v-if="stepError" class="text-sm text-destructive">{{ stepError }}</p>
          <button
            v-if="currentStep < STEPS.length"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            @click="nextStep"
          >
            Suivant
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

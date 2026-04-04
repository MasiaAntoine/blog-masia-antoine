<script setup lang="ts">
import { Save, User, Palette } from 'lucide-vue-next'

definePageMeta({ middleware: 'dashboard', layout: 'dashboard' })

const client = useSupabaseClient()

const userId = ref<string | null>(null)
const userEmail = ref('')
const form = ref({ name: '', role: '', avatar_url: '', cover_color: '#0f172a' })
const loading = ref(true)
const isFirstSetup = ref(false)
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const errors = computed(() => ({
  name: !form.value.name.trim() ? 'Le nom complet est requis.' : '',
  role: !form.value.role.trim() ? 'La fonction est requise.' : '',
  avatar_url: !form.value.avatar_url.trim() ? "L'URL de la photo est requise." : '',
}))

const isValid = computed(() => !errors.value.name && !errors.value.role && !errors.value.avatar_url)

const submitted = ref(false)

const COLOR_PRESETS = [
  // Bleus
  { label: 'Ardoise', value: '#0f172a' },
  { label: 'Marine', value: '#0c2340' },
  { label: 'Bleu royal', value: '#0f3460' },
  { label: 'Bleu acier', value: '#1e3a5f' },
  { label: 'Bleu nuit', value: '#1e3a8a' },
  { label: 'Bleu électrique', value: '#1d4ed8' },
  // Indigo / Violet
  { label: 'Indigo', value: '#312e81' },
  { label: 'Indigo vif', value: '#3730a3' },
  { label: 'Violet profond', value: '#4c1d95' },
  { label: 'Violet nuit', value: '#3b0764' },
  { label: 'Prune', value: '#581c87' },
  { label: 'Aubergine', value: '#7c1d6f' },
  // Bordeaux / Rose
  { label: 'Fuchsia', value: '#701a75' },
  { label: 'Rose nuit', value: '#831843' },
  { label: 'Bordeaux', value: '#9f1239' },
  { label: 'Grenat', value: '#881337' },
  // Rouges / Briques
  { label: 'Rouge nuit', value: '#7f1d1d' },
  { label: 'Rubis', value: '#991b1b' },
  { label: 'Brique', value: '#7c2d12' },
  { label: 'Rouille', value: '#9a3412' },
  // Verts
  { label: 'Forêt', value: '#14532d' },
  { label: 'Sapin', value: '#166534' },
  { label: 'Émeraude', value: '#065f46' },
  { label: 'Teal', value: '#134e4a' },
  { label: 'Teal vif', value: '#0f766e' },
  { label: 'Pétrole', value: '#164e63' },
  // Neutres
  { label: 'Anthracite', value: '#1f2937' },
  { label: 'Carbone', value: '#111827' },
  { label: 'Pierre', value: '#1c1917' },
  { label: 'Zinc', value: '#18181b' },
  // Chauds
  { label: 'Kaki', value: '#365314' },
  { label: 'Olive', value: '#3f3f00' },
  { label: 'Café', value: '#451a03' },
  { label: 'Chocolat', value: '#422006' },
  { label: 'Bronze', value: '#78350f' },
  { label: 'Or sombre', value: '#713f12' },
]

onMounted(async () => {
  const { data: { user } } = await client.auth.getUser()
  userId.value = user?.id ?? null
  userEmail.value = user?.email ?? ''

  if (!userId.value) {
    loading.value = false
    return
  }

  const { data } = await client
    .from('profiles')
    .select('name, role, avatar_url, cover_color')
    .eq('id', userId.value)
    .single()

  if (data) {
    form.value = {
      name: data.name ?? '',
      role: data.role ?? '',
      avatar_url: data.avatar_url ?? '',
      cover_color: data.cover_color ?? '#0f172a',
    }
    isFirstSetup.value = !data.name?.trim() && !data.role?.trim()
  }
  loading.value = false
})

async function save() {
  submitted.value = true

  if (!userId.value) {
    errorMsg.value = 'Session expirée, veuillez vous reconnecter.'
    return
  }

  if (!isValid.value) return

  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''

  const { error } = await client
    .from('profiles')
    .update({
      name: form.value.name,
      role: form.value.role,
      avatar_url: form.value.avatar_url || null,
      cover_color: form.value.cover_color,
    })
    .eq('id', userId.value)

  saving.value = false

  if (error) {
    errorMsg.value = `Erreur : ${error.message}`
  } else if (isFirstSetup.value) {
    await navigateTo('/dashboard/articles')
  } else {
    successMsg.value = 'Profil mis à jour.'
  }
}
</script>

<template>
  <div class="p-6 lg:p-8">
    <!-- Bandeau premier setup -->
    <div
      v-if="isFirstSetup"
      class="mb-6 flex items-start gap-4 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4"
    >
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        👋
      </div>
      <div>
        <p class="font-semibold text-foreground">Bienvenue ! Configurez votre profil pour commencer</p>
        <p class="mt-0.5 text-sm text-muted-foreground">
          Votre <strong>nom</strong> et votre <strong>fonction</strong> sont requis avant de pouvoir rédiger des articles.
        </p>
      </div>
    </div>

    <div class="mb-8">
      <h1 class="text-2xl font-bold text-foreground">Mon profil</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Ces informations s'afficheront dans vos articles et dans les miniatures
      </p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="h-16 animate-pulse rounded-xl border border-border bg-muted/30" />
    </div>

    <form v-else class="space-y-6" @submit.prevent="save">
      <!-- Aperçu avatar -->
      <div class="flex items-center gap-4">
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
          <img
            v-if="form.avatar_url"
            :src="form.avatar_url"
            alt="Avatar"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center">
            <User class="h-7 w-7 text-muted-foreground" />
          </div>
        </div>
        <div class="min-w-0">
          <p class="font-medium text-foreground">{{ form.name || 'Nom non défini' }}</p>
          <p class="text-sm text-muted-foreground">{{ form.role || 'Rôle non défini' }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ userEmail }}</p>
        </div>
      </div>

      <!-- Nom -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-foreground" for="name">
          Nom complet <span class="text-destructive">*</span>
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="MASIA Antoine"
          :class="[
            'w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2',
            submitted && errors.name
              ? 'border-destructive focus:ring-destructive/40'
              : 'border-border focus:ring-primary/40',
          ]"
        />
        <p v-if="submitted && errors.name" class="mt-1.5 text-xs text-destructive">
          {{ errors.name }}
        </p>
      </div>

      <!-- Rôle -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-foreground" for="role">
          Fonction / Titre <span class="text-destructive">*</span>
        </label>
        <input
          id="role"
          v-model="form.role"
          type="text"
          placeholder="Développeur Full-Stack, DevOps & CyberSécurité"
          :class="[
            'w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2',
            submitted && errors.role
              ? 'border-destructive focus:ring-destructive/40'
              : 'border-border focus:ring-primary/40',
          ]"
        />
        <p v-if="submitted && errors.role" class="mt-1.5 text-xs text-destructive">
          {{ errors.role }}
        </p>
      </div>

      <!-- Avatar URL -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-foreground" for="avatar">
          URL de la photo de profil <span class="text-destructive">*</span>
        </label>
        <input
          id="avatar"
          v-model="form.avatar_url"
          type="url"
          placeholder="https://avatars.githubusercontent.com/u/..."
          :class="[
            'w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2',
            submitted && errors.avatar_url
              ? 'border-destructive focus:ring-destructive/40'
              : 'border-border focus:ring-primary/40',
          ]"
        />
        <p v-if="submitted && errors.avatar_url" class="mt-1.5 text-xs text-destructive">
          {{ errors.avatar_url }}
        </p>
        <p v-else class="mt-1.5 text-xs text-muted-foreground">
          Conseil : utilisez votre avatar GitHub —
          <code class="rounded bg-muted px-1 py-0.5">https://avatars.githubusercontent.com/u/[ID]</code>
        </p>
      </div>

      <!-- Couleur des miniatures -->
      <div class="rounded-xl border border-border bg-muted/20 p-4">
        <div class="mb-3 flex items-center gap-2">
          <Palette class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-medium text-foreground">Couleur des miniatures</span>
        </div>
        <p class="mb-4 text-xs text-muted-foreground">
          Fond de toutes vos miniatures d'articles. Choisissez une couleur sombre pour un meilleur rendu du texte blanc.
        </p>

        <!-- Palettes prédéfinies + picker -->
        <div class="space-y-3">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in COLOR_PRESETS"
              :key="preset.value"
              type="button"
              :title="preset.label"
              class="h-7 w-7 rounded-lg border-2 transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
              :style="{ backgroundColor: preset.value }"
              :class="form.cover_color === preset.value ? 'border-primary shadow-md scale-110' : 'border-transparent'"
              @click="form.cover_color = preset.value"
            />
          </div>

        </div>

        <!-- Aperçu live pleine largeur -->
        <div class="mt-4">
          <p class="mb-1.5 text-xs text-muted-foreground">Aperçu</p>
          <div class="h-64 w-full overflow-hidden rounded-xl border border-border shadow-sm">
            <ArticleCover
              :title="form.name ? `Article de ${form.name}` : 'Titre de l\'article'"
              :tags="['Exemple', 'Tag']"
              :author="{ name: form.name || 'Auteur', role: form.role || '', avatar: form.avatar_url || null }"
              :color="form.cover_color"
                size="lg"
            />
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="successMsg" class="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
        {{ successMsg }}
      </div>
      <div v-if="errorMsg" class="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {{ errorMsg }}
      </div>

      <button
        type="submit"
        :disabled="saving || (submitted && !isValid)"
        class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save class="h-4 w-4" />
        {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </form>
  </div>
</template>

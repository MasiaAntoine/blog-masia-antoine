<script setup lang="ts">
import { Save, User } from 'lucide-vue-next'

definePageMeta({ middleware: 'dashboard', layout: 'dashboard' })

const client = useSupabaseClient()

const userId = ref<string | null>(null)
const userEmail = ref('')
const form = ref({ name: '', role: '', avatar_url: '' })
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

// Déclencher la validation à la soumission uniquement
const submitted = ref(false)

onMounted(async () => {
  // Récupérer l'utilisateur courant depuis la session (plus fiable que useSupabaseUser au montage)
  const { data: { user } } = await client.auth.getUser()
  userId.value = user?.id ?? null
  userEmail.value = user?.email ?? ''

  if (!userId.value) {
    loading.value = false
    return
  }

  const { data } = await client
    .from('profiles')
    .select('name, role, avatar_url')
    .eq('id', userId.value)
    .single()

  if (data) {
    form.value = {
      name: data.name ?? '',
      role: data.role ?? '',
      avatar_url: data.avatar_url ?? '',
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
    })
    .eq('id', userId.value)

  saving.value = false

  if (error) {
    errorMsg.value = `Erreur : ${error.message}`
  } else if (isFirstSetup.value) {
    // Premier setup terminé → aller écrire des articles
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

    <div v-if="loading" class="space-y-4 max-w-lg">
      <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-xl border border-border bg-muted/30" />
    </div>

    <form v-else class="max-w-lg space-y-6" @submit.prevent="save">
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

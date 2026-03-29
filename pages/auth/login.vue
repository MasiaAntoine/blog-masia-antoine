<script setup lang="ts">
definePageMeta({ layout: false })

const client = useSupabaseClient()
const user = useSupabaseUser()

// Déjà connecté → rediriger vers le dashboard
if (user.value) {
  await navigateTo('/dashboard/articles')
}

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function login() {
  if (!email.value || !password.value) return
  loading.value = true
  errorMsg.value = ''

  const { error } = await client.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  loading.value = false

  if (error) {
    errorMsg.value = 'Identifiants incorrects. Vérifiez votre email et mot de passe.'
    return
  }

  // Rechargement complet pour que le cookie de session soit lu côté serveur
  window.location.href = '/dashboard/articles'
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
          B
        </div>
        <h1 class="text-xl font-bold text-foreground">Le Blog d'Antoine</h1>
        <p class="mt-1 text-sm text-muted-foreground">Accès auteurs uniquement</p>
      </div>

      <!-- Formulaire -->
      <form class="space-y-4" @submit.prevent="login">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-foreground" for="email">
            Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="votre@email.fr"
            class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-foreground" for="password">
            Mot de passe
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
            class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div v-if="errorMsg" class="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {{ loading ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-muted-foreground">
        Accès sur invitation uniquement.
      </p>
    </div>
  </div>
</template>

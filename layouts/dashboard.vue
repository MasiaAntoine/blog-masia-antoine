<script setup lang="ts">
import { LayoutDashboard, FileText, User, LogOut, ExternalLink, ChevronRight } from 'lucide-vue-next'

const client = useSupabaseClient()
const route = useRoute()

const profile = ref<{ name: string; role: string; avatar_url: string | null } | null>(null)

onMounted(async () => {
  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser?.id) return
  const { data } = await client
    .from('profiles')
    .select('name, role, avatar_url')
    .eq('id', currentUser.id)
    .single()
  profile.value = data
})

const navLinks = [
  { to: '/dashboard/articles', label: 'Articles', icon: FileText },
  { to: '/dashboard/profile', label: 'Mon profil', icon: User },
]

async function signOut() {
  await client.auth.signOut()
  navigateTo('/auth/login')
}

const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex min-h-screen bg-background text-foreground antialiased">
    <!-- Sidebar desktop -->
    <aside class="hidden w-60 shrink-0 flex-col border-r border-border bg-background lg:flex">
      <!-- Header sidebar -->
      <div class="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">B</div>
        <span class="font-semibold text-foreground">Dashboard</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 space-y-0.5 p-3">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="route.path.startsWith(link.to)
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
        >
          <component :is="link.icon" class="h-4 w-4 shrink-0" />
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Bas sidebar : profil + déconnexion -->
      <div class="border-t border-border p-3 space-y-1">
        <a
          href="/"
          target="_blank"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink class="h-4 w-4 shrink-0" />
          Voir le blog
        </a>
        <button
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          @click="signOut"
        >
          <LogOut class="h-4 w-4 shrink-0" />
          Déconnexion
        </button>

        <!-- Identité -->
        <div class="mt-2 flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <img
            v-if="profile?.avatar_url"
            :src="profile.avatar_url"
            :alt="profile?.name"
            class="h-7 w-7 shrink-0 rounded-full object-cover"
          />
          <div v-else class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {{ profile?.name?.charAt(0)?.toUpperCase() ?? '?' }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold text-foreground">{{ profile?.name || '—' }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ profile?.role || 'Auteur' }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile : header barre -->
    <div class="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
      <div class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">B</div>
        <span class="font-semibold text-sm">Dashboard</span>
      </div>
      <button
        class="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
        @click="sidebarOpen = !sidebarOpen"
      >
        <LayoutDashboard class="h-5 w-5" />
      </button>
    </div>

    <!-- Mobile drawer -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 lg:hidden"
      @click="sidebarOpen = false"
    >
      <div class="absolute inset-0 bg-black/40" />
      <aside class="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-background pt-14">
        <nav class="flex-1 space-y-0.5 p-3">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            :class="route.path.startsWith(link.to)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
            @click="sidebarOpen = false"
          >
            <component :is="link.icon" class="h-4 w-4 shrink-0" />
            {{ link.label }}
            <ChevronRight class="ml-auto h-3.5 w-3.5 opacity-40" />
          </NuxtLink>
        </nav>
        <div class="border-t border-border p-3 space-y-1">
          <button
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            @click="signOut"
          >
            <LogOut class="h-4 w-4 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>
    </div>

    <!-- Contenu principal -->
    <main class="flex-1 overflow-y-auto pt-14 lg:pt-0">
      <slot />
    </main>
  </div>
</template>

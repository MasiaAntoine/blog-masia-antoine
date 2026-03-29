<script setup lang="ts">
import { UserCircle, ArrowRight } from 'lucide-vue-next'
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-24 text-center">
    <!-- Icône -->
    <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
      <UserCircle class="h-10 w-10 text-muted-foreground" />
    </div>

    <!-- Titre -->
    <h2 class="mb-2 text-xl font-bold text-foreground">
      Complétez votre profil d'abord
    </h2>
    <p class="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
      Votre <strong class="text-foreground">nom</strong> et votre <strong class="text-foreground">fonction</strong> sont requis pour publier des articles.
      Ces informations s'affichent en signature sur chacun de vos articles.
    </p>

    <!-- CTA -->
    <NuxtLink
      to="/dashboard/profile"
      class="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
    >
      Configurer mon profil
      <ArrowRight class="h-4 w-4" />
    </NuxtLink>

    <!-- Checklist -->
    <div class="mt-10 flex flex-col gap-2 text-left">
      <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Requis</p>
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <span class="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-xs">1</span>
        Nom complet
      </div>
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <span class="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-xs">2</span>
        Fonction / Titre
      </div>
    </div>
  </div>
</template>

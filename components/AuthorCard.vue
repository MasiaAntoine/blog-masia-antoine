<script setup lang="ts">
interface Props {
  name: string
  role: string
  avatar: string
  profileUrl?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-5">
    <!-- Avatar -->
    <a
      v-if="profileUrl"
      :href="profileUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="shrink-0"
      :aria-label="`Profil GitHub de ${name}`"
    >
      <img
        :src="avatar"
        :alt="name"
        width="64"
        height="64"
        class="h-16 w-16 rounded-full object-cover ring-2 ring-border transition-opacity hover:opacity-80"
      />
    </a>
    <img
      v-else
      :src="avatar"
      :alt="name"
      width="64"
      height="64"
      class="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-border"
    />

    <!-- Info -->
    <div class="min-w-0">
      <p class="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Auteur
      </p>
      <a
        v-if="profileUrl"
        :href="profileUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-0.5 block text-base font-semibold text-foreground transition-colors hover:text-primary"
      >
        {{ name }}
      </a>
      <p v-else class="mt-0.5 text-base font-semibold text-foreground">
        {{ name }}
      </p>
      <p class="mt-0.5 text-sm text-muted-foreground">{{ role }}</p>
    </div>
  </div>
</template>

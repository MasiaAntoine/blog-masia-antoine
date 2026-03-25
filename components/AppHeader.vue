<script setup lang="ts">
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md backdrop-saturate-150"
  >
    <nav class="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
      <!-- Logo -->
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 text-lg font-semibold text-foreground transition-opacity hover:opacity-75"
      >
        <!-- Icône B moderne -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          class="h-8 w-8 shrink-0"
          aria-hidden="true"
        >
          <rect width="32" height="32" rx="8" fill="#3b82f6" />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            fill="white"
            d="M 6 4 H 18 Q 24 4 24 9.5 Q 24 14.5 19 15 Q 25 15.5 25 21 Q 25 28 18.5 28 H 6 Z
               M 10 7 H 17 Q 21 7 21 10 Q 21 13 17 13 H 10 Z
               M 10 17.5 H 18 Q 22 17.5 22 21 Q 22 25 18 25 H 10 Z"
          />
        </svg>
        <span>Le Blog <span class="text-primary">d'Antoine</span></span>
      </NuxtLink>
    </nav>
  </header>
</template>

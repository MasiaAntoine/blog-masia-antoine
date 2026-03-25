<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground antialiased">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

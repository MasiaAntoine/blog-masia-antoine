<script setup lang="ts">
interface TocLink {
  id: string
  text: string
  depth: number
  children?: TocLink[]
}

defineProps<{
  links: TocLink[]
}>()

const activeId = ref('')

onMounted(() => {
  const headings = Array.from(
    document.querySelectorAll('article h2, article h3')
  ) as HTMLElement[]
  if (!headings.length) return

  // Offset = hauteur du header sticky (~64px) + marge de confort
  const OFFSET = 96

  function updateActive() {
    const scrollY = window.scrollY

    // Le titre actif est le dernier dont le haut a dépassé l'offset
    let current = headings[0]?.id ?? ''
    for (const heading of headings) {
      if (heading.offsetTop - OFFSET <= scrollY) {
        current = heading.id
      } else {
        break
      }
    }
    activeId.value = current
  }

  updateActive()
  window.addEventListener('scroll', updateActive, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', updateActive))
})
</script>

<template>
  <nav v-if="links.length" class="max-h-[calc(100vh-8rem)] overflow-y-auto">
    <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      Sur cette page
    </p>
    <ul class="space-y-0.5 border-l border-border">
      <template v-for="link in links" :key="link.id">
        <li>
          <a
            :href="`#${link.id}`"
            :class="[
              'block -ml-px border-l-2 py-1 pl-4 text-sm transition-all duration-150',
              activeId === link.id
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
            ]"
          >
            {{ link.text }}
          </a>
        </li>
        <li v-for="child in link.children" :key="child.id">
          <a
            :href="`#${child.id}`"
            :class="[
              'block -ml-px border-l-2 py-1 pl-7 text-sm transition-all duration-150',
              activeId === child.id
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
            ]"
          >
            {{ child.text }}
          </a>
        </li>
      </template>
    </ul>
  </nav>
</template>

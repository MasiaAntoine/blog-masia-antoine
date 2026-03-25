<script setup lang="ts">
import { SlidersHorizontal, X, Check, Search } from 'lucide-vue-next'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
} from 'radix-vue'

const props = defineProps<{
  tags: string[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const tagSearch = ref('')

const filteredTags = computed(() => {
  if (!tagSearch.value.trim()) return props.tags
  const q = tagSearch.value.toLowerCase()
  return props.tags.filter((t) => t.toLowerCase().includes(q))
})

watch(open, (val) => {
  if (!val) tagSearch.value = ''
})

function select(tag: string) {
  emit('update:modelValue', props.modelValue === tag ? '' : tag)
  open.value = false
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40"
        :class="
          modelValue
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
        "
        aria-label="Filtrer par tag"
      >
        <SlidersHorizontal class="h-4 w-4 shrink-0" />
        <span>{{ modelValue || 'Filtrer' }}</span>
        <span
          v-if="modelValue"
          class="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
        >1</span>
      </button>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :side-offset="8"
        align="start"
        class="z-50 w-64 rounded-xl border border-border bg-background p-3 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <!-- Header -->
        <div class="mb-2 flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tags
          </p>
          <button
            v-if="modelValue"
            type="button"
            class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="clear"
          >
            <X class="h-3 w-3" />
            Effacer
          </button>
        </div>

        <!-- Recherche dans les tags -->
        <div class="relative mb-2">
          <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="tagSearch"
            type="text"
            placeholder="Chercher un tag…"
            class="w-full rounded-lg border border-border bg-muted/40 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <!-- Liste des tags -->
        <div class="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
          <button
            v-for="tag in filteredTags"
            :key="tag"
            type="button"
            class="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted"
            :class="modelValue === tag ? 'bg-primary/10 font-medium text-primary' : 'text-foreground'"
            @click="select(tag)"
          >
            <span>{{ tag }}</span>
            <Check v-if="modelValue === tag" class="h-3.5 w-3.5 shrink-0 text-primary" />
          </button>

          <p v-if="filteredTags.length === 0" class="px-2.5 py-3 text-xs text-muted-foreground">
            Aucun tag trouvé.
          </p>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

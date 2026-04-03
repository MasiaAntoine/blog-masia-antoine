<script setup lang="ts">
import { marked } from 'marked'
import { useDebounceFn } from '@vueuse/core'
import { Eye, Code2, Columns2 } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

type ViewMode = 'editor' | 'preview' | 'split'

// Split inutilisable sur mobile : on commence en mode éditeur
const viewMode = ref<ViewMode>('editor')

const previewHtml = ref('')

const renderPreview = useDebounceFn(async (value: string) => {
  previewHtml.value = await marked(value)
}, 200)

watch(
  () => props.modelValue,
  (val) => renderPreview(val),
  { immediate: true }
)

function handleInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emptyPlaceholder = '<p class="text-muted-foreground text-sm">L\'aperçu apparaîtra ici…</p>'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const views: { id: ViewMode; icon: any; label: string; mobileHidden?: boolean }[] = [
  { id: 'editor', icon: Code2, label: 'Éditeur' },
  { id: 'split', icon: Columns2, label: 'Split', mobileHidden: true },
  { id: 'preview', icon: Eye, label: 'Aperçu' },
]
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-xl border border-border bg-background">
    <!-- Barre d'outils -->
    <div class="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
      <span class="text-xs font-medium text-muted-foreground">Markdown</span>
      <div class="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
        <button
          v-for="v in views"
          :key="v.id"
          type="button"
          :title="v.label"
          :class="[
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors touch-manipulation',
            v.mobileHidden ? 'hidden sm:flex' : 'flex',
            viewMode === v.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="viewMode = v.id"
        >
          <component :is="v.icon" class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">{{ v.label }}</span>
        </button>
      </div>
    </div>

    <!-- Zone editor / split / preview -->
    <div class="flex flex-1 overflow-hidden" style="min-height: clamp(320px, 50dvh, 480px)">
      <!-- Textarea -->
      <div
        :class="[
          'flex flex-col',
          viewMode === 'split' ? 'w-1/2 border-r border-border' : 'w-full',
          viewMode === 'preview' ? 'hidden' : '',
        ]"
      >
        <textarea
          :value="modelValue"
          placeholder="Rédigez votre article en Markdown…"
          class="flex-1 resize-none bg-background p-4 font-mono text-sm text-foreground focus:outline-none"
          spellcheck="false"
          @input="handleInput"
        />
      </div>

      <!-- Preview HTML -->
      <div
        :class="[
          'overflow-y-auto',
          viewMode === 'split' ? 'w-1/2' : 'w-full',
          viewMode === 'editor' ? 'hidden' : '',
        ]"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="prose prose-gray max-w-none p-4
                 prose-headings:scroll-mt-4
                 prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                 prose-code:before:content-none prose-code:after:content-none"
          v-html="previewHtml || emptyPlaceholder"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bookmark, ChevronDown, Package, Trash2, Loader2 } from 'lucide-vue-next'

export interface ProductPreset {
  id: string
  title: string
  description: string
  url: string
  image: string
  cta: string
  created_at: string
}

const emit = defineEmits<{
  apply: [preset: Omit<ProductPreset, 'id' | 'created_at'>]
}>()

const presets = ref<ProductPreset[]>([])
const loading = ref(true)
const open = ref(false)
const deletingId = ref<string | null>(null)

async function fetchPresets() {
  loading.value = true
  try {
    presets.value = await $fetch<ProductPreset[]>('/api/product-presets')
  }
  catch { /* silent */ }
  finally { loading.value = false }
}

onMounted(fetchPresets)

// Exposé pour que le parent puisse rafraîchir après une sauvegarde
defineExpose({ refresh: fetchPresets })

async function deletePreset(id: string) {
  deletingId.value = id
  try {
    await $fetch(`/api/product-presets/${id}`, { method: 'DELETE' })
    presets.value = presets.value.filter(p => p.id !== id)
  }
  catch { /* silent */ }
  finally { deletingId.value = null }
}

function applyPreset(preset: ProductPreset) {
  emit('apply', {
    title: preset.title,
    description: preset.description,
    url: preset.url,
    image: preset.image,
    cta: preset.cta,
  })
  open.value = false
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-border">
    <!-- Toggle -->
    <button
      type="button"
      class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30"
      @click="open = !open"
    >
      <div class="flex items-center gap-2">
        <Bookmark class="h-4 w-4 text-primary" />
        <span class="text-sm font-semibold text-foreground">Suggestions enregistrées</span>
        <span
          v-if="!loading"
          class="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground"
        >
          {{ presets.length }}
        </span>
        <div v-else class="h-4 w-6 animate-pulse rounded-full bg-muted/60" />
      </div>
      <ChevronDown
        :class="['h-4 w-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180']"
      />
    </button>

    <!-- Panel -->
    <div v-if="open" class="border-t border-border">
      <!-- Explication -->
      <div class="border-b border-border bg-muted/30 px-4 py-3">
        <p class="text-xs leading-relaxed text-muted-foreground">
          <span class="font-semibold text-foreground">À quoi ça sert ?</span>
          Enregistrez un produit une fois, réutilisez-le en un clic sur n'importe quel article.
          Idéal pour vos livres, formations ou produits récurrents — vous n'aurez plus jamais à tout retaper.
        </p>
      </div>

      <div class="p-4">
        <!-- Skeleton -->
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 2" :key="i" class="h-20 animate-pulse rounded-lg bg-muted/40" />
        </div>

        <!-- Liste vide -->
        <div v-else-if="!presets.length" class="py-8 text-center">
          <Package class="mx-auto mb-2 h-8 w-8 text-muted-foreground/25" />
          <p class="text-sm text-muted-foreground">Aucune suggestion enregistrée.</p>
          <p class="mt-1 text-xs text-muted-foreground">
            Remplissez le formulaire ci-dessous puis cliquez sur « Enregistrer dans mes suggestions ».
          </p>
        </div>

        <!-- Grille des presets -->
        <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div
            v-for="preset in presets"
            :key="preset.id"
            class="group overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-primary/30"
          >
            <!-- Infos produit -->
            <div class="flex items-start gap-3 p-3">
              <img
                v-if="preset.image"
                :src="preset.image"
                :alt="preset.title"
                class="h-12 w-9 shrink-0 rounded object-cover"
                loading="lazy"
              />
              <div v-else class="flex h-12 w-9 shrink-0 items-center justify-center rounded bg-muted">
                <Package class="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-foreground">{{ preset.title }}</p>
                <p class="truncate text-xs text-muted-foreground">{{ preset.cta }}</p>
                <p class="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/50">{{ preset.url }}</p>
              </div>
              <!-- Supprimer -->
              <button
                type="button"
                :disabled="deletingId === preset.id"
                class="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-40"
                title="Supprimer cette suggestion"
                @click.stop="deletePreset(preset.id)"
              >
                <Loader2 v-if="deletingId === preset.id" class="h-3.5 w-3.5 animate-spin" />
                <Trash2 v-else class="h-3.5 w-3.5" />
              </button>
            </div>

            <!-- Bouton Utiliser -->
            <div class="border-t border-border px-3 pb-3 pt-2">
              <button
                type="button"
                class="w-full rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                @click="applyPreset(preset)"
              >
                Utiliser ce produit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

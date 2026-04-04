<script setup lang="ts">
import { SlidersHorizontal, X, Check, Search, Tag, Users, ChevronDown } from 'lucide-vue-next'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
} from 'radix-vue'

interface Profile { id: string; name: string; role: string; avatar_url: string | null }

const props = defineProps<{
  tags: string[]
  activeTags?: string[]       // tags actifs (multi)
  profiles?: Profile[]
  selectedAuthors?: string[]  // auteurs actifs (multi)
}>()

const emit = defineEmits<{
  'update:activeTags': [value: string[]]
  'update:selectedAuthors': [value: string[]]
}>()

const open = ref(false)
const tagSearch = ref('')

// Sections accordéon
const openSection = ref<'tags' | 'authors' | null>(null)

function toggleSection(s: 'tags' | 'authors') {
  openSection.value = openSection.value === s ? null : s
}

watch(open, (val) => {
  if (!val) { tagSearch.value = ''; openSection.value = null }
})

const filteredTags = computed(() => {
  if (!tagSearch.value.trim()) return props.tags
  const q = tagSearch.value.toLowerCase()
  return props.tags.filter((t) => t.toLowerCase().includes(q))
})

function selectTag(tag: string) {
  const current = props.activeTags ?? []
  const next = current.includes(tag)
    ? current.filter(t => t !== tag)
    : [...current, tag]
  emit('update:activeTags', next)
}

function toggleAuthor(id: string) {
  const current = props.selectedAuthors ?? []
  const next = current.includes(id)
    ? current.filter(a => a !== id)
    : [...current, id]
  emit('update:selectedAuthors', next)
}

function clearAll() {
  emit('update:activeTags', [])
  emit('update:selectedAuthors', [])
}

const activeCount = computed(() =>
  (props.activeTags?.length ?? 0) + (props.selectedAuthors?.length ?? 0),
)

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40"
        :class="
          activeCount > 0
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
        "
        aria-label="Filtres"
      >
        <SlidersHorizontal class="h-4 w-4 shrink-0" />
        <span>Filtrer</span>
        <span
          v-if="activeCount > 0"
          class="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
        >{{ activeCount }}</span>
      </button>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :side-offset="8"
        align="start"
        class="z-50 w-72 rounded-xl border border-border bg-background shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filtres</p>
          <button
            v-if="activeCount > 0"
            type="button"
            class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="clearAll"
          >
            <X class="h-3 w-3" />
            Tout effacer
          </button>
        </div>

        <!-- Section Tags -->
        <div class="border-b border-border">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
            :class="openSection === 'tags' ? 'text-foreground' : 'text-muted-foreground'"
            @click="toggleSection('tags')"
          >
            <Tag class="h-4 w-4 shrink-0" />
            <span class="flex-1 text-left">Tags</span>
            <span
              v-if="(activeTags?.length ?? 0) > 0"
              class="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
            >{{ activeTags?.length }}</span>
            <ChevronDown
              class="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
              :class="openSection === 'tags' ? 'rotate-180' : ''"
            />
          </button>

          <div v-if="openSection === 'tags'" class="px-3 pb-3">
            <!-- Recherche tags -->
            <div class="relative mb-2">
              <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                v-model="tagSearch"
                type="text"
                placeholder="Chercher un tag…"
                class="w-full rounded-lg border border-border bg-muted/40 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <!-- Liste tags -->
            <div class="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
              <button
                v-for="tag in filteredTags"
                :key="tag"
                type="button"
                class="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                :class="activeTags?.includes(tag) ? 'bg-primary/10 font-medium text-primary' : 'text-foreground'"
                @click="selectTag(tag)"
              >
                <span>{{ tag }}</span>
                <Check v-if="activeTags?.includes(tag)" class="h-3.5 w-3.5 shrink-0 text-primary" />
              </button>
              <p v-if="filteredTags.length === 0" class="px-2.5 py-3 text-xs text-muted-foreground">
                Aucun tag trouvé.
              </p>
            </div>
          </div>
        </div>

        <!-- Section Auteurs -->
        <div v-if="profiles?.length">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
            :class="openSection === 'authors' ? 'text-foreground' : 'text-muted-foreground'"
            @click="toggleSection('authors')"
          >
            <Users class="h-4 w-4 shrink-0" />
            <span class="flex-1 text-left">Auteurs</span>
            <span
              v-if="(selectedAuthors?.length ?? 0) > 0"
              class="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
            >{{ selectedAuthors?.length }}</span>
            <ChevronDown
              class="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
              :class="openSection === 'authors' ? 'rotate-180' : ''"
            />
          </button>

          <div v-if="openSection === 'authors'" class="px-3 pb-3">
            <div class="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
              <button
                v-for="profile in profiles"
                :key="profile.id"
                type="button"
                class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
                :class="selectedAuthors?.includes(profile.id) ? 'bg-primary/10' : ''"
                @click="toggleAuthor(profile.id)"
              >
                <!-- Avatar -->
                <div class="shrink-0">
                  <img
                    v-if="profile.avatar_url"
                    :src="profile.avatar_url"
                    :alt="profile.name"
                    class="h-6 w-6 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary"
                  >
                    {{ initials(profile.name) }}
                  </div>
                </div>
                <!-- Nom -->
                <span
                  class="flex-1 truncate text-sm"
                  :class="selectedAuthors?.includes(profile.id) ? 'font-medium text-primary' : 'text-foreground'"
                >{{ profile.name }}</span>
                <!-- Check -->
                <Check
                  v-if="selectedAuthors?.includes(profile.id)"
                  class="h-3.5 w-3.5 shrink-0 text-primary"
                />
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

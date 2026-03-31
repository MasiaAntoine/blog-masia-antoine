<script setup lang="ts">
import type { Component } from 'vue'

interface Row { name: string; sessions: number; views: number; code?: string | null }

const props = defineProps<{
  title: string
  rows: Row[]
  loading: boolean
  rowPct: (row: Row) => number
  icon: (row: Row) => Component | string
}>()

function formatNum(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

function resolveIcon(row: Row): Component | string {
  return props.icon(row)
}

function isString(v: Component | string): v is string {
  return typeof v === 'string'
}
</script>

<template>
  <div class="rounded-xl border border-border bg-background p-5">
    <!-- En-tête avec colonnes -->
    <div class="mb-3 flex items-center justify-between">
      <p class="text-sm font-semibold text-foreground">{{ title }}</p>
      <div class="flex items-center gap-4 text-xs font-medium text-muted-foreground">
        <span class="w-16 text-right">Visiteurs</span>
        <span class="w-16 text-right">Pages vues</span>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-8 animate-pulse rounded-lg bg-muted/30" />
    </div>

    <!-- Vide -->
    <div v-else-if="!rows.length" class="flex items-center justify-center py-8">
      <p class="text-sm text-muted-foreground">Aucune donnée disponible.</p>
    </div>

    <!-- Lignes -->
    <ul v-else class="space-y-2">
      <li v-for="row in rows" :key="row.name">
        <!-- Nom + stats chiffrées -->
        <div class="mb-1 flex items-center gap-2">
          <span class="flex h-5 w-5 shrink-0 items-center justify-center">
            <span v-if="isString(resolveIcon(row))" class="text-sm leading-none">{{ resolveIcon(row) }}</span>
            <component v-else :is="resolveIcon(row)" class="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <span class="flex-1 truncate text-sm font-medium text-foreground">{{ row.name }}</span>
          <span class="w-16 text-right text-xs font-semibold text-foreground tabular-nums">
            {{ formatNum(row.sessions) }}
          </span>
          <span class="w-16 text-right text-xs text-muted-foreground tabular-nums">
            {{ formatNum(row.views) }}
          </span>
        </div>

        <!-- Barre de progression + pourcentage -->
        <div class="flex items-center gap-2">
          <div class="flex-1 overflow-hidden rounded-full bg-muted/40" style="height: 5px;">
            <div
              class="h-full rounded-full bg-primary transition-all duration-500"
              :style="{ width: `${props.rowPct(row)}%` }"
            />
          </div>
          <span class="w-8 shrink-0 text-right text-xs text-muted-foreground">{{ props.rowPct(row) }}%</span>
        </div>
      </li>
    </ul>
  </div>
</template>

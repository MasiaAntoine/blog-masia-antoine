<script setup lang="ts">
import { BookOpen, Copy, Check } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '~/components/ui/dialog'

const open = ref(false)

// ── Copie du prompt JSON pour l'IA ────────────────────────────
const copied = ref(false)

const aiPrompt = `Génère un article de blog technique en Markdown au format suivant.
Retourne UNIQUEMENT le fichier Markdown, sans explication autour.

Format attendu :

---
title: "Titre accrocheur de l'article"
description: "Résumé en 1-2 phrases percutantes (120-160 caractères)."
date: "YYYY-MM-DD"
tags: ["Tag1", "Tag2", "Tag3"]
---

## Première section

Contenu en Markdown...

## Deuxième section

...

---

Règles de style impératives :
- Varier la longueur des phrases. Certaines très courtes. D'autres plus longues avec des précisions, des parenthèses, des nuances.
- Écrire à la 1ʳᵉ personne ou tutoyer le lecteur ("j'ai vu ce cas", "tu peux faire ça directement").
- Avoir des opinions franches : "franchement c'est la méthode la plus simple", "je ne suis pas fan de cette approche".
- Utiliser des apartés naturels avec tirets ou parenthèses.
- Raconter plutôt que lister — transformer les bullet points en prose narrative.
- Ancrer dans le concret et le vécu ("en pratique dans un projet réel", "ça m'arrive encore de...").
- PAS de titres encyclopédiques symétriques ("Définition", "Avantages", "Inconvénients").
- PAS de transitions formelles ("Il convient de noter que...", "Au fil des années...").
- PAS de conclusion moralisatrice.
- Commencer les sections par ## (h2) — le h1 est généré automatiquement.
- Préciser le langage sur tous les blocs de code (\`\`\`bash, \`\`\`ts, \`\`\`vue...).

Sujet de l'article : [DÉCRIS ICI LE SUJET]`

async function copyPrompt() {
  await navigator.clipboard.writeText(aiPrompt)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const frontmatterExample = `---
title: "Titre de l'article"           # OBLIGATOIRE
description: 'Résumé en une phrase.'  # OBLIGATOIRE
date: '2025-06-15'                     # OBLIGATOIRE (YYYY-MM-DD)
tags: ['Tag1', 'Tag2']                 # OBLIGATOIRE (≥ 1 tag)
product:                               # optionnel
  title: 'Nom du livre ou produit'
  description: "Accroche courte."
  url: 'https://www.amazon.fr/...'
  image: 'https://...'
  cta: 'Voir sur Amazon'
---

## Introduction

Votre contenu en **Markdown** standard...

## Section suivante

\`\`\`bash
docker run -d -p 8080:80 nginx
\`\`\``

const requiredFields = [
  { name: 'title', type: 'string', description: "Titre affiché en haut de l'article, dans les cards et l'onglet navigateur." },
  { name: 'description', type: 'string', description: 'Résumé court (1-2 phrases). Utilisé dans les cards, le SEO et les aperçus réseaux sociaux.' },
  { name: 'date', type: 'string', description: "Date de publication au format YYYY-MM-DD. Détermine l'ordre d'affichage." },
  { name: 'tags', type: 'string[]', description: "Liste de tags pour le filtre de l'accueil. Minimum 1 tag." },
]

const optionalFields = [
  { name: 'product.title', default: '—', description: 'Titre du livre ou du produit.' },
  { name: 'product.description', default: '—', description: "Accroche courte contextualisée à l'article (1-2 phrases)." },
  { name: 'product.url', default: '—', description: 'URL vers la page produit (Amazon, etc.).' },
  { name: 'product.image', default: '—', description: "URL de l'image de couverture du produit." },
  { name: 'product.cta', default: '"Voir sur Amazon"', description: "Texte du bouton d'appel à l'action." },
]

const tips = [
  '<strong class="text-foreground">description</strong> : viser entre 120 et 160 caractères pour un bon affichage SEO.',
  "<strong class='text-foreground'>tags</strong> : réutiliser des tags existants pour la cohérence du filtre de l'accueil.",
  "<strong class='text-foreground'>Titres</strong> : commencer le contenu par <code class='rounded bg-muted px-1 py-0.5'>## </code> (h2) — le h1 est généré automatiquement depuis <code class='rounded bg-muted px-1 py-0.5'>title</code>.",
  "<strong class='text-foreground'>Blocs de code</strong> : toujours préciser le langage après les triple backticks (<code class='rounded bg-muted px-1 py-0.5'>```bash</code>, <code class='rounded bg-muted px-1 py-0.5'>```ts</code>…) pour la coloration syntaxique.",
  "<strong class='text-foreground'>product.description</strong> : contextualiser le message selon le sujet de l'article.",
  'Le <strong class="text-foreground">temps de lecture</strong> est calculé automatiquement — inutile de l\'ajouter.',
]
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
    @click="open = true"
  >
    <BookOpen class="h-3.5 w-3.5" />
    Guide Markdown
  </button>

  <Dialog v-model:open="open">
    <DialogContent size="xl" class="flex max-h-[80dvh] flex-col overflow-hidden p-0">
      <!-- En-tête fixe -->
      <div class="flex items-center gap-3 border-b border-border px-6 py-5 pr-14">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen class="h-4 w-4 text-primary" />
        </div>
        <div>
          <DialogTitle>Structure d'un article Markdown</DialogTitle>
          <DialogDescription>Référence complète du format attendu pour vos articles</DialogDescription>
        </div>
      </div>

      <!-- Contenu scrollable -->
      <div class="flex-1 overflow-y-auto px-6 py-6 space-y-8">

        <!-- Template -->
        <section>
          <h3 class="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Template complet
          </h3>
          <pre class="overflow-x-auto rounded-xl border border-border bg-muted/40 px-5 py-4 font-mono text-xs leading-relaxed text-foreground"><code>{{ frontmatterExample }}</code></pre>
          <p class="mt-2 text-xs text-muted-foreground">
            Le bloc <code class="rounded bg-muted px-1 py-0.5">---</code> en début de fichier est le frontmatter. Tout ce qui suit est le corps de l'article.
            <strong class="text-foreground">Le champ <code class="rounded bg-muted px-1 py-0.5">author</code> est inutile</strong> — il est récupéré automatiquement depuis votre profil.
          </p>
        </section>

        <!-- Champs obligatoires -->
        <section>
          <h3 class="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Champs obligatoires
          </h3>
          <div class="overflow-hidden rounded-xl border border-border">
            <table class="w-full text-sm">
              <thead class="bg-muted/40">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Champ</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Type</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Description</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="field in requiredFields" :key="field.name" class="hover:bg-muted/20">
                  <td class="px-4 py-2.5">
                    <code class="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">{{ field.name }}</code>
                  </td>
                  <td class="px-4 py-2.5">
                    <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{{ field.type }}</span>
                  </td>
                  <td class="px-4 py-2.5 text-xs text-muted-foreground">{{ field.description }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Champs optionnels -->
        <section>
          <h3 class="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Placement produit (optionnel)
          </h3>
          <div class="overflow-hidden rounded-xl border border-border">
            <table class="w-full text-sm">
              <thead class="bg-muted/40">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Champ</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Défaut</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-foreground">Description</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="field in optionalFields" :key="field.name" class="hover:bg-muted/20">
                  <td class="px-4 py-2.5">
                    <code class="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">{{ field.name }}</code>
                  </td>
                  <td class="px-4 py-2.5 font-mono text-xs text-muted-foreground">{{ field.default }}</td>
                  <td class="px-4 py-2.5 text-xs text-muted-foreground">{{ field.description }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Bonnes pratiques -->
        <section>
          <h3 class="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Bonnes pratiques
          </h3>
          <ul class="space-y-2">
            <li v-for="(tip, i) in tips" :key="i" class="flex items-start gap-2.5 text-xs text-muted-foreground">
              <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">✓</span>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span v-html="tip" />
            </li>
          </ul>
        </section>

        <!-- Prompt IA -->
        <section>
          <h3 class="mb-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Prompt prêt pour une IA
          </h3>
          <p class="mb-3 text-xs text-muted-foreground">
            Copiez ce prompt, collez-le dans ChatGPT, Claude ou Gemini, remplacez <code class="rounded bg-muted px-1 py-0.5">[DÉCRIS ICI LE SUJET]</code> à la fin, et importez le résultat via le panneau d'import Markdown.
          </p>
          <div class="relative">
            <pre class="overflow-x-auto rounded-xl border border-border bg-muted/40 px-5 py-4 pr-16 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">{{ aiPrompt }}</pre>
            <button
              type="button"
              :class="[
                'absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-background border border-border text-muted-foreground hover:border-primary/40 hover:text-primary',
              ]"
              @click="copyPrompt"
            >
              <Check v-if="copied" class="h-3.5 w-3.5" />
              <Copy v-else class="h-3.5 w-3.5" />
              {{ copied ? 'Copié !' : 'Copier' }}
            </button>
          </div>
        </section>

        <!-- Style anti-IA -->
        <section class="pb-2">
          <h3 class="mb-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Style d'écriture — sonner humain
          </h3>
          <p class="mb-3 text-xs text-muted-foreground">Les détecteurs d'IA repèrent des patterns précis. Quelques règles pour les éviter :</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p class="mb-2 text-xs font-semibold text-green-600 dark:text-green-400">À faire</p>
              <ul class="space-y-1.5 text-xs text-muted-foreground">
                <li>Varier la longueur des phrases — certaines très courtes, d'autres plus longues</li>
                <li>Écrire à la 1ʳᵉ personne : "J'ai souvent vu ce cas en entreprise"</li>
                <li>Avoir des opinions : "franchement c'est la méthode la plus simple"</li>
                <li>Utiliser des apartés naturels entre tirets ou parenthèses</li>
                <li>Raconter plutôt que lister — prose narrative plutôt que bullet points</li>
                <li>Ancrer dans le concret et le vécu</li>
              </ul>
            </div>
            <div class="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p class="mb-2 text-xs font-semibold text-destructive">À éviter</p>
              <ul class="space-y-1.5 text-xs text-muted-foreground">
                <li>Titres encyclopédiques symétriques ("Définition", "Avantages"…)</li>
                <li>Listes de 5-6 points avec la même structure grammaticale</li>
                <li>Transitions formelles : "Il convient de noter que…"</li>
                <li>Paragraphes de longueur quasi identique</li>
                <li>Formules moralisatrices en conclusion</li>
                <li>Absence totale de subjectivité</li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </DialogContent>
  </Dialog>
</template>

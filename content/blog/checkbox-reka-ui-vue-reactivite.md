---
title: "Checkbox Reka UI dans une dialog : quand la réactivité Vue ne suit pas"
description: "Checkbox shadcn/vue (Reka UI) dans une dialog pré-remplie : quand la coche ne suit pas la donnée, et comment resynchroniser avec modelValue. Voir la doc Checkbox sur shadcn-vue.com."
date: '2026-03-27'
tags: ['Vue', 'Reka UI', 'shadcn-vue', 'Interface']
author:
  name: 'MASIA Antoine'
  role: 'Développeur Full-Stack, DevOps & CyberSécurité'
  avatar: 'https://avatars.githubusercontent.com/u/115811899'
---

## Le symptôme qui rend fou

Tu ouvres une dialog pour éditer un truc. Les données arrivent bien : ton objet a `has_serial_number: true`, ton compteur ou ton texte à côté affiche la bonne valeur. Sauf que la case à cocher, elle, reste vide. Ou l’inverse : tu fermes, tu rouvres, et visuellement c’est n’importe quoi alors que le ref derrière est correct.

Ça m’est arrivé avec les checkboxes **Reka UI** — c’est exactement ce que tu importes quand tu utilises le composant `Checkbox` de **shadcn/vue** (`@/components/ui/checkbox` après `pnpm dlx shadcn-vue@latest add checkbox`). Pour les bases — installation, exemples avec `default-value`, liaison au label — la doc officielle vaut le détour : [Checkbox — shadcn/vue](https://www.shadcn-vue.com/docs/components/checkbox).

Ce n’est pas que « Vue est cassé » : c’est un décalage entre le moment où la dialog s’ouvre, le moment où le composant monte, et ce que Reka expose comme API par rapport à un `<input type="checkbox">` classique.

## Pourquoi `checked` ne fait pas le job

Sur un input HTML natif, tu penses `checked`. Sur `CheckboxRoot` côté Reka, ce qui compte pour lier l’état, c’est **`modelValue`** (donc `v-model` ou `:model-value` + `@update:model-value`). Si tu branches `v-model:checked` ou `:checked` sur le wrapper `Checkbox` de ton UI kit en croyant que ça suffit, tu peux te retrouver avec une donnée réactive qui bouge mais une coche qui ne suit pas — le genre de bug où tu passes une heure à regarder le store alors que le problème est la prop.

## Dialog + valeurs pré-remplies : forcer une vraie remise à zéro

Quand la dialog s’ouvre avec un `item` déjà là, le composant checkbox a parfois déjà fait son cycle de vie avec une ancienne valeur. La solution qui tient la route chez moi : un flag du style `checkboxReady`, du `v-if` pour démonter la case le temps de fixer la valeur, et **plusieurs** `nextTick` pour laisser le DOM respirer avant de remonter le composant.

Voici le pattern complet :

```vue
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'

const props = defineProps<{
  open: boolean
  item?: { id?: string; has_serial_number: boolean } | null
}>()

const hasSerialNumber = ref(false)
const checkboxReady = ref(false)

watch(
  () => props.open,
  async (newOpen) => {
    if (newOpen) {
      checkboxReady.value = false
      await nextTick()
      await nextTick()

      if (props.item) {
        hasSerialNumber.value = !!props.item.has_serial_number
        await nextTick()
        checkboxReady.value = true
      } else {
        hasSerialNumber.value = false
        checkboxReady.value = true
      }
    } else {
      checkboxReady.value = false
    }
  },
)
</script>

<template>
  <Checkbox
    v-if="checkboxReady"
    :key="`checkbox-${props.item?.id || 'new'}-${hasSerialNumber}`"
    v-model="hasSerialNumber"
  />
  <div v-else class="size-4 shrink-0 rounded-[4px] border border-input bg-background" />
</template>
```

La petite boîte grise en placeholder évite un trou bizarre pendant que `checkboxReady` est à false. La **clé dynamique** qui mélange id + valeur aide Vite/Vue à ne pas recycler un composant dans un état fantôme.

## Objets avec clés pas toujours définies

Autre cas : tu stockes les sélections dans un `Record<string, boolean>` et certaines clés n’existent pas tant que l’utilisateur n’a pas interagi. Là, `v-model` direct sur une propriété potentiellement absente, c’est vite le bazar. Je préfère **`model-value`** explicite avec un booléen forcé (`!!selectedItems[item.id]`) et un handler sur `update:model-value` qui recrée l’objet proprement.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'

const selectedItems = ref<Record<string, boolean>>({})

const toggleItem = (itemId: string) => {
  selectedItems.value = {
    ...selectedItems.value,
    [itemId]: !selectedItems.value[itemId],
  }
}

const setItemSelected = (itemId: string, checked: boolean) => {
  selectedItems.value = { ...selectedItems.value, [itemId]: checked }
}
</script>

<template>
  <Checkbox
    :id="`item-${item.id}`"
    :model-value="!!selectedItems[item.id]"
    @update:model-value="(v) => setItemSelected(item.id, v === true)"
  />
</template>
```

Si c’est la ligne entière (ou un `CommandItem`) qui toggle la sélection, tu peux laisser le parent gérer le `toggleItem` et garder la checkbox en lecture seule visuelle avec `:model-value` — et **`pointer-events-none`** sur le `Checkbox` pour éviter le double clic (ligne + case qui se battent pour la même action). J’ai ce genre de montage dans un écran type ajout groupé de numéros ; le principe est toujours le même : une seule source de vérité pour l’état, la case ne fait qu’afficher.

## En résumé

Je garde `v-model` ou `:model-value` aligné sur **`modelValue`** Reka, jamais `checked` comme si c’était du HTML brut. Pour les dialogs avec données initiales, je démonte/remonte avec `checkboxReady` + `key` + `nextTick`. Pour les maps partielles, je passe par `model-value` + update explicite. Ce n’est pas élégant sur le papier, mais en prod ça évite les heures perdues sur une coche qui ment.

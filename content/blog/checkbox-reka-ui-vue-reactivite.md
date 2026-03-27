---
title: "Checkbox shadcn/vue (Reka UI) : synchronisation réactive et dialogs"
description: "Guide technique : liaison d’état sur CheckboxRoot (modelValue), désynchronisation dans une dialog pré-remplie, patterns de réinitialisation et cas Record / ligne cliquable. Référence doc shadcn-vue Checkbox."
date: '2026-03-27'
tags: ['Vue', 'Reka UI', 'shadcn-vue', 'Interface']
author:
  name: 'MASIA Antoine'
  role: 'Développeur Full-Stack, DevOps & CyberSécurité'
  avatar: 'https://avatars.githubusercontent.com/u/115811899'
---

## Contexte

Le composant `Checkbox` de [shadcn/vue](https://www.shadcn-vue.com/docs/components/checkbox) s’appuie sur **Reka UI** (`CheckboxRoot`). Il s’installe via le CLI (`pnpm dlx shadcn-vue@latest add checkbox`) et s’importe généralement depuis `@/components/ui/checkbox`. La documentation officielle couvre l’installation, les exemples avec `default-value` et la liaison aux labels : [Checkbox — shadcn/vue](https://www.shadcn-vue.com/docs/components/checkbox).

## Problème fréquent

Dans une **dialog** ouverte avec des **données pré-remplies**, la valeur réactive peut être correcte (ex. `has_serial_number: true`) alors que l’**état visuel** de la case ne correspond pas. Inversement, après fermeture et réouverture, l’affichage peut être incohérent malgré un ref à jour.

La cause n’est pas un dysfonctionnement général de Vue : il s’agit d’un **décalage de cycle de vie** entre l’ouverture de la modale, le montage du composant checkbox et l’API exposée par Reka, distincte d’un `<input type="checkbox">` natif.

## API : `modelValue` et non `checked`

| Contexte | Liaison d’état attendue |
| -------- | ------------------------ |
| `<input type="checkbox">` HTML | Attribut / prop `checked` |
| `CheckboxRoot` (Reka) / wrapper shadcn `Checkbox` | **`modelValue`** → `v-model` ou `:model-value` + `@update:model-value` |

**À éviter** sur le wrapper shadcn : `v-model:checked`, `:checked` comme seule liaison si le composant ne les mappe pas vers `modelValue`. Symptôme typique : la donnée réactive change, le compteur ou le texte affiché est correct, la coche ne suit pas.

## Dialog avec valeurs initiales : remontage contrôlé

Lorsque la dialog s’ouvre alors qu’un `item` est déjà disponible, le checkbox peut avoir été monté avec une valeur obsolète. Pattern recommandé :

1. Drapeau **`checkboxReady`** : masquer le `Checkbox` (`v-if="checkboxReady"`) pendant la mise à jour de l’état.
2. **`nextTick`** : un ou plusieurs appels pour laisser le DOM se stabiliser avant de réafficher le composant.
3. **Clé dynamique** (`:key`) incluant l’identifiant de l’item et la valeur booléenne pour limiter le recyclage de composant dans un état incohérent.
4. **Placeholder** (optionnel) : bloc neutre à la place du checkbox lorsque `checkboxReady` est `false`, pour éviter un trou de mise en page.

### Exemple complet

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

## Sélections dans un `Record<string, boolean>`

Lorsque les clés ne sont pas toutes initialisées avant interaction utilisateur, un `v-model` direct sur une propriété potentiellement absente complique la synchronisation.

**Approche** : exposer un booléen dérivé avec `:model-value="!!selectedItems[item.id]"` et centraliser les mises à jour dans `@update:model-value` en recréant l’objet (spread) pour conserver la réactivité.

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

`toggleItem` reste utilisable depuis un parent (ligne entière, etc.) : la case reflète l’état grâce à `:model-value`.

## Liste / ligne cliquable / `CommandItem`

Si le parent bascule déjà la sélection (ex. `@select` sur un `CommandItem`), deux clics ne doivent pas s’additionner (ligne + checkbox).

- Conserver **une seule source de vérité** côté parent.
- Afficher l’état avec `:model-value`.
- Appliquer **`pointer-events-none`** sur le `Checkbox` si le clic sur la ligne suffit, afin d’éviter un double basculement.

## Récapitulatif

| Sujet | Recommandation |
| ----- | --------------- |
| Liaison Reka / shadcn | `v-model` ou `:model-value` + `@update:model-value` (**`modelValue`**) |
| À ne pas utiliser comme équivalent HTML | `v-model:checked` / `:checked` non mappés vers `modelValue` |
| Dialog + données initiales | `checkboxReady`, `v-if`, `nextTick`, `:key` dynamique |
| Objet partiellement rempli | `:model-value` + mise à jour immuable du `Record` |
| Ligne + checkbox | `pointer-events-none` sur la case si le parent gère le clic |

Pour les usages de base et les variantes documentées par le projet, se reporter à [Checkbox — shadcn/vue](https://www.shadcn-vue.com/docs/components/checkbox).

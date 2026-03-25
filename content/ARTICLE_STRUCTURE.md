# Structure d'un article — Le Blog d'Antoine

Ce document décrit la structure attendue pour chaque fichier `.md` dans `content/blog/`.

---

## Frontmatter

Le frontmatter est le bloc entre les `---` en début de fichier. Il contient les métadonnées de l'article.

```yaml
---
title: "Titre de l'article" # OBLIGATOIRE
description: 'Résumé en une phrase.' # OBLIGATOIRE
date: '2025-06-15' # OBLIGATOIRE  (format YYYY-MM-DD)
tags: ['Tag1', 'Tag2'] # OBLIGATOIRE  (au moins 1 tag)
author: # OBLIGATOIRE
  name: 'MASIA Antoine'
  role: 'Développeur Full-Stack, DevOps & CyberSécurité'
  avatar: 'https://avatars.githubusercontent.com/u/115811899'
cover: 'https://...' # optionnel    (URL de l'image de couverture)
product: # optionnel    (placement produit affiché après le contenu)
  title: 'Nom du livre ou produit'
  description: "Courte accroche contextualisée à l'article."
  url: 'https://www.amazon.fr/...'
  image: 'https://...'
  cta: 'Voir sur Amazon' # optionnel, défaut : "Voir sur Amazon"
---
```

### Champs obligatoires

| Champ           | Type       | Description                                                                                |
| --------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `title`         | `string`   | Titre affiché en haut de l'article, dans les cards et l'onglet navigateur.                 |
| `description`   | `string`   | Résumé court (1-2 phrases). Utilisé dans les cards, le SEO et les aperçus réseaux sociaux. |
| `date`          | `string`   | Date de publication au format `YYYY-MM-DD`. Détermine l'ordre d'affichage.                 |
| `tags`          | `string[]` | Liste de tags pour le filtre de l'accueil. Minimum 1 tag.                                  |
| `author`        | `object`   | Bloc auteur affiché en bas de l'article.                                                   |
| `author.name`   | `string`   | Nom complet de l'auteur.                                                                   |
| `author.role`   | `string`   | Titre / poste de l'auteur.                                                                 |
| `author.avatar` | `string`   | URL de la photo de profil.                                                                 |

### Champs optionnels

| Champ                 | Type     | Défaut si absent    | Description                                                                                                                                                              |
| --------------------- | -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cover`               | `string` | Fond dégradé        | URL de l'image de couverture (16:9, min 1200×630 px recommandé). Affichée dans les cards et en haut de l'article. Utilisée aussi en `og:image` pour les réseaux sociaux. |
| `product`             | `object` | Non affiché         | Placement produit affiché entre le contenu et la section auteur.                                                                                                         |
| `product.title`       | `string` | —                   | Titre du livre ou du produit.                                                                                                                                            |
| `product.description` | `string` | —                   | Accroche courte contextualisée à l'article (1-2 phrases).                                                                                                                |
| `product.url`         | `string` | —                   | URL vers la page produit (Amazon, etc.).                                                                                                                                 |
| `product.image`       | `string` | —                   | URL de l'image de couverture du produit.                                                                                                                                 |
| `product.cta`         | `string` | `"Voir sur Amazon"` | Texte du bouton d'appel à l'action.                                                                                                                                      |

> **Note :** Le temps de lecture est calculé automatiquement à partir du contenu — inutile de l'ajouter dans le frontmatter.

---

## Nom du fichier

Le nom du fichier devient le **slug** de l'URL de l'article.

```
content/blog/mon-article.md  →  /blog/mon-article
```

Règles :

- Tout en minuscules
- Mots séparés par des tirets (`-`)
- Pas d'accents, pas d'espaces, pas de caractères spéciaux

---

## Exemple complet

````markdown
---
title: 'Introduction à Docker pour les développeurs web'
description: "Conteneurs, images, volumes et Compose — tout ce qu'il faut savoir pour dockeriser une application web en partant de zéro."
date: '2025-08-10'
tags: ['Docker', 'DevOps', 'Linux']
author:
  name: 'MASIA Antoine'
  role: 'Développeur Full-Stack, DevOps & CyberSécurité'
  avatar: 'https://avatars.githubusercontent.com/u/115811899'
cover: 'https://exemple.com/image-docker.jpg'
product:
  title: 'La CyberSécurité en 10 Chapitres — Connaître les risques qui nous entourent et êtres mieux préparés pour les affronter'
  description: 'Sécurisez vos conteneurs et infrastructures grâce à ce guide complet sur la cybersécurité moderne.'
  url: 'https://www.amazon.fr/CyberS%C3%A9curit%C3%A9-Chapitres-Conna%C3%AEtre-entourent-affronter/dp/1446122921'
  image: 'https://m.media-amazon.com/images/I/71OpM9TBIlL.jpg'
  cta: 'Voir sur Amazon'
---

## Introduction

Texte de l'article en **Markdown** standard...

## Exemple de code

```bash
docker run -d -p 8080:80 nginx
```
````

## Conclusion

Résumé et points clés.

````

---

## Bonnes pratiques

- **`description`** : entre 120 et 160 caractères pour un bon affichage SEO.
- **`tags`** : réutiliser des tags existants quand c'est possible (cohérence du filtre de l'accueil).
- **`cover`** : privilégier une image au ratio **16:9**, minimum 1200×630 px.
- **`product.description`** : contextualiser le message selon le sujet de l'article pour plus de pertinence.
- **Titres** : commencer le contenu par `## ` (h2) — le `h1` est généré automatiquement depuis `title`.
- **Blocs de code** : toujours préciser le langage après les triple backticks (` ```bash `, ` ```ts `, ` ```vue `, etc.) pour la coloration syntaxique.

---

## Style d'écriture — passer sous les détecteurs d'IA

Les détecteurs d'IA repèrent des patterns très précis : régularité des phrases, listes parfaitement parallèles, transitions formelles, absence totale de subjectivité. Voici les règles à suivre pour écrire un article qui sonne 100% humain.

### Ce qu'il faut faire

**Varier la longueur des phrases.** Certaines très courtes. D'autres qui s'étirent un peu, qui ajoutent une précision, une parenthèse, une nuance — comme on le ferait à l'oral en fait.

**Écrire à la première personne ou tutoyer le lecteur.** "J'ai souvent vu ce cas en entreprise", "tu peux faire ça directement depuis...", "on va en parler une autre fois". Le "nous" et le "vous" de politesse sentent le manuel d'utilisation.

**Avoir des opinions.** Pas seulement décrire — juger, recommander, s'étonner. "Ce qui est frappant c'est que...", "franchement c'est la méthode la plus simple", "je ne suis pas fan de cette approche".

**Utiliser des apartés naturels.** Les parenthèses, les tirets, les incises qui ressemblent à une pensée en cours : "(ce qui est une mauvaise habitude, mais on va en parler une autre fois)", "— du moins en théorie —", "sauf que...".

**Raconter plutôt que lister.** Transformer les bullet points en prose narrative quand c'est possible. Les listes à puces parfaitement parallèles sont un signal fort pour les détecteurs.

**Introduire des imperfections de rythme.** Une répétition volontaire de mot, une phrase qui commence par "Et" ou "Mais", une construction un peu relâchée — c'est ce que font les humains naturellement.

**Ancrer dans le concret et le vécu.** "J'ai vu un incident similaire", "en pratique dans un projet réel", "ça m'arrive encore de me faire avoir par...". Le général et l'abstrait sonnent IA.

### Ce qu'il faut éviter

- Les titres de section symétriques et encyclopédiques ("Définition", "Avantages", "Inconvénients", "Conclusion")
- Les listes de 5-6 points avec exactement la même structure grammaticale pour chaque item
- Les transitions formelles : "Au fil des années...", "Il convient de noter que...", "Il est donc crucial de..."
- Les paragraphes de longueur quasi identique d'un bout à l'autre de l'article
- Les formules de conclusion moralisatrices : "Il est essentiel de rester vigilant", "La sensibilisation est la clé"
- L'absence totale de subjectivité — un texte où personne n'a d'avis sur rien

### Exemple : avant / après

**Version IA :**
> Les attaques de phishing sont généralement réalisées par le biais de courriers électroniques frauduleux, de SMS contenant des liens malveillants et de sites web falsifiés. Une fois que les attaquants ont obtenu ces informations, ils peuvent les utiliser à des fins frauduleuses.

**Version humaine :**
> Le principe est simple. Un attaquant se fait passer pour quelqu'un de confiance — ta banque, Netflix, ton patron — et il t'envoie un message qui te pousse à agir vite, sans réfléchir. Cliquer sur un lien, renseigner ton mot de passe, télécharger une pièce jointe. C'est tout. Le mal est fait.
````

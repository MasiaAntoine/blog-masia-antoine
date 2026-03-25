/**
 * Extrait le texte brut depuis un nœud de l'AST Nuxt Content.
 */
function extractText(node: any): string {
  if (!node) return ''
  if (node.type === 'text') return node.value ?? ''
  if (Array.isArray(node.children)) {
    return node.children.map(extractText).join(' ')
  }
  return ''
}

/**
 * Calcule le temps de lecture estimé.
 * Accepte soit un texte brut, soit le body AST de Nuxt Content.
 * Vitesse moyenne : 200 mots/minute.
 */
export function useReadingTime(bodyOrText: any): string {
  const text =
    typeof bodyOrText === 'string' ? bodyOrText : extractText(bodyOrText)

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(wordCount / 200))
  return `${minutes} min de lecture`
}

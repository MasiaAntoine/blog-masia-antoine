/**
 * Entoure les occurrences de `query` dans `text` avec une balise <mark>.
 * Le texte source est échappé pour éviter toute injection HTML.
 */
export function highlight(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text)
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return escapeHtml(text).replace(
    regex,
    '<mark class="rounded bg-primary/25 text-foreground not-italic px-0.5">$1</mark>',
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

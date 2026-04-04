/**
 * Normalise un tag : minuscules, sans accents, sans caractères spéciaux.
 * Ex: "Développement Web" → "developpement-web"
 */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // supprime les diacritiques (accents)
    .replace(/[^a-z0-9]+/g, '-')      // remplace tout sauf lettres/chiffres par -
    .replace(/-+/g, '-')              // fusionne les tirets consécutifs
    .replace(/^-|-$/g, '')            // retire les tirets en début/fin
}

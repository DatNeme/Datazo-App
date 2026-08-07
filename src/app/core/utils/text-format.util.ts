/**
 * Convierte la primera letra de cada palabra a mayúscula (Title Case).
 * Ej: "entertainment: video games" → "Entertainment: Video Games"
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/(?:^|[\s:\-\/])(\p{L})/gu, (match, letter) => match.replace(letter, letter.toUpperCase()));
}

/**
 * Convierte a Sentence Case: primera letra mayúscula, resto en minúscula.
 * Ej: "ANCIENT EGYPT" → "Ancient egypt"
 *     "true" → "True"
 */
export function toSentenceCase(text: string): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

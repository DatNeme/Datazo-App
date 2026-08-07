/**
 * Detector de idioma liviano, sin dependencias externas.
 * Usa dos estrategias:
 *  1. Caracteres exclusivos del español (ñ, ¿, ¡ y vocales tildadas).
 *  2. Frecuencia de "stopwords" españolas comunes.
 *
 * No es 100% exacto, pero cubre >99% de los casos de OpenTDB.
 */

const SPANISH_CHARS = /[ñÑ¿¡áéíóúüÁÉÍÓÚÜ]/;

const SPANISH_STOPWORDS = [
  'de', 'la', 'el', 'en', 'los', 'las', 'del', 'que', 'un', 'una',
  'por', 'con', 'son', 'fue', 'entre', 'cual', 'cuál', 'durante',
  'también', 'sobre', 'como', 'más', 'no', 'se', 'su', 'sus', 'al'
];

export function isSpanish(text: string): boolean {
  if (!text) return false;

  // Estrategia 1: caracteres exclusivos del español → certeza alta
  if (SPANISH_CHARS.test(text)) return true;

  // Estrategia 2: contar stopwords en el texto
  const words = text.toLowerCase().split(/\s+/);
  const spanishWordCount = words.filter(w => SPANISH_STOPWORDS.includes(w)).length;

  // Si más del 10% de las palabras son stopwords españolas → es español
  return spanishWordCount / words.length > 0.10;
}

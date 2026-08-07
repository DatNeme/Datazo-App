/**
 * Hash djb2 — función simple, sin dependencias externas.
 * Genera un ID de 8 caracteres alfanuméricos a partir de un string.
 * La misma pregunta siempre genera el mismo hash → sirve como ID único en Firestore.
 */
export function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Mantener como entero de 32 bits
  }
  // Convertir a string alfanumérico positivo de longitud fija
  return Math.abs(hash).toString(36).padStart(7, '0').substring(0, 10);
}

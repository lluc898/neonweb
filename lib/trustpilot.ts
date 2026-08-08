/**
 * Valoración pública de Trustpilot.
 *
 * Trustpilot bloquea el scraping (403), así que estos datos se actualizan a
 * mano. NO inventar cifras: copiarlas de la ficha real antes de tocar nada.
 *
 * Fuente: https://es.trustpilot.com/review/neonledspain.com
 * Última revisión: 2026-08-08 (cifras confirmadas por el propietario).
 */
export const TRUSTPILOT = {
  url: "https://es.trustpilot.com/review/neonledspain.com",
  /** TrustScore sobre 5. */
  score: 4.5,
  /** Número de opiniones publicadas. */
  reviews: 16,
  /** Etiqueta de Trustpilot para el tramo del TrustScore (4,3–5,0 = Excelente). */
  label: "Excelente",
} as const;

/** Formatea el TrustScore con coma decimal (convención española). */
export function formatTrustScore(score: number = TRUSTPILOT.score) {
  return score.toLocaleString("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

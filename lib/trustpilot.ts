/**
 * Valoración pública de Trustpilot.
 *
 * Trustpilot devuelve 403 a las peticiones automáticas, así que la nota NO se
 * puede sincronizar: se edita a mano desde /admin/trustpilot y se guarda en
 * `SiteSetting` (clave `trustpilot`). Lo de aquí abajo es solo el valor por
 * defecto para cuando la BD no tiene todavía la clave o está caída.
 *
 * Fuente: https://es.trustpilot.com/review/neonledspain.com
 * Última revisión: 2026-08-08 (cifras confirmadas por el propietario).
 */

export const TRUSTPILOT_SETTING_KEY = "trustpilot";

export type TrustpilotData = {
  /** TrustScore sobre 5. */
  score: number;
  /** Número de opiniones publicadas. */
  reviews: number;
  url: string;
  /** false = no se muestra la insignia en ningún sitio de la tienda. */
  visible: boolean;
};

export const TRUSTPILOT_DEFAULT: TrustpilotData = {
  score: 4.5,
  reviews: 16,
  url: "https://es.trustpilot.com/review/neonledspain.com",
  visible: true,
};

/**
 * Etiqueta de Trustpilot para el tramo del TrustScore. Se calcula, no se
 * escribe a mano: así nunca puede quedar en desacuerdo con la puntuación.
 */
export function trustpilotLabel(score: number): string {
  if (score >= 4.3) return "Excelente";
  if (score >= 3.8) return "Genial";
  if (score >= 3.0) return "Normal";
  if (score >= 2.0) return "Malo";
  return "Pésimo";
}

/** Formatea el TrustScore con coma decimal (convención española). */
export function formatTrustScore(score: number) {
  return score.toLocaleString("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/**
 * Sanea lo que venga de la BD (JSON libre) o de un formulario. Cualquier campo
 * ausente o inválido cae al valor por defecto, nunca revienta el render.
 */
export function parseTrustpilot(value: unknown): TrustpilotData {
  const raw = (value ?? {}) as Partial<Record<keyof TrustpilotData, unknown>>;

  const score = Number(raw.score);
  const reviews = Number(raw.reviews);
  const url = typeof raw.url === "string" ? raw.url.trim() : "";

  return {
    score:
      Number.isFinite(score) && score >= 0 && score <= 5
        ? Math.round(score * 10) / 10
        : TRUSTPILOT_DEFAULT.score,
    reviews:
      Number.isFinite(reviews) && reviews >= 0
        ? Math.floor(reviews)
        : TRUSTPILOT_DEFAULT.reviews,
    url: /^https:\/\/(es\.)?trustpilot\.com\/|^https:\/\/www\.trustpilot\.com\//.test(url)
      ? url
      : TRUSTPILOT_DEFAULT.url,
    visible: typeof raw.visible === "boolean" ? raw.visible : TRUSTPILOT_DEFAULT.visible,
  };
}

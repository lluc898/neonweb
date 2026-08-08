import { cn } from "@/lib/utils";
import { formatTrustScore, trustpilotLabel, type TrustpilotData } from "@/lib/trustpilot";

/**
 * Insignia de valoración de Trustpilot.
 *
 * Reproduce el lenguaje visual de Trustpilot (estrellas sobre cuadro verde)
 * porque es lo que el cliente reconoce de un vistazo; es el único punto de la
 * web donde el verde de marca ajena está permitido.
 *
 * Los datos llegan por props desde `getTrustpilot()` (BD, editable en
 * /admin/trustpilot). Nunca hardcodear una nota aquí.
 */

const TRUSTPILOT_GREEN = "#00B67A";
const STARS = 5;

/** Una estrella: cuadro verde relleno según la fracción que le toque (0–1). */
function Star({ fill }: { fill: number }) {
  return (
    <span className="relative block h-5 w-5 overflow-hidden rounded-[2px] bg-white/12">
      <span
        className="absolute inset-y-0 left-0 block"
        style={{ width: `${fill * 100}%`, backgroundColor: TRUSTPILOT_GREEN }}
      />
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full p-[2px] text-white"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 2.2l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.26l-5.9 3.1 1.13-6.57L2.45 9.14l6.6-.96L12 2.2z" />
      </svg>
    </span>
  );
}

export function TrustpilotStars({ score }: { score: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {Array.from({ length: STARS }, (_, i) => (
        <Star key={i} fill={Math.min(1, Math.max(0, score - i))} />
      ))}
    </span>
  );
}

/** Logotipo textual de Trustpilot (estrella + palabra). */
function TrustpilotWordmark() {
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-text">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={TRUSTPILOT_GREEN} aria-hidden>
        <path d="M12 2.2l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.26l-5.9 3.1 1.13-6.57L2.45 9.14l6.6-.96L12 2.2z" />
      </svg>
      Trustpilot
    </span>
  );
}

type Props = {
  data: TrustpilotData;
  /** `inline` para barras de confianza y footer; `card` para una sección propia. */
  variant?: "inline" | "card";
  className?: string;
};

export function TrustpilotRating({ data, variant = "inline", className }: Props) {
  // El admin puede ocultar la insignia (p. ej. mientras rehacen la ficha).
  if (!data.visible) return null;

  const { url, score, reviews } = data;
  const label = trustpilotLabel(score);
  const readable = `${label} en Trustpilot: ${formatTrustScore(score)} sobre 5 con ${reviews} opiniones`;

  if (variant === "card") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${readable} (se abre en una pestaña nueva)`}
        className={cn(
          "group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-6 text-center transition-colors hover:border-neon-cyan/50",
          className
        )}
      >
        <TrustpilotStars score={score} />
        <p className="text-sm text-muted">
          <span className="font-semibold text-text">{label}</span> ·{" "}
          {formatTrustScore(score)} sobre 5 con {reviews} opiniones en{" "}
          <TrustpilotWordmark />
        </p>
        <span className="text-xs font-semibold text-neon-cyan opacity-0 transition-opacity group-hover:opacity-100">
          Leer las opiniones →
        </span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${readable} (se abre en una pestaña nueva)`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-sm transition-colors hover:border-neon-cyan/50",
        className
      )}
    >
      <TrustpilotStars score={score} />
      <span className="text-muted">
        <span className="font-semibold text-text">{formatTrustScore(score)}</span> ·{" "}
        {reviews} opiniones en <TrustpilotWordmark />
      </span>
    </a>
  );
}

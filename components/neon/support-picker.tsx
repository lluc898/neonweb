"use client";

import { cn, hexToRgba, neonTextGlow } from "@/lib/utils";
import { formatEUR } from "@/lib/pricing";
import type { NeonSupport } from "@/lib/neon-options";

/**
 * Selector ilustrado del soporte/acrílico.
 * Cada tarjeta dibuja EL TEXTO REAL del cliente con el acrílico correspondiente
 * detrás, sobre una mini pared, para que se vea cómo queda el recorte.
 * Al pasar el ratón el acrílico "se coloca" (entra y brilla con un destello).
 */

const ACRYLIC_FILL = "rgba(228,242,255,0.10)";
const ACRYLIC_EDGE = "rgba(228,242,255,0.22)";

/** Texto de muestra corto: la primera línea, recortada para que quepa. */
function sampleOf(text: string): string {
  const firstLine = text.split("\n").find((l) => l.trim().length > 0) ?? "";
  return firstLine.trim().slice(0, 4) || "abc";
}

/** Tornillos/separadores de las bases rectangulares (realismo). */
function Standoffs({ rounded }: { rounded: boolean }) {
  return (
    <>
      {[
        "left-1.5 top-1.5",
        "right-1.5 top-1.5",
        "left-1.5 bottom-1.5",
        "right-1.5 bottom-1.5",
      ].map((pos) => (
        <span
          key={pos}
          className={cn(
            "absolute h-1.5 w-1.5 rounded-full bg-white/40 shadow-[0_0_3px_rgba(255,255,255,0.5)]",
            pos,
            rounded && "m-0.5"
          )}
          aria-hidden
        />
      ))}
    </>
  );
}

function ShapePreview({
  shapeId,
  sample,
  fontCss,
  scale,
  hex,
}: {
  shapeId: string;
  sample: string;
  fontCss: string;
  scale: number;
  hex: string;
}) {
  // "contorno" = acrílico con margen alrededor del diseño.
  // "letras"   = acrílico pegado a cada letra (ahuecado, casi sin respaldo).
  const isCut = shapeId === "contorno" || shapeId === "letras";
  const isPerLetter = shapeId === "letras";
  const isRounded = shapeId === "redondeado";
  const fontSize = `${1.55 * scale}rem`;

  return (
    <div
      className="relative flex h-[86px] items-center justify-center overflow-hidden rounded-lg"
      style={{
        // Mini pared con un halo del color del neón
        backgroundColor: "#1b1620",
        backgroundImage: `radial-gradient(80% 75% at 50% 45%, ${hexToRgba(hex, 0.16)}, transparent 72%)`,
      }}
    >
      {/* Acrílico rectangular / redondeado: panel detrás del neón */}
      {!isCut && (
        <span
          className={cn(
            "acrylic-panel absolute transition-all duration-500 ease-out",
            "h-[58px] w-[104px] border",
            isRounded ? "rounded-xl" : "rounded-[3px]",
            "scale-90 opacity-70 group-hover:scale-100 group-hover:opacity-100"
          )}
          style={{
            backgroundColor: ACRYLIC_FILL,
            borderColor: ACRYLIC_EDGE,
            boxShadow: "inset 0 1px 6px rgba(255,255,255,0.10), 0 4px 12px rgba(0,0,0,0.45)",
          }}
          aria-hidden
        >
          <Standoffs rounded={isRounded} />
          {/* Destello que recorre el acrílico al hover */}
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <span className="acrylic-shine absolute inset-y-0 -left-6 w-8 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100" />
          </span>
        </span>
      )}

      {/* Texto + acrílico recortado al contorno (mismo glifo con borde grueso) */}
      <span className="relative grid place-items-center">
        {isCut && (
          <span
            className="col-start-1 row-start-1 whitespace-pre transition-all duration-500 ease-out scale-90 opacity-70 group-hover:scale-100 group-hover:opacity-100"
            style={{
              fontFamily: fontCss,
              fontSize,
              color: ACRYLIC_FILL,
              // Margen ancho alrededor del diseño vs. corte pegado a la letra.
              WebkitTextStrokeWidth: isPerLetter ? "2.5px" : "8px",
              WebkitTextStrokeColor: isPerLetter ? "rgba(228,242,255,0.42)" : ACRYLIC_EDGE,
              paintOrder: "stroke fill",
              filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))",
            }}
            aria-hidden
          >
            {sample}
          </span>
        )}

        <span
          className="col-start-1 row-start-1 whitespace-pre transition-[filter] duration-500 group-hover:brightness-125"
          style={{
            fontFamily: fontCss,
            fontSize,
            color: hex,
            textShadow: neonTextGlow(hex, 0.85),
          }}
        >
          {sample}
        </span>
      </span>

      {/* Sombra/suelo */}
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-black/45 to-transparent"
        aria-hidden
      />
    </div>
  );
}

export function SupportPicker({
  supports,
  value,
  onChange,
  text,
  fontCss,
  scale,
  hex,
}: {
  supports: NeonSupport[];
  value: string;
  onChange: (id: string) => void;
  text: string;
  fontCss: string;
  scale: number;
  hex: string;
}) {
  const sample = sampleOf(text);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {supports.map((s) => {
        const selected = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-pressed={selected}
            className={cn(
              "group overflow-hidden rounded-xl border p-2 text-left transition-all",
              selected
                ? "border-neon-cyan bg-neon-cyan/10 shadow-[0_0_16px_rgba(41,171,226,0.25)]"
                : "border-border bg-bg hover:border-muted"
            )}
          >
            <ShapePreview shapeId={s.id} sample={sample} fontCss={fontCss} scale={scale} hex={hex} />

            <div className="px-1 pb-0.5 pt-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-text">{s.label}</span>
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold",
                    s.extraPrice ? "text-text" : "text-neon-cyan"
                  )}
                >
                  {s.extraPrice ? `+${formatEUR(s.extraPrice)}` : "Gratis"}
                </span>
              </div>
              <p className="mt-1 text-xs leading-snug text-muted">{s.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

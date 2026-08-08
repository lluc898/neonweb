"use client";

import Image from "next/image";
import { neonTextGlow } from "@/lib/utils";
import type { NeonBackdrop } from "@/lib/neon-options";

type NeonPreviewProps = {
  text: string;
  fontCss: string;
  scale: number;
  hex: string;
  /** RGB multicolor: anima el matiz del neón en bucle. */
  rgb?: boolean;
  backdrop: NeonBackdrop;
};

/**
 * Vista previa en vivo del neón: renderiza el texto con la fuente, el color y el
 * resplandor elegidos sobre un fondo que simula una pared, para que el cliente
 * se imagine el neón en su espacio.
 */
export function NeonPreview({ text, fontCss, scale, hex, rgb, backdrop }: NeonPreviewProps) {
  const lines = (text.length ? text : "Tu texto").split("\n");
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const fontRem = Math.max(1.3, Math.min(4.2, 34 / longest)) * scale;
  const glow = neonTextGlow(hex);

  return (
    <div
      className="relative flex min-h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border p-8 sm:min-h-[360px]"
      style={backdrop.style}
    >
      {/* Fotografía del fondo, si el fondo elegido tiene una. El `style` de
          arriba queda debajo y hace de color de carga. */}
      {backdrop.image && (
        <>
          <Image
            key={backdrop.image}
            src={backdrop.image}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 640px"
            className="object-cover"
            aria-hidden
          />
          {/* Sin oscurecer, el neón no destaca sobre una foto de stock. */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(6, 6, 12, ${backdrop.dim ?? 0.45})` }}
            aria-hidden
          />
        </>
      )}

      {/* reflejo tenue en el suelo */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/5 to-transparent" />
      <div
        key={`${fontCss}-${hex}-${rgb}`}
        // `relative`: sin él la foto de fondo (absolute) taparía el texto.
        className={`relative animate-flicker text-center leading-tight break-words ${rgb ? "animate-rgb" : ""}`}
        style={{
          fontFamily: fontCss,
          color: hex,
          textShadow: glow,
          fontSize: `${fontRem}rem`,
          transform: `scale(${1})`,
        }}
      >
        {lines.map((line, i) => (
          <div key={i}>{line.length ? line : " "}</div>
        ))}
      </div>
    </div>
  );
}

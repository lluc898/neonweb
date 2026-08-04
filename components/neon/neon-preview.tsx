"use client";

import type { CSSProperties } from "react";
import { neonTextGlow } from "@/lib/utils";

type NeonPreviewProps = {
  text: string;
  fontCss: string;
  scale: number;
  hex: string;
  backdropStyle: CSSProperties;
};

/**
 * Vista previa en vivo del neón: renderiza el texto con la fuente, el color y el
 * resplandor elegidos sobre un fondo que simula una pared, para que el cliente
 * se imagine el neón en su espacio.
 */
export function NeonPreview({ text, fontCss, scale, hex, backdropStyle }: NeonPreviewProps) {
  const lines = (text.length ? text : "Tu texto").split("\n");
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const fontRem = Math.max(1.3, Math.min(4.2, 34 / longest)) * scale;
  const glow = neonTextGlow(hex);

  return (
    <div
      className="relative flex min-h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border p-8 sm:min-h-[360px]"
      style={backdropStyle}
    >
      {/* reflejo tenue en el suelo */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/5 to-transparent" />
      <div
        key={`${fontCss}-${hex}`}
        className="animate-flicker text-center leading-tight break-words"
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

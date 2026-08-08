import { cn, neonTextGlow } from "@/lib/utils";
import { findFont } from "@/lib/neon-options";
import type { Product } from "@/lib/products";

/**
 * Dibuja el neón de un producto de catálogo. Único sitio donde se decide cómo
 * se ve un producto, para que tarjeta, ficha y admin no se separen nunca.
 *
 * Tres formas de diseño:
 *  - `SVG`   — trazo vectorial subido por el admin (ver lib/svg-neon.ts).
 *  - emoji   — atajo de los diseños de icono.
 *  - texto   — el nombre (o `designText`) con una tipografía del configurador.
 */

type Props = {
  product: Product;
  /** Color del tubo. Por defecto el del diseño; la ficha lo cambia en vivo. */
  color?: string;
  /** Tamaño del texto/emoji en rem. El SVG siempre ocupa la caja. */
  sizeRem?: number;
  /** Anima el parpadeo de encendido (ficha de producto). */
  flicker?: boolean;
  /** RGB multicolor. */
  rgb?: boolean;
  className?: string;
};

/**
 * Glow para trazos SVG. `text-shadow` no afecta a un trazo, así que el
 * resplandor se hace con capas de `drop-shadow`.
 */
function svgGlow(hex: string): string {
  return [2, 6, 14, 28]
    .map((blur, i) => `drop-shadow(0 0 ${blur}px ${hex}${["", "", "cc", "99"][i]})`)
    .join(" ");
}

export function ProductArtwork({
  product,
  color,
  sizeRem = 3,
  flicker,
  rgb,
  className,
}: Props) {
  const hex = color ?? product.color;

  if (product.design === "SVG" && product.svgMarkup) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center",
          flicker && "animate-flicker",
          rgb && "animate-rgb",
          className
        )}
        style={{
          // `fill`, `stroke` y `stroke-width` se heredan hasta los trazos del
          // SVG inyectado: por eso el markup guardado no lleva color propio.
          color: hex,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: product.svgStroke ?? 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          filter: svgGlow(hex),
        }}
        /* Saneado por lista blanca en lib/svg-neon.ts antes de guardarse. */
        dangerouslySetInnerHTML={{ __html: product.svgMarkup }}
      />
    );
  }

  if (product.symbol) {
    return (
      <span
        className={cn(flicker && "animate-flicker", rgb && "animate-rgb", className)}
        style={{ fontSize: `${sizeRem}rem`, filter: `drop-shadow(0 0 ${sizeRem * 4}px ${hex})` }}
      >
        {product.symbol}
      </span>
    );
  }

  // Los productos semilla no traen fontId: se quedan con la fuente de marca.
  const fontCss = product.fontId
    ? findFont(product.fontId).cssVar
    : "var(--font-script)";
  const scale = product.fontId ? findFont(product.fontId).scale : 1;

  return (
    <span
      className={cn(
        "text-center leading-tight",
        flicker && "animate-flicker",
        rgb && "animate-rgb",
        className
      )}
      style={{
        fontFamily: fontCss,
        fontSize: `${sizeRem * scale}rem`,
        color: hex,
        textShadow: neonTextGlow(hex),
      }}
    >
      {product.designText?.trim() || product.name}
    </span>
  );
}

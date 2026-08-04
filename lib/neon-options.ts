/**
 * Catálogo de opciones del configurador de neón (Modo A — texto).
 * Fuente única de verdad para preview, precio y ficha de producción.
 * Más adelante estas opciones (sobre todo precios) serán editables desde el admin.
 */
import type { CSSProperties } from "react";

export type NeonFont = {
  id: string;
  label: string;
  /** Variable CSS inyectada por next/font (ver app/personalizar/fonts.ts). */
  cssVar: string;
  /** Factor de escala para equilibrar el tamaño visual entre fuentes. */
  scale: number;
};

export const NEON_FONTS: NeonFont[] = [
  // Las 6 primeras se muestran siempre; el resto tras "ver más".
  { id: "clasico", label: "Tubo clásico", cssVar: "var(--font-neon-monoton)", scale: 0.82 },
  { id: "moderno", label: "Moderno", cssVar: "var(--font-neon-righteous)", scale: 1 },
  { id: "casual", label: "Casual", cssVar: "var(--font-neon-pacifico)", scale: 1 },
  { id: "pincel", label: "Pincel", cssVar: "var(--font-neon-kaushan)", scale: 1.05 },
  { id: "elegante", label: "Elegante", cssVar: "var(--font-neon-vibes)", scale: 1.3 },
  { id: "marcador", label: "Marcador", cssVar: "var(--font-neon-marker)", scale: 1 },
  { id: "lobster", label: "Lobster", cssVar: "var(--font-neon-lobster)", scale: 1.05 },
  { id: "sacramento", label: "Fino", cssVar: "var(--font-neon-sacramento)", scale: 1.4 },
  { id: "bungee", label: "Bloque", cssVar: "var(--font-neon-bungee)", scale: 0.82 },
  { id: "audiowide", label: "Tecno", cssVar: "var(--font-neon-audiowide)", scale: 0.9 },
  { id: "satisfy", label: "Firma", cssVar: "var(--font-neon-satisfy)", scale: 1.15 },
  { id: "yellowtail", label: "Cursiva", cssVar: "var(--font-neon-yellowtail)", scale: 1.2 },
  { id: "cookie", label: "Dulce", cssVar: "var(--font-neon-cookie)", scale: 1.35 },
  { id: "bebas", label: "Condensada", cssVar: "var(--font-neon-bebas)", scale: 1.2 },
  { id: "manuscrita", label: "Manuscrita", cssVar: "var(--font-neon-shadows)", scale: 1.15 },
  { id: "baile", label: "Baile", cssVar: "var(--font-neon-dancing)", scale: 1.15 },
  { id: "caveat", label: "Nota", cssVar: "var(--font-neon-caveat)", scale: 1.25 },
  { id: "orbitron", label: "Futuro", cssVar: "var(--font-neon-orbitron)", scale: 0.9 },
];

/** Cuántas tipografías se muestran antes del desplegable "ver más". */
export const FONTS_VISIBLE = 6;

export type NeonColor = {
  id: string;
  label: string;
  hex: string;
};

export const NEON_COLORS: NeonColor[] = [
  { id: "blanco-calido", label: "Blanco cálido", hex: "#ffedc2" },
  { id: "blanco-frio", label: "Blanco frío", hex: "#eaf6ff" },
  { id: "rosa", label: "Rosa", hex: "#ff6ec7" },
  { id: "magenta", label: "Magenta", hex: "#ec1e8c" },
  { id: "rojo", label: "Rojo", hex: "#ff3b3b" },
  { id: "naranja", label: "Naranja", hex: "#ff8c1a" },
  { id: "amarillo", label: "Amarillo", hex: "#ffe600" },
  { id: "verde", label: "Verde", hex: "#39ff14" },
  { id: "cian", label: "Cian", hex: "#29abe2" },
  { id: "azul", label: "Azul", hex: "#2b6bff" },
  { id: "morado", label: "Morado", hex: "#b026ff" },
];

export type NeonSize = {
  id: string;
  label: string;
  /** Ancho máximo aproximado, para comunicar tamaño al cliente. */
  dimension: string;
  basePrice: number;
  /** Caracteres incluidos antes del recargo por longitud. */
  includedChars: number;
  /** Recargo por cada carácter extra. */
  perExtraChar: number;
};

export const NEON_SIZES: NeonSize[] = [
  { id: "s", label: "Pequeño", dimension: "hasta 50 cm", basePrice: 149, includedChars: 8, perExtraChar: 7 },
  { id: "m", label: "Mediano", dimension: "hasta 80 cm", basePrice: 219, includedChars: 12, perExtraChar: 9 },
  { id: "l", label: "Grande", dimension: "hasta 100 cm", basePrice: 299, includedChars: 16, perExtraChar: 11 },
  { id: "xl", label: "Gigante", dimension: "hasta 150 cm", basePrice: 399, includedChars: 20, perExtraChar: 13 },
];

export type NeonSupport = {
  id: string;
  label: string;
  description: string;
  extraPrice: number;
};

export const NEON_SUPPORTS: NeonSupport[] = [
  { id: "contorno", label: "Corte al contorno", description: "El acrílico sigue la forma del diseño", extraPrice: 0 },
  { id: "rectangulo", label: "Rectángulo", description: "Base rectangular transparente", extraPrice: 19 },
  { id: "redondeado", label: "Rect. redondeado", description: "Base con esquinas redondeadas", extraPrice: 25 },
];

export type NeonUsage = {
  id: string;
  label: string;
  description: string;
  multiplier: number;
};

export const NEON_USAGES: NeonUsage[] = [
  { id: "interior", label: "Interior", description: "Uso en pared o sobremesa", multiplier: 1 },
  { id: "exterior", label: "Exterior", description: "Resistente al agua (IP65)", multiplier: 1.25 },
];

/** Configuración completa de un neón personalizado (ficha de producción). */
export type NeonConfig = {
  text: string;
  fontId: string;
  colorId: string;
  sizeId: string;
  supportId: string;
  usageId: string;
  backdropId: string;
};

export const DEFAULT_CONFIG: NeonConfig = {
  text: "Tu texto",
  fontId: "casual",
  colorId: "rosa",
  sizeId: "m",
  supportId: "contorno",
  usageId: "interior",
  backdropId: "ladrillo",
};

/** Fondos de la vista previa (para imaginar el neón en un espacio real). */
export type NeonBackdrop = {
  id: string;
  label: string;
  style: CSSProperties;
};

export const NEON_BACKDROPS: NeonBackdrop[] = [
  {
    id: "estudio",
    label: "Estudio",
    style: {
      backgroundColor: "#16161d",
      backgroundImage:
        "radial-gradient(120% 90% at 50% -15%, rgba(255,255,255,0.10), transparent 55%)",
    },
  },
  {
    id: "ladrillo",
    label: "Ladrillo",
    style: {
      // Pared de ladrillo en CSS puro (sin imágenes): ladrillos desfasados con junta.
      backgroundColor: "#2c1b15",
      backgroundImage: [
        "linear-gradient(335deg, #1c110c 23px, transparent 23px)",
        "linear-gradient(155deg, #1c110c 23px, transparent 23px)",
        "linear-gradient(335deg, #1c110c 23px, transparent 23px)",
        "linear-gradient(155deg, #1c110c 23px, transparent 23px)",
      ].join(", "),
      backgroundSize: "58px 58px",
      backgroundPosition: "0px 2px, 4px 35px, 29px 31px, 34px 6px",
    },
  },
  {
    id: "noche",
    label: "Noche",
    style: {
      backgroundColor: "#05060f",
      backgroundImage:
        "radial-gradient(70% 50% at 50% 115%, rgba(41,171,226,0.18), transparent 70%), linear-gradient(180deg, #0e1a33 0%, #05060f 70%)",
    },
  },
  {
    id: "salon",
    label: "Salón",
    style: {
      backgroundColor: "#150f12",
      backgroundImage:
        "radial-gradient(90% 70% at 50% 0%, rgba(150,95,70,0.28), transparent 60%), linear-gradient(180deg, #1e1519 0%, #0d090b 100%)",
    },
  },
];

// Helpers de búsqueda
export const findFont = (id: string) => NEON_FONTS.find((f) => f.id === id) ?? NEON_FONTS[0];
export const findColor = (id: string) => NEON_COLORS.find((c) => c.id === id) ?? NEON_COLORS[0];
export const findSize = (id: string) => NEON_SIZES.find((s) => s.id === id) ?? NEON_SIZES[0];
export const findSupport = (id: string) => NEON_SUPPORTS.find((s) => s.id === id) ?? NEON_SUPPORTS[0];
export const findUsage = (id: string) => NEON_USAGES.find((u) => u.id === id) ?? NEON_USAGES[0];
export const findBackdrop = (id: string) =>
  NEON_BACKDROPS.find((b) => b.id === id) ?? NEON_BACKDROPS[0];

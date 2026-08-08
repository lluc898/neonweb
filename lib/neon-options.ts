/**
 * Catálogo de opciones del configurador de neón (Modo A — texto).
 * Fuente única de verdad para preview, precio y ficha de producción.
 * Más adelante estas opciones (sobre todo precios) serán editables desde el admin.
 */
import type { CSSProperties } from "react";

export type NeonFont = {
  id: string;
  label: string;
  /** Variable CSS inyectada por next/font (ver lib/neon-fonts.ts). */
  cssVar: string;
  /** Factor de escala para equilibrar el tamaño visual entre fuentes. */
  scale: number;
  /** Familia en Google Fonts: se usa para generar el EPS trazado. */
  family: string;
};

export const NEON_FONTS: NeonFont[] = [
  // Las 6 primeras se muestran siempre; el resto tras "ver más".
  { id: "clasico", label: "Tubo clásico", cssVar: "var(--font-neon-monoton)", scale: 0.82, family: "Monoton" },
  { id: "moderno", label: "Moderno", cssVar: "var(--font-neon-righteous)", scale: 1, family: "Righteous" },
  { id: "casual", label: "Casual", cssVar: "var(--font-neon-pacifico)", scale: 1, family: "Pacifico" },
  { id: "pincel", label: "Pincel", cssVar: "var(--font-neon-kaushan)", scale: 1.05, family: "Kaushan Script" },
  { id: "elegante", label: "Elegante", cssVar: "var(--font-neon-vibes)", scale: 1.3, family: "Great Vibes" },
  { id: "marcador", label: "Marcador", cssVar: "var(--font-neon-marker)", scale: 1, family: "Permanent Marker" },
  { id: "lobster", label: "Lobster", cssVar: "var(--font-neon-lobster)", scale: 1.05, family: "Lobster" },
  { id: "sacramento", label: "Fino", cssVar: "var(--font-neon-sacramento)", scale: 1.4, family: "Sacramento" },
  { id: "bungee", label: "Bloque", cssVar: "var(--font-neon-bungee)", scale: 0.82, family: "Bungee" },
  { id: "audiowide", label: "Tecno", cssVar: "var(--font-neon-audiowide)", scale: 0.9, family: "Audiowide" },
  { id: "satisfy", label: "Firma", cssVar: "var(--font-neon-satisfy)", scale: 1.15, family: "Satisfy" },
  { id: "yellowtail", label: "Cursiva", cssVar: "var(--font-neon-yellowtail)", scale: 1.2, family: "Yellowtail" },
  { id: "cookie", label: "Dulce", cssVar: "var(--font-neon-cookie)", scale: 1.35, family: "Cookie" },
  { id: "bebas", label: "Condensada", cssVar: "var(--font-neon-bebas)", scale: 1.2, family: "Bebas Neue" },
  { id: "manuscrita", label: "Manuscrita", cssVar: "var(--font-neon-shadows)", scale: 1.15, family: "Shadows Into Light" },
  { id: "baile", label: "Baile", cssVar: "var(--font-neon-dancing)", scale: 1.15, family: "Dancing Script" },
  { id: "caveat", label: "Nota", cssVar: "var(--font-neon-caveat)", scale: 1.25, family: "Caveat" },
  { id: "orbitron", label: "Futuro", cssVar: "var(--font-neon-orbitron)", scale: 0.9, family: "Orbitron" },
];

/** Cuántas tipografías se muestran antes del desplegable "ver más". */
export const FONTS_VISIBLE = 6;

export type NeonColor = {
  id: string;
  label: string;
  hex: string;
  /** RGB multicolor: el tubo cambia de color (mando incluido). Lleva suplemento. */
  rgb?: boolean;
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
  { id: "rgb", label: "RGB multicolor", hex: "#ff0040", rgb: true },
];

export type NeonSize = {
  id: string;
  label: string;
  /** Ancho máximo aproximado, para comunicar tamaño al cliente. */
  dimension: string;
  /** Altura de letra aproximada (cm) — para estimar el m² de material. */
  heightCm: number;
  /** Ancho máximo del rótulo (cm): el diseño se ajusta para no superarlo. */
  maxWidthCm: number;
  /** Ancho medio por carácter (cm), espaciado incluido. */
  charWidthCm: number;
  /** Metros de tubo de neón por carácter (estimación de fabricación). */
  tubePerCharM: number;
};

export const NEON_SIZES: NeonSize[] = [
  { id: "s", label: "Pequeño", dimension: "hasta 50 cm", heightCm: 15, maxWidthCm: 50, charWidthCm: 5.5, tubePerCharM: 0.25 },
  { id: "m", label: "Mediano", dimension: "hasta 80 cm", heightCm: 20, maxWidthCm: 80, charWidthCm: 7, tubePerCharM: 0.35 },
  { id: "l", label: "Grande", dimension: "hasta 100 cm", heightCm: 27, maxWidthCm: 100, charWidthCm: 9, tubePerCharM: 0.45 },
  { id: "xl", label: "Gigante", dimension: "hasta 150 cm", heightCm: 35, maxWidthCm: 150, charWidthCm: 12, tubePerCharM: 0.55 },
];

export type NeonSupport = {
  id: string;
  label: string;
  description: string;
  extraPrice: number;
};

export const NEON_SUPPORTS: NeonSupport[] = [
  {
    id: "contorno",
    label: "Corte a la forma",
    description: "El acrílico rodea el diseño con un pequeño margen. Para colgar o montar en pared.",
    extraPrice: 0,
  },
  {
    id: "letras",
    label: "Corte a la letra",
    description: "El acrílico se corta pegado a cada letra: casi no se ve respaldo. El acabado más limpio.",
    extraPrice: 39,
  },
  {
    id: "rectangulo",
    label: "Rectángulo",
    description: "Panel rectangular transparente detrás del neón, con separadores a la pared.",
    extraPrice: 19,
  },
  {
    id: "redondeado",
    label: "Rect. redondeado",
    description: "Igual que el rectangular, pero con las esquinas redondeadas.",
    extraPrice: 25,
  },
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

/** Plazos de entrega (indicación del fabricante: estándar 3-5 días, express 24/48 h con plus). */
export type NeonDelivery = {
  id: string;
  label: string;
  eta: string;
  multiplier: number;
};

export const NEON_DELIVERIES: NeonDelivery[] = [
  { id: "standard", label: "Estándar", eta: "3-5 días hábiles", multiplier: 1 },
  { id: "express", label: "Express", eta: "24-48 h", multiplier: 1.2 },
];

/** Tarifas de fabricación (la fórmula real: metros de tubo + m² de material). */
export type NeonRates = {
  /** € por metro de tubo de neón. */
  perMeter: number;
  /** € por m² de metacrilato/material. */
  perM2: number;
  /** Suplemento fijo por RGB multicolor. */
  rgbExtra: number;
  /** Pedido mínimo (el total nunca baja de aquí). */
  minTotal: number;
  /** Potencia por metro de tubo (W/m) — informativo. */
  wattsPerM: number;
  /** Potencia por metro si es RGB (W/m). */
  wattsPerMRgb: number;
};

export const NEON_RATES: NeonRates = {
  perMeter: 45,
  perM2: 300,
  rgbExtra: 49,
  minTotal: 119,
  wattsPerM: 12,
  wattsPerMRgb: 14,
};

/** Configuración completa de un neón personalizado (ficha de producción). */
export type NeonConfig = {
  text: string;
  fontId: string;
  colorId: string;
  sizeId: string;
  supportId: string;
  usageId: string;
  deliveryId: string;
  backdropId: string;
};

export const DEFAULT_CONFIG: NeonConfig = {
  text: "Tu texto",
  fontId: "casual",
  colorId: "rosa",
  sizeId: "m",
  supportId: "contorno",
  usageId: "interior",
  deliveryId: "standard",
  backdropId: "ladrillo",
};

/** Fondos de la vista previa (para imaginar el neón en un espacio real). */
export type NeonBackdrop = {
  id: string;
  label: string;
  /** Fondo CSS: se ve mientras carga la foto y si el fondo no tiene ninguna. */
  style: CSSProperties;
  /** Fotografía en `/public/fondos` (opcional). */
  image?: string;
  /**
   * Oscurecido que se aplica encima de la foto (0–1). Las fotos vienen
   * demasiado claras: sin esto el neón no destaca sobre ellas.
   */
  dim?: number;
};

/**
 * Fotografías de `public/fondos` (Pexels, licencia libre para uso comercial).
 * El `style` de cada fondo se ve mientras carga la foto y hace de red de
 * seguridad si el archivo faltase. "Noche" sigue siendo CSS puro: es un
 * ambiente, no un lugar, y en foto quedaría peor.
 */
export const NEON_BACKDROPS: NeonBackdrop[] = [
  {
    id: "estudio",
    label: "Estudio",
    image: "/fondos/estudio.webp",
    dim: 0.35,
    style: {
      backgroundColor: "#16161d",
      backgroundImage:
        "radial-gradient(120% 90% at 50% -15%, rgba(255,255,255,0.10), transparent 55%)",
    },
  },
  {
    id: "ladrillo",
    label: "Ladrillo",
    image: "/fondos/ladrillo.webp",
    dim: 0.3,
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
    id: "salon",
    label: "Salón",
    image: "/fondos/salon.webp",
    dim: 0.38,
    style: {
      backgroundColor: "#242a20",
      backgroundImage:
        "radial-gradient(90% 70% at 50% 0%, rgba(150,95,70,0.18), transparent 60%), linear-gradient(180deg, #2b3226 0%, #14170f 100%)",
    },
  },
  {
    id: "hojas",
    label: "Hojas",
    image: "/fondos/hojas.webp",
    dim: 0.45,
    style: {
      backgroundColor: "#16240f",
      backgroundImage:
        "radial-gradient(90% 70% at 50% 0%, rgba(60,120,45,0.35), transparent 65%)",
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
];

// Helpers de búsqueda
export const findFont = (id: string) => NEON_FONTS.find((f) => f.id === id) ?? NEON_FONTS[0];
export const findColor = (id: string) => NEON_COLORS.find((c) => c.id === id) ?? NEON_COLORS[0];
export const findSize = (id: string) => NEON_SIZES.find((s) => s.id === id) ?? NEON_SIZES[0];
export const findSupport = (id: string) => NEON_SUPPORTS.find((s) => s.id === id) ?? NEON_SUPPORTS[0];
export const findUsage = (id: string) => NEON_USAGES.find((u) => u.id === id) ?? NEON_USAGES[0];
export const findDelivery = (id: string) =>
  NEON_DELIVERIES.find((d) => d.id === id) ?? NEON_DELIVERIES[0];
export const findBackdrop = (id: string) =>
  NEON_BACKDROPS.find((b) => b.id === id) ?? NEON_BACKDROPS[0];

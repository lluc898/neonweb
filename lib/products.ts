/**
 * Catálogo de productos (datos semilla).
 * Provisional hasta conectar Supabase: cuando exista la BD, estos productos
 * saldrán de la tabla Product y este archivo se sustituye por consultas.
 * La forma del tipo Product ya está pensada para mapear 1:1 con la BD.
 */

export type ProductCategory = {
  id: string;
  label: string;
};

export const CATEGORIES: ProductCategory[] = [
  { id: "bodas", label: "Bodas" },
  { id: "cumpleanos", label: "Cumpleaños" },
  { id: "frases", label: "Frases" },
  { id: "iconos", label: "Dibujos e iconos" },
  { id: "negocios", label: "Negocios" },
];

/** Cómo se dibuja el neón del producto (espejo del enum `ProductDesign`). */
export type ProductDesignKind = "TEXT" | "SVG";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  /** Precio base (tamaño Mediano) en euros. */
  price: number;
  /** Color neón principal del diseño (hex). */
  color: string;
  /** Emoji para diseños de icono/dibujo; si existe, la tarjeta lo muestra. */
  symbol?: string;
  description: string;

  // --- Diseño (lo rellena el alta desde el admin; los semilla usan TEXT) ---
  design?: ProductDesignKind;
  /** Texto a dibujar si difiere del nombre comercial. */
  designText?: string;
  /** Tipografía del configurador; sin ella se usa la de marca. */
  fontId?: string;
  /** SVG saneado listo para inyectar (solo con design = "SVG"). */
  svgMarkup?: string;
  /** Grosor del trazo, en unidades del viewBox. */
  svgStroke?: number;
};

export const PRODUCTS: Product[] = [
  // Bodas
  { id: "p1", slug: "better-together", name: "Better Together", category: "bodas", price: 249, color: "#ff6ec7", description: "El clásico para tu photocall de boda. Cálido y romántico." },
  { id: "p2", slug: "mr-and-mrs", name: "Mr & Mrs", category: "bodas", price: 229, color: "#ffedc2", description: "Elegante y atemporal para la mesa presidencial." },
  { id: "p3", slug: "for-ever", name: "For Ever", category: "bodas", price: 209, color: "#ec1e8c", description: "Un detalle luminoso que dura para siempre." },
  { id: "p4", slug: "love", name: "Love", category: "bodas", price: 189, color: "#ff3b3b", symbol: "❤", description: "El icono universal del amor en neón." },

  // Cumpleaños
  { id: "p5", slug: "happy-birthday", name: "Happy Birthday", category: "cumpleanos", price: 239, color: "#29abe2", description: "Convierte cualquier fiesta en un plató de neón." },
  { id: "p6", slug: "feliz-cumple", name: "Feliz Cumple", category: "cumpleanos", price: 219, color: "#f2e20a", description: "En español, para celebrarlo como en casa." },
  { id: "p7", slug: "make-a-wish", name: "Make a Wish", category: "cumpleanos", price: 209, color: "#b026ff", symbol: "✨", description: "Pide un deseo bajo la luz de tu neón." },

  // Frases
  { id: "p8", slug: "good-vibes-only", name: "Good Vibes Only", category: "frases", price: 259, color: "#39ff14", description: "Buen rollo permanente para tu habitación o local." },
  { id: "p9", slug: "it-was-always-you", name: "It Was Always You", category: "frases", price: 269, color: "#ff6ec7", description: "Una declaración que ilumina la pared." },
  { id: "p10", slug: "la-vida-es-bella", name: "La Vida es Bella", category: "frases", price: 249, color: "#29abe2", description: "Un recordatorio bonito, cada día." },

  // Dibujos e iconos
  { id: "p11", slug: "rayo", name: "Rayo", category: "iconos", price: 179, color: "#f2e20a", symbol: "⚡", description: "Energía pura para tu setup gamer o estudio." },
  { id: "p12", slug: "luna", name: "Luna", category: "iconos", price: 189, color: "#eaf6ff", symbol: "🌙", description: "Luz suave y soñadora para el dormitorio." },
  { id: "p13", slug: "coctel", name: "Cóctel", category: "iconos", price: 199, color: "#ff8c1a", symbol: "🍸", description: "El toque perfecto para tu barra o terraza." },

  // Negocios
  { id: "p14", slug: "open", name: "Open", category: "negocios", price: 199, color: "#ff3b3b", description: "Señal de abierto visible desde la calle." },
  { id: "p15", slug: "coffee", name: "Coffee", category: "negocios", price: 219, color: "#ff8c1a", symbol: "☕", description: "Atrae clientes a tu cafetería con estilo." },
  { id: "p16", slug: "tattoo", name: "Tattoo", category: "negocios", price: 299, color: "#b026ff", description: "Rótulo de neón para tu estudio de tatuajes." },
];

/** Ajustes de precio por tamaño respecto al precio base (Mediano). */
export const PRODUCT_SIZES = [
  { id: "s", label: "Pequeño", dimension: "hasta 50 cm", delta: -40 },
  { id: "m", label: "Mediano", dimension: "hasta 80 cm", delta: 0 },
  { id: "l", label: "Grande", dimension: "hasta 100 cm", delta: 70 },
  { id: "xl", label: "Gigante", dimension: "hasta 150 cm", delta: 150 },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const getCategoryLabel = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;

/**
 * Conversión de un SVG subido por el admin en un "trazo de neón".
 *
 * Función PURA y sin dependencias: la usa el navegador para la vista previa y
 * el servidor como versión autoritativa antes de guardar.
 *
 * ⚠️ SEGURIDAD: el SVG resultante se inyecta con `dangerouslySetInnerHTML`
 * para que el CSS pueda alcanzar a los trazos (sin eso no hay glow posible).
 * Por eso el saneado es por **lista blanca**: se reconstruye el documento
 * emitiendo solo las etiquetas y atributos permitidos, en vez de intentar
 * borrar lo peligroso. Todo lo demás —incluido el texto entre etiquetas— se
 * descarta, así que `<script>`, `on*`, `javascript:`, `<foreignObject>` o un
 * `<use href="http://…">` no pueden sobrevivir.
 */

/** Etiquetas de dibujo vectorial. Nada de texto, imágenes, uso externo ni estilos. */
const ALLOWED_TAGS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "rect",
]);

/**
 * Atributos de geometría. Se excluyen a propósito `fill`, `stroke`, `style`,
 * `class` e `id`: el aspecto lo impone el neón, no el archivo.
 */
const ALLOWED_ATTRS = new Set([
  "d",
  "points",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "transform",
  "fill-rule",
  "clip-rule",
]);

/** Valores con `<`, `>` o comillas se rechazan: no hay geometría que los use. */
const UNSAFE_VALUE = /[<>"']/;

const TAG_RE = /<\/?([a-zA-Z][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)\/?>/g;
const ATTR_RE = /([a-zA-Z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g;

/** Quita el prefijo de namespace: `svg:path` → `path`. */
function localName(tag: string): string {
  const colon = tag.lastIndexOf(":");
  return (colon === -1 ? tag : tag.slice(colon + 1)).toLowerCase();
}

function sanitizeAttrs(raw: string): string {
  const kept: string[] = [];
  for (const m of raw.matchAll(ATTR_RE)) {
    const name = localName(m[1]);
    if (!ALLOWED_ATTRS.has(name)) continue;

    const value = m[2].replace(/^["']|["']$/g, "");
    if (UNSAFE_VALUE.test(value) || value.length > 100_000) continue;

    kept.push(`${name}="${value}"`);
  }
  return kept.length ? " " + kept.join(" ") : "";
}

export type SanitizedSvg = {
  /** viewBox del original, imprescindible para escalar el dibujo. */
  viewBox: string;
  /** Contenido interno ya saneado (sin la etiqueta `<svg>`). */
  inner: string;
};

export type SvgError =
  | "vacio"
  | "no-svg"
  | "sin-viewbox"
  | "sin-trazos"
  | "demasiado-grande";

/** Tamaño máximo del SVG saneado. Un dibujo de línea razonable no llega. */
export const MAX_SVG_CHARS = 200_000;

/**
 * Extrae el viewBox. Si el archivo no lo trae, se sintetiza de width/height
 * (Illustrator y algunos exportadores lo omiten).
 */
function readViewBox(svgTagAttrs: string): string | null {
  const attrs = new Map<string, string>();
  for (const m of svgTagAttrs.matchAll(ATTR_RE)) {
    attrs.set(localName(m[1]), m[2].replace(/^["']|["']$/g, ""));
  }

  const viewBox = attrs.get("viewbox");
  if (viewBox && /^[-\d\s.,eE]+$/.test(viewBox) && viewBox.trim().split(/[\s,]+/).length === 4) {
    return viewBox.trim();
  }

  const num = (v?: string) => {
    const n = parseFloat(v ?? "");
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const w = num(attrs.get("width"));
  const h = num(attrs.get("height"));
  return w && h ? `0 0 ${w} ${h}` : null;
}

/** Sanea un SVG subido. Devuelve el error si no sirve como diseño de neón. */
export function sanitizeSvg(source: string): { ok: true; svg: SanitizedSvg } | { ok: false; error: SvgError } {
  if (!source || !source.trim()) return { ok: false, error: "vacio" };
  if (source.length > 4 * MAX_SVG_CHARS) return { ok: false, error: "demasiado-grande" };

  // Fuera comentarios, CDATA, doctype e instrucciones de proceso antes de nada:
  // pueden esconder etiquetas y confundir al escáner.
  const cleaned = source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<\?[\s\S]*?\?>/g, "");

  let viewBox: string | null = null;
  const out: string[] = [];
  let shapes = 0;

  for (const m of cleaned.matchAll(TAG_RE)) {
    const full = m[0];
    const tag = localName(m[1]);
    if (!ALLOWED_TAGS.has(tag)) continue;

    const closing = full.startsWith("</");
    const selfClosing = /\/>$/.test(full);

    if (tag === "svg") {
      // La raíz se reconstruye al final: aquí solo interesa su viewBox.
      if (!closing && !viewBox) viewBox = readViewBox(m[2]);
      continue;
    }

    // `g` es lo único que agrupa; las formas se emiten siempre autocerradas y
    // su etiqueta de cierre (`</path>`, si el original la traía) se descarta.
    if (closing) {
      if (tag === "g") out.push("</g>");
      continue;
    }

    const attrs = sanitizeAttrs(m[2]);
    if (tag === "g") {
      if (!selfClosing) out.push(`<g${attrs}>`);
      continue;
    }

    shapes++;
    out.push(`<${tag}${attrs}/>`);
  }

  if (viewBox === null) {
    // Sin etiqueta <svg> reconocible no hay documento; con ella pero sin
    // dimensiones, no se puede escalar.
    return { ok: false, error: /<svg[\s>]/i.test(cleaned) ? "sin-viewbox" : "no-svg" };
  }
  if (shapes === 0) return { ok: false, error: "sin-trazos" };

  const inner = out.join("");
  if (inner.length > MAX_SVG_CHARS) return { ok: false, error: "demasiado-grande" };

  return { ok: true, svg: { viewBox, inner } };
}

/** Grosor de trazo por defecto, como fracción del lado mayor del viewBox. */
const STROKE_RATIO = 0.018;

/** Grosor sugerido para un viewBox: un tubo proporcional al tamaño del dibujo. */
export function suggestedStroke(viewBox: string): number {
  const [, , w, h] = viewBox.trim().split(/[\s,]+/).map(Number);
  const side = Math.max(w || 0, h || 0) || 100;
  return Math.round(side * STROKE_RATIO * 100) / 100;
}

/**
 * Markup final que se guarda en `Product.svgMarkup`.
 * No lleva color ni grosor: los pone el renderizador por CSS heredado, así el
 * mismo diseño sirve para cualquier color que elija el cliente.
 */
export function neonSvgMarkup(svg: SanitizedSvg): string {
  return (
    `<svg viewBox="${svg.viewBox}" width="100%" height="100%" ` +
    `preserveAspectRatio="xMidYMid meet" aria-hidden="true">${svg.inner}</svg>`
  );
}

/** Lee el viewBox de un markup ya generado (para recalcular el trazo). */
export function viewBoxOf(markup: string): string | null {
  return markup.match(/viewBox="([^"]+)"/)?.[1] ?? null;
}

export const SVG_ERROR_MESSAGES: Record<SvgError, string> = {
  vacio: "El archivo está vacío.",
  "no-svg": "Eso no parece un SVG. Exporta el diseño como SVG desde Illustrator.",
  "sin-viewbox": "El SVG no trae viewBox ni medidas, así que no se puede escalar. Vuelve a exportarlo indicando el tamaño del documento.",
  "sin-trazos": "No se ha encontrado ningún trazo. Si el diseño lleva texto, conviértelo a curvas antes de exportar (Texto → Crear contorno).",
  "demasiado-grande": "El dibujo tiene demasiados puntos. Simplifica los trazos antes de subirlo.",
};

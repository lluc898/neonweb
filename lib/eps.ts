import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse as parseFont, Path, type Font, type Glyph } from "opentype.js";
import { findColor, findFont, findSize, findSupport, findUsage, type NeonConfig } from "@/lib/neon-options";

/**
 * Generación del EPS de producción: el texto del cliente convertido a CURVAS
 * (trazado) y a TAMAÑO REAL en centímetros, tal como lo pide el fabricante.
 *
 * Las fuentes se descargan de Google Fonts en formato TTF la primera vez y se
 * cachean en disco (y en memoria) para no depender de la red en cada descarga.
 */

const PT_PER_CM = 72 / 2.54; // 1 cm = 28,3465 pt
const LINE_GAP = 1.45; // separación entre líneas (× altura de letra)
const CACHE_DIR = join(tmpdir(), "nls-fonts");

const memoryCache = new Map<string, Font>();

/** Descarga (o recupera de caché) el TTF de una familia de Google Fonts. */
async function loadFont(family: string): Promise<Font> {
  const cached = memoryCache.get(family);
  if (cached) return cached;

  const fileName = family.replace(/\s+/g, "_") + ".ttf";
  const filePath = join(CACHE_DIR, fileName);

  let buffer: Buffer | null = null;
  try {
    buffer = await readFile(filePath);
  } catch {
    // No está en disco: se descarga de Google Fonts.
    // Con el User-Agent de un Safari antiguo, Google sirve TTF (no WOFF2),
    // que es lo que opentype.js sabe leer.
    const cssUrl = `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}`;
    const css = await fetch(cssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-us) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    }).then((r) => {
      if (!r.ok) throw new Error(`Google Fonts respondió ${r.status} para "${family}"`);
      return r.text();
    });

    const fontUrl = css.match(/url\((https:\/\/[^)]+)\)/)?.[1];
    if (!fontUrl) throw new Error(`No se encontró la fuente "${family}"`);

    const res = await fetch(fontUrl);
    if (!res.ok) throw new Error(`No se pudo descargar la fuente "${family}"`);
    buffer = Buffer.from(await res.arrayBuffer());

    // Comprobación de formato: TTF (0x00010000 / "true") u OpenType CFF ("OTTO").
    const magic = buffer.subarray(0, 4).toString("binary");
    const isTtf =
      magic === "\x00\x01\x00\x00" || magic === "true" || magic === "OTTO" || magic === "ttcf";
    if (!isTtf) {
      throw new Error(`Google devolvió un formato no soportado para "${family}"`);
    }

    await mkdir(CACHE_DIR, { recursive: true }).catch(() => {});
    await writeFile(filePath, buffer).catch(() => {});
  }

  const font = parseFont(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  );
  memoryCache.set(family, font);
  return font;
}

/** Proporción alto-de-mayúscula / em: sirve para escalar a la altura real pedida. */
function capHeightRatio(font: Font): number {
  const os2 = font.tables.os2 as { sCapHeight?: number } | undefined;
  const cap = os2?.sCapHeight;
  const unitsPerEm = font.unitsPerEm || 1000;
  if (cap && cap > 0) return cap / unitsPerEm;
  // Sin métrica de mayúsculas: se estima con el ascendente.
  return (font.ascender / unitsPerEm) * 0.72;
}

export type EpsResult = {
  content: string;
  fileName: string;
  widthCm: number;
  heightCm: number;
};

/**
 * Construye el EPS del neón a tamaño real.
 * `orderNumber` solo se usa para el nombre de archivo y las anotaciones.
 */
export async function buildNeonEps(
  config: NeonConfig,
  orderNumber: string
): Promise<EpsResult> {
  const fontDef = findFont(config.fontId);
  const size = findSize(config.sizeId);
  const color = findColor(config.colorId);
  const support = findSupport(config.supportId);
  const usage = findUsage(config.usageId);

  const font = await loadFont(fontDef.family);

  const lines = config.text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) throw new Error("El diseño no tiene texto.");

  // Tamaño de fuente (en pt) para que la altura de mayúscula sea la real pedida.
  const letterHeightPt = size.heightCm * PT_PER_CM;
  const fontSizePt = letterHeightPt / capHeightRatio(font);
  const lineHeightPt = letterHeightPt * LINE_GAP;

  // Composición glifo a glifo con kerning. Se evita `font.getPath()` a
  // propósito: su motor de features (ccmp/liga) falla con algunas tipografías
  // script, y aquí solo necesitamos posicionar caracteres latinos.
  const layoutLine = (line: string, x: number, y: number) => {
    const path = new Path();
    const scale = fontSizePt / font.unitsPerEm;
    let penX = x;
    let previous: Glyph | null = null;

    for (const char of [...line]) {
      const glyph = font.charToGlyph(char);
      if (previous) penX += font.getKerningValue(previous, glyph) * scale;
      path.extend(glyph.getPath(penX, y, fontSizePt));
      penX += (glyph.advanceWidth ?? 0) * scale;
      previous = glyph;
    }
    return { path, width: penX - x };
  };

  // Primera pasada: medir cada línea para poder centrarlas.
  const widths = lines.map((line) => layoutLine(line, 0, 0).width);
  const maxAdvance = Math.max(...widths);

  // Y crece hacia abajo en opentype; se invierte con la matriz del EPS.
  const paths: Path[] = lines.map(
    (line, i) =>
      layoutLine(line, (maxAdvance - widths[i]) / 2, letterHeightPt + i * lineHeightPt).path
  );

  // Caja REAL de la tinta: incluye ascendentes, descendentes y remates de las
  // fuentes script. Calcularla evita que el diseño se salga del documento.
  const ink = paths.reduce(
    (acc, path) => {
      const b = path.getBoundingBox();
      return {
        x1: Math.min(acc.x1, b.x1),
        y1: Math.min(acc.y1, b.y1),
        x2: Math.max(acc.x2, b.x2),
        y2: Math.max(acc.y2, b.y2),
      };
    },
    { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity }
  );

  const rawWidthPt = ink.x2 - ink.x1;
  const rawHeightPt = ink.y2 - ink.y1;

  // El rótulo no puede superar el ancho máximo del tamaño contratado
  // (p. ej. "Grande = hasta 100 cm"): si se pasa, se reduce todo el diseño.
  const maxWidthPt = size.maxWidthCm * PT_PER_CM;
  const fit = rawWidthPt > maxWidthPt ? maxWidthPt / rawWidthPt : 1;

  const inkWidthPt = rawWidthPt * fit;
  const inkHeightPt = rawHeightPt * fit;

  // Documento = diseño + 1 cm de margen por lado (manipulación/corte).
  const marginPt = 1 * PT_PER_CM;
  const widthPt = inkWidthPt + marginPt * 2;
  const heightPt = inkHeightPt + marginPt * 2;

  // --- PostScript ---
  const ps: string[] = [];
  const round = (n: number) => Math.round(n * 1000) / 1000;
  let cx = 0; // punto actual, para elevar cuadráticas a cúbicas
  let cy = 0;
  let open = false;

  for (const path of paths) {
    for (const cmd of path.commands) {
      switch (cmd.type) {
        case "M":
          // Esta fuente no emite cierres explícitos: cerramos el contorno anterior.
          if (open) ps.push("closepath");
          ps.push(`${round(cmd.x)} ${round(cmd.y)} moveto`);
          cx = cmd.x;
          cy = cmd.y;
          open = true;
          break;
        case "L":
          ps.push(`${round(cmd.x)} ${round(cmd.y)} lineto`);
          cx = cmd.x;
          cy = cmd.y;
          break;
        case "C":
          ps.push(
            `${round(cmd.x1)} ${round(cmd.y1)} ${round(cmd.x2)} ${round(cmd.y2)} ${round(cmd.x)} ${round(cmd.y)} curveto`
          );
          cx = cmd.x;
          cy = cmd.y;
          break;
        case "Q": {
          // PostScript no tiene curvas cuadráticas: se elevan a cúbicas.
          const c1x = cx + (2 / 3) * (cmd.x1 - cx);
          const c1y = cy + (2 / 3) * (cmd.y1 - cy);
          const c2x = cmd.x + (2 / 3) * (cmd.x1 - cmd.x);
          const c2y = cmd.y + (2 / 3) * (cmd.y1 - cmd.y);
          ps.push(
            `${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(cmd.x)} ${round(cmd.y)} curveto`
          );
          cx = cmd.x;
          cy = cmd.y;
          break;
        }
        case "Z":
          ps.push("closepath");
          open = false;
          break;
      }
    }
  }
  if (open) ps.push("closepath");

  const widthCm = Math.round((inkWidthPt / PT_PER_CM) * 10) / 10;
  const heightCm = Math.round((inkHeightPt / PT_PER_CM) * 10) / 10;
  const now = new Date().toISOString().slice(0, 10);

  const content = `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: Neon Led Spain
%%Title: ${orderNumber} - ${config.text.replace(/\n/g, " / ")}
%%CreationDate: ${now}
%%BoundingBox: 0 0 ${Math.ceil(widthPt)} ${Math.ceil(heightPt)}
%%HiResBoundingBox: 0 0 ${round(widthPt)} ${round(heightPt)}
%%DocumentData: Clean7Bit
%%LanguageLevel: 2
%%EndComments
%%BeginProlog
% ---------------------------------------------------------------
% FICHA DE PRODUCCION
%   Pedido .......: ${orderNumber}
%   Texto ........: ${config.text.replace(/\n/g, " | ")}
%   Tipografia ...: ${fontDef.label} (${fontDef.family})
%   Color ........: ${color.label}
%   Tamano .......: ${size.label} - ancho maximo ${size.maxWidthCm} cm
%   Altura letra .: ${Math.round(size.heightCm * fit * 10) / 10} cm (mayuscula)${
    fit < 1 ? `  [reducida desde ${size.heightCm} cm para no pasar de ${size.maxWidthCm} cm de ancho]` : ""
  }
%   Medidas reales: ${widthCm} x ${heightCm} cm (diseno, sin margen)
%   Margen .......: 1 cm por lado
%   Soporte ......: ${support.label}
%   Uso ..........: ${usage.label}
%   Lineas .......: ${lines.length}
%   Unidades .....: 1 pt = 1/72 pulgada. Documento a TAMANO REAL.
%   Texto trazado (curvas): no requiere la fuente instalada.
% ---------------------------------------------------------------
%%EndProlog
gsave
% Encaja la tinta del diseno dentro del margen e invierte el eje Y
% (opentype trabaja con Y hacia abajo; PostScript, hacia arriba).
${round(marginPt - ink.x1 * fit)} ${round(heightPt - marginPt + ink.y1 * fit)} translate
${round(fit)} ${round(-fit)} scale
newpath
${ps.join("\n")}
0 setgray
eofill
grestore
showpage
%%EOF
`;

  const safeText = config.text
    .replace(/\n/g, "-")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);

  return {
    content,
    fileName: `${orderNumber}-${safeText || "neon"}-${size.heightCm}cm.eps`,
    widthCm,
    heightCm,
  };
}

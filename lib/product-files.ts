import "server-only";

import { randomUUID } from "node:crypto";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Archivo original del diseño de un producto (el que va a taller).
 *
 * Ojo con la separación: el **dibujo que se ve en la tienda** vive en la BD
 * como SVG saneado (`Product.svgMarkup`, unos pocos KB), porque el efecto de
 * neón necesita SVG en línea. Aquí solo se guarda el **archivo de producción**
 * tal cual lo subió el admin —normalmente un EPS de Illustrator—, que no se
 * puede renderizar en web pero sí hace falta para fabricar.
 */

export const PRODUCT_BUCKET = "productos";
export const MAX_SOURCE_BYTES = 12 * 1024 * 1024; // 12 MB

/** Un EPS no lleva un MIME fiable, así que también se acepta por extensión. */
const EXT_BY_TYPE: Record<string, string> = {
  "image/svg+xml": "svg",
  "application/postscript": "eps",
  "application/eps": "eps",
  "application/x-eps": "eps",
  "image/eps": "eps",
  "application/illustrator": "ai",
  "application/pdf": "pdf",
};

const ALLOWED_EXT = new Set(["svg", "eps", "ai", "pdf"]);

export function sourceExtension(file: File): string | null {
  const byType = EXT_BY_TYPE[file.type];
  if (byType) return byType;
  const byName = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXT.has(byName) ? byName : null;
}

/** Sube el archivo de producción y devuelve su URL pública. */
export async function uploadProductSource(file: File): Promise<string | null> {
  const ext = sourceExtension(file);
  if (!ext || file.size > MAX_SOURCE_BYTES) return null;

  const supabase = createSupabaseServer();
  const path = `${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "31536000",
  });
  if (error) {
    console.error("Error subiendo el archivo de producción:", error.message);
    return null;
  }
  return supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Borra el archivo asociado a un producto eliminado. Si falla no se propaga:
 * el producto ya no existe y dejar un huérfano en Storage es preferible a que
 * el borrado reviente a medias.
 */
export async function deleteProductSource(url: string | null): Promise<void> {
  if (!url) return;
  const path = url.split(`/${PRODUCT_BUCKET}/`)[1]?.split("?")[0];
  if (!path) return;

  try {
    const supabase = createSupabaseServer();
    await supabase.storage.from(PRODUCT_BUCKET).remove([path]);
  } catch (e) {
    console.error("No se pudo borrar el archivo de producción:", e);
  }
}

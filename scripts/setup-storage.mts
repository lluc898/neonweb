/**
 * Crea el bucket de Supabase Storage para las imágenes de diseño a medida.
 * Idempotente: si el bucket ya existe, no hace nada.
 * Ejecutar una vez por entorno:  npx tsx scripts/setup-storage.mts
 */
import "dotenv/config";
import { createSupabaseServer } from "../lib/supabase/server";

const BUCKET = "disenos";

const supabase = createSupabaseServer();

const { data: buckets, error: listError } = await supabase.storage.listBuckets();
if (listError) throw listError;

if (buckets.some((b) => b.name === BUCKET)) {
  console.log(`✓ El bucket "${BUCKET}" ya existe.`);
} else {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true, // URLs públicas (rutas con uuid, no adivinables)
    fileSizeLimit: "6MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  });
  if (error) throw error;
  console.log(`✓ Bucket "${BUCKET}" creado.`);
}

/**
 * Crea los buckets de Supabase Storage que usa la web.
 * Idempotente: los que ya existen se dejan como están.
 * Ejecutar una vez por entorno:  npx tsx scripts/setup-storage.mts
 */
import "dotenv/config";
import { createSupabaseServer } from "../lib/supabase/server";

type BucketSpec = {
  name: string;
  what: string;
  fileSizeLimit: string;
  /** null = sin restricción de MIME (los EPS llegan con tipos poco fiables). */
  allowedMimeTypes: string[] | null;
};

const BUCKETS: BucketSpec[] = [
  {
    name: "disenos",
    what: "imágenes que suben los clientes en /diseno-a-medida",
    fileSizeLimit: "6MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  },
  {
    name: "productos",
    what: "archivo de producción (EPS/SVG/AI) de los productos del catálogo",
    fileSizeLimit: "12MB",
    // Un EPS puede llegar como application/postscript, octet-stream o vacío:
    // filtrar por MIME aquí rechazaría archivos válidos. La validación real
    // (extensión + tamaño) está en lib/product-files.ts.
    allowedMimeTypes: null,
  },
];

const supabase = createSupabaseServer();

const { data: existing, error: listError } = await supabase.storage.listBuckets();
if (listError) throw listError;

for (const spec of BUCKETS) {
  if (existing.some((b) => b.name === spec.name)) {
    console.log(`✓ El bucket "${spec.name}" ya existe.`);
    continue;
  }
  const { error } = await supabase.storage.createBucket(spec.name, {
    public: true, // URLs públicas con uuid: no adivinables
    fileSizeLimit: spec.fileSizeLimit,
    ...(spec.allowedMimeTypes ? { allowedMimeTypes: spec.allowedMimeTypes } : {}),
  });
  if (error) throw error;
  console.log(`✓ Bucket "${spec.name}" creado — ${spec.what}.`);
}

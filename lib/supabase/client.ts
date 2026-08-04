import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el NAVEGADOR (auth de clientes, subidas a Storage).
 * Usa la clave anónima (pública, protegida por Row Level Security).
 */
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno."
    );
  }

  return createClient(url, anonKey);
}

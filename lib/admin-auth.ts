import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Autenticación del panel de administración (v1).
 * Sesión = cookie httpOnly con un token HMAC derivado de ADMIN_PASSWORD.
 * Suficiente para un solo admin sin cuentas; cuando activemos Supabase Auth
 * con roles, esta capa se sustituye por la comprobación de rol ADMIN.
 */

export const ADMIN_COOKIE = "nls_admin";

function secret(): string {
  const s = process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("Falta ADMIN_PASSWORD en el entorno.");
  return s;
}

/** Token de sesión determinista derivado de la contraseña. */
export function sessionToken(): string {
  return createHmac("sha256", secret()).update("nls-admin-session-v1").digest("hex");
}

export function passwordMatches(input: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(secret());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  try {
    const jar = await cookies();
    const value = jar.get(ADMIN_COOKIE)?.value;
    return value === sessionToken();
  } catch {
    return false;
  }
}

/** Llamar al inicio de cada página/acción de admin. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

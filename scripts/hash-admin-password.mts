/**
 * Genera el hash scrypt de la contraseña del admin para ADMIN_PASSWORD_HASH.
 * Uso:  npx tsx scripts/hash-admin-password.mts "mi-contraseña"
 * Pega el resultado en .env (y elimina cualquier ADMIN_PASSWORD en claro).
 */
import { hashPassword } from "../lib/password";

const password = process.argv[2];
if (!password) {
  console.error('Uso: npx tsx scripts/hash-admin-password.mts "tu-contraseña"');
  process.exit(1);
}

console.log(`ADMIN_PASSWORD_HASH="${await hashPassword(password)}"`);

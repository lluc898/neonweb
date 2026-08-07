import {
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

// promisify() pierde la sobrecarga con opciones de scrypt; wrapper manual.
function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, keylen, options, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  );
}

/**
 * Hashing de contraseñas con scrypt (KDF memory-hard de Node, sin dependencias).
 * Formato: `scrypt:N:r:p:salt:hash` con salt/hash en base64url.
 * OJO: separador `:` (no `$`) — el loader de .env de Next expande `$var` y
 * corrompería el valor.
 * Módulo puro (sin imports de Next) para poder usarlo también desde scripts.
 */

export async function hashPassword(password: string): Promise<string> {
  const N = 16384, r = 8, p = 1;
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64, { N, r, p, maxmem: 128 * 1024 * 1024 })) as Buffer;
  return `scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, nStr, rStr, pStr, saltB64, hashB64] = stored.split(":");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(hashB64, "base64url");
    const key = (await scrypt(password, salt, expected.length, {
      N: Number(nStr), r: Number(rStr), p: Number(pStr), maxmem: 128 * 1024 * 1024,
    })) as Buffer;
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

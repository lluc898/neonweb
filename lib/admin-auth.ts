import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import * as OTPAuth from "otpauth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { AdminSession, AdminUser } from "@/lib/generated/prisma/client";

/**
 * Seguridad del panel de administración (multi-usuario).
 *
 * - Cada trabajador tiene su usuario, contraseña (scrypt) y su PROPIO 2FA TOTP.
 * - 2FA obligatorio: el primer login crea una sesión "pendiente" que solo
 *   permite completar el alta del 2FA; hasta confirmarlo no se entra al panel.
 * - Sesiones en BD (token aleatorio; solo se guarda su SHA-256), revocables.
 * - Rate-limiting persistido por IP + global, con auditoría de intentos.
 * - El superadmin (usuario `admin`) gestiona el resto de usuarios.
 */

export const ADMIN_COOKIE = "nls_admin_session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 h
const MAX_FAILED_PER_IP = 5;
const MAX_FAILED_GLOBAL = 20;
const WINDOW_MS = 1000 * 60 * 15; // 15 min

export type SessionWithUser = AdminSession & { user: AdminUser };

// ------------------------------------------------------------------ TOTP

function buildTotp(secretB32: string, username: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: "Neon Led Spain",
    label: username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretB32),
  });
}

/** Genera (o reutiliza) el secreto pendiente del usuario y devuelve el URI para el QR. */
export async function beginTotpEnrollment(
  user: AdminUser
): Promise<{ secret: string; uri: string }> {
  let secret = user.totpPendingSecret;
  if (!secret) {
    secret = new OTPAuth.Secret({ size: 20 }).base32;
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { totpPendingSecret: secret },
    });
  }
  return { secret, uri: buildTotp(secret, user.username).toString() };
}

/** Confirma el alta del 2FA y promociona la sesión pendiente a completa. */
export async function confirmTotpEnrollment(
  session: SessionWithUser,
  code: string
): Promise<boolean> {
  const pending = session.user.totpPendingSecret;
  if (!pending) return false;
  const delta = buildTotp(pending, session.user.username).validate({
    token: code.trim(),
    window: 1,
  });
  if (delta === null) return false;

  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: {
      totpSecret: pending,
      totpPendingSecret: null,
      totpLastStep: Math.floor(Date.now() / 30_000) + delta,
    },
  });
  await prisma.adminSession.update({
    where: { id: session.id },
    data: { pendingTotp: false },
  });
  return true;
}

/** Verifica un código TOTP del usuario, con anti-replay por time-step. */
async function verifyUserTotp(user: AdminUser, code: string): Promise<boolean> {
  if (!user.totpSecret) return false;
  const delta = buildTotp(user.totpSecret, user.username).validate({
    token: code.trim(),
    window: 1,
  });
  if (delta === null) return false;

  const step = Math.floor(Date.now() / 30_000) + delta;
  if (step <= user.totpLastStep) return false; // código ya consumido
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { totpLastStep: step },
  });
  return true;
}

// ------------------------------------------------------------ Rate limit

export async function getClientMeta(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  return { ip, userAgent: (h.get("user-agent") ?? "").slice(0, 250) };
}

export async function isLockedOut(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byIp, global] = await Promise.all([
    prisma.adminLoginAttempt.count({ where: { ip, success: false, createdAt: { gte: since } } }),
    prisma.adminLoginAttempt.count({ where: { success: false, createdAt: { gte: since } } }),
  ]);
  return byIp >= MAX_FAILED_PER_IP || global >= MAX_FAILED_GLOBAL;
}

export async function recordLoginAttempt(ip: string, success: boolean): Promise<void> {
  await prisma.adminLoginAttempt.create({ data: { ip, success } });
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  await prisma.adminLoginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => {});
}

// -------------------------------------------------------------- Sesiones

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function createSession(
  userId: string,
  pendingTotp: boolean,
  meta: { ip: string; userAgent: string }
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      pendingTotp,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
  return token;
}

/** Sesión válida (pendiente de 2FA o completa), con su usuario. */
export async function getSession(): Promise<SessionWithUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(ADMIN_COOKIE)?.value;
    if (!token) return null;
    const session = await prisma.adminSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date() || !session.user.active) return null;
    prisma.adminSession
      .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
    return session;
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const s = await getSession();
  return s !== null && !s.pendingTotp;
}

/**
 * Exige sesión completa. Sin sesión → login; con 2FA pendiente → activación.
 * Devuelve la sesión (con usuario) para que la página la use.
 */
export async function requireAdmin(): Promise<SessionWithUser> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.pendingTotp) redirect("/admin/activar-2fa");
  return session;
}

/** Exige además ser superadmin (gestión de usuarios). */
export async function requireSuperadmin(): Promise<SessionWithUser> {
  const session = await requireAdmin();
  if (!session.user.isSuperadmin) redirect("/admin");
  return session;
}

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  jar.delete(ADMIN_COOKIE);
}

export async function destroyAllSessions(): Promise<number> {
  const { count } = await prisma.adminSession.deleteMany({});
  return count;
}

export async function listSessions() {
  return prisma.adminSession.findMany({
    include: { user: { select: { username: true } } },
    orderBy: { lastUsedAt: "desc" },
  });
}

// ------------------------------------------------------- Login completo

export type LoginResult =
  | "ok"
  | "enroll" // credenciales válidas pero falta configurar el 2FA
  | "locked"
  | "bad-credentials"
  | "totp-required"
  | "bad-totp";

export async function performLogin(
  username: string,
  password: string,
  totpCode: string
): Promise<LoginResult> {
  const meta = await getClientMeta();
  if (await isLockedOut(meta.ip)) return "locked";

  const user = await prisma.adminUser.findUnique({ where: { username: username.trim() } });

  // Verificación en tiempo ~constante aunque el usuario no exista
  // (evita enumerar usuarios midiendo tiempos de respuesta).
  const DUMMY_HASH =
    "scrypt:16384:8:1:AAAAAAAAAAAAAAAAAAAAAA:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.active || !passwordOk) {
    await recordLoginAttempt(meta.ip, false);
    return "bad-credentials";
  }

  // ¿2FA ya configurado? → exigir código. ¿No? → sesión pendiente para el alta.
  if (user.totpSecret) {
    if (!totpCode.trim()) return "totp-required";
    if (!(await verifyUserTotp(user, totpCode))) {
      await recordLoginAttempt(meta.ip, false);
      return "bad-totp";
    }
  }

  await recordLoginAttempt(meta.ip, true);
  const pending = !user.totpSecret;
  const token = await createSession(user.id, pending, meta);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/admin",
  });
  return pending ? "enroll" : "ok";
}

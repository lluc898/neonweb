"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  confirmTotpEnrollment,
  destroyAllSessions,
  destroyCurrentSession,
  getSession,
  performLogin,
  requireAdmin,
  requireSuperadmin,
} from "@/lib/admin-auth";
import { hashPassword } from "@/lib/password";
import type { OrderStatus, RequestStatus } from "@/lib/generated/prisma/enums";

// ------------------------------------------------------------------ Sesión

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const totp = String(formData.get("totp") ?? "");

  const result = await performLogin(username, password, totp);
  if (result === "ok") redirect("/admin");
  if (result === "enroll") redirect("/admin/activar-2fa");
  redirect(`/admin/login?error=${result}`);
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/admin/login");
}

/** Cierra TODAS las sesiones de todos los usuarios (pánico). Solo superadmin. */
export async function logoutEverywhereAction() {
  await requireSuperadmin();
  await destroyAllSessions();
  await destroyCurrentSession();
  redirect("/admin/login");
}

/** Confirma la activación del 2FA (primer login) con un código del móvil. */
export async function confirmTotpAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const code = String(formData.get("code") ?? "");
  const ok = await confirmTotpEnrollment(session, code);
  redirect(ok ? "/admin" : "/admin/activar-2fa?error=code");
}

// ------------------------------------------------- Gestión de usuarios

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

export async function createUserAction(formData: FormData) {
  await requireSuperadmin();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!USERNAME_RE.test(username)) redirect("/admin/usuarios?error=username");
  if (password.length < 10) redirect("/admin/usuarios?error=password");

  const exists = await prisma.adminUser.findUnique({ where: { username } });
  if (exists) redirect("/admin/usuarios?error=exists");

  await prisma.adminUser.create({
    data: { username, passwordHash: await hashPassword(password) },
  });
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=created");
}

export async function setUserActiveAction(formData: FormData) {
  const session = await requireSuperadmin();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return;
  // Nadie desactiva al superadmin ni a sí mismo.
  if (target.isSuperadmin || target.id === session.user.id) return;

  await prisma.adminUser.update({ where: { id }, data: { active } });
  if (!active) {
    await prisma.adminSession.deleteMany({ where: { userId: id } });
  }
  revalidatePath("/admin/usuarios");
}

/** Resetea la contraseña de un usuario (y cierra sus sesiones). */
export async function resetUserPasswordAction(formData: FormData) {
  await requireSuperadmin();
  const id = String(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) redirect("/admin/usuarios?error=password");

  await prisma.adminUser.update({
    where: { id },
    data: { passwordHash: await hashPassword(password) },
  });
  await prisma.adminSession.deleteMany({ where: { userId: id } });
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=password");
}

/** Resetea el 2FA (móvil perdido): el usuario lo reconfigura en su próximo login. */
export async function resetUserTotpAction(formData: FormData) {
  await requireSuperadmin();
  const id = String(formData.get("id"));

  await prisma.adminUser.update({
    where: { id },
    data: { totpSecret: null, totpPendingSecret: null, totpLastStep: 0 },
  });
  await prisma.adminSession.deleteMany({ where: { userId: id } });
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=totp");
}

// --------------------------------------------------------------- Productos

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const priceEuros = Number(formData.get("price"));
  const active = formData.get("active") === "on";

  if (!id || !Number.isFinite(priceEuros) || priceEuros < 0) return;

  await prisma.product.update({
    where: { id },
    data: { priceCents: Math.round(priceEuros * 100), active },
  });

  revalidatePath("/productos");
  revalidatePath("/admin/productos");
}

// ------------------------------------------------------- Reglas de precio

export async function updatePricingRuleAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (!id) return;

  const rule = await prisma.pricingRule.findUnique({ where: { id } });
  if (!rule) return;

  const data: {
    amountCents?: number;
    multiplier?: number;
    meta?: object;
  } = {};

  const amountEuros = Number(formData.get("amount"));
  if (Number.isFinite(amountEuros) && amountEuros >= 0) {
    data.amountCents = Math.round(amountEuros * 100);
  }

  const multiplier = Number(formData.get("multiplier"));
  if (Number.isFinite(multiplier) && multiplier > 0) {
    data.multiplier = multiplier;
  }

  // Campos de meta numéricos (geometría de tamaños, potencia W/m).
  const metaFields = ["heightCm", "charWidthCm", "tubePerCharM", "wattsPerM", "wattsPerMRgb"] as const;
  const metaUpdates: Record<string, number> = {};
  for (const field of metaFields) {
    const value = Number(formData.get(field));
    if (formData.has(field) && Number.isFinite(value) && value > 0) {
      metaUpdates[field] = value;
    }
  }
  if (Object.keys(metaUpdates).length) {
    const meta = (rule.meta ?? {}) as Record<string, unknown>;
    data.meta = { ...meta, ...metaUpdates };
  }

  await prisma.pricingRule.update({ where: { id }, data });

  revalidatePath("/personalizar");
  revalidatePath("/admin/precios");
}

// ----------------------------------------------------------------- Pedidos

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  const valid = ["NEW", "IN_PRODUCTION", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!id || !valid.includes(status)) return;

  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/pedidos");
}

// ------------------------------------------------- Solicitudes a medida

export async function updateRequestStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as RequestStatus;
  const valid = ["NEW", "QUOTED", "ACCEPTED", "REJECTED"];
  if (!id || !valid.includes(status)) return;

  const quoteEuros = Number(formData.get("quote"));
  await prisma.customRequest.update({
    where: { id },
    data: {
      status,
      ...(Number.isFinite(quoteEuros) && quoteEuros > 0
        ? { quoteCents: Math.round(quoteEuros * 100) }
        : {}),
    },
  });
  revalidatePath("/admin/solicitudes");
}

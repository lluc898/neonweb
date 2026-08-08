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
import { TRUSTPILOT_SETTING_KEY, parseTrustpilot } from "@/lib/trustpilot";
import { NEON_FONTS } from "@/lib/neon-options";
import { neonSvgMarkup, sanitizeSvg, suggestedStroke } from "@/lib/svg-neon";
import { deleteProductSource, uploadProductSource } from "@/lib/product-files";
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

// ------------------------------------------------- Alta y baja de productos

/** slug legible a partir del nombre: "Better Together" → "better-together". */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // fuera acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Añade -2, -3… hasta encontrar un slug libre. */
async function uniqueSlug(base: string): Promise<string> {
  const root = base || "producto";
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? root : `${root}-${n}`;
    if (!(await prisma.product.findUnique({ where: { slug } }))) return slug;
  }
  return `${root}-${Date.now()}`;
}

const NUEVO = "/admin/productos/nuevo";

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim().slice(0, 500);
  const categoryId = String(formData.get("categoryId") ?? "");
  const priceEuros = Number(formData.get("price"));
  const color = String(formData.get("color") ?? "").trim();
  const design = String(formData.get("design") ?? "TEXT") === "SVG" ? "SVG" : "TEXT";
  const active = formData.get("active") === "on";

  if (name.length < 2) redirect(`${NUEVO}?error=nombre`);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) redirect(`${NUEVO}?error=color`);
  if (!Number.isFinite(priceEuros) || priceEuros <= 0) redirect(`${NUEVO}?error=precio`);
  if (!(await prisma.category.findUnique({ where: { id: categoryId } }))) {
    redirect(`${NUEVO}?error=categoria`);
  }

  const data: Parameters<typeof prisma.product.create>[0]["data"] = {
    slug: await uniqueSlug(slugify(name)),
    name,
    description,
    categoryId,
    priceCents: Math.round(priceEuros * 100),
    color,
    active,
    design,
  };

  if (design === "SVG") {
    // El SVG se sanea AQUÍ aunque el navegador ya lo hiciera para la vista
    // previa: lo que llega por formulario nunca es de fiar y este markup
    // acaba inyectado en la tienda.
    const result = sanitizeSvg(String(formData.get("svg") ?? ""));
    if (!result.ok) redirect(`${NUEVO}?error=svg-${result.error}`);

    const stroke = Number(formData.get("svgStroke"));
    data.svgMarkup = neonSvgMarkup(result.svg);
    data.svgStroke =
      Number.isFinite(stroke) && stroke > 0 ? stroke : suggestedStroke(result.svg.viewBox);

    // El archivo original (SVG o EPS) se guarda aparte: es el que va a taller.
    const file = formData.get("sourceFile");
    if (file instanceof File && file.size > 0) {
      data.sourceFileUrl = await uploadProductSource(file);
    }
  } else {
    const designText = String(formData.get("designText") ?? "").trim().slice(0, 60);
    const fontId = String(formData.get("fontId") ?? "");
    const symbol = String(formData.get("symbol") ?? "").trim().slice(0, 8);

    data.designText = designText || null;
    data.fontId = NEON_FONTS.some((f) => f.id === fontId) ? fontId : NEON_FONTS[0].id;
    data.symbol = symbol || null;
  }

  const product = await prisma.product.create({ data });

  revalidatePath("/productos");
  revalidatePath("/");
  revalidatePath("/admin/productos");
  redirect(`/admin/productos?ok=creado&slug=${product.slug}`);
}

/**
 * Borra un producto. Si aparece en algún pedido NO se borra: se perdería la
 * trazabilidad de lo vendido (la relación es opcional, así que Prisma pondría
 * el productId a null en silencio). En ese caso se ofrece ocultarlo.
 */
export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (!id) return;

  const orderLines = await prisma.orderItem.count({ where: { productId: id } });
  if (orderLines > 0) redirect(`/admin/productos?error=en-pedidos&n=${orderLines}`);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) redirect("/admin/productos?error=no-existe");

  await prisma.product.delete({ where: { id } });
  await deleteProductSource(product.sourceFileUrl);

  revalidatePath("/productos");
  revalidatePath("/");
  revalidatePath("/admin/productos");
  redirect("/admin/productos?ok=borrado");
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

// -------------------------------------------------------------- Trustpilot

/**
 * Trustpilot no se puede sincronizar (403 a los bots), así que la nota se
 * copia a mano desde la ficha real. Se guarda en `SiteSetting` y se revalida
 * toda la tienda porque la insignia también vive en el footer (layout).
 */
export async function updateTrustpilotAction(formData: FormData) {
  await requireAdmin();

  const score = Number(String(formData.get("score") ?? "").replace(",", "."));
  const reviews = Number(formData.get("reviews"));
  const url = String(formData.get("url") ?? "").trim();
  const visible = formData.get("visible") === "on";

  if (!Number.isFinite(score) || score < 0 || score > 5) {
    redirect("/admin/trustpilot?error=score");
  }
  if (!Number.isFinite(reviews) || reviews < 0) {
    redirect("/admin/trustpilot?error=reviews");
  }
  if (!/^https:\/\/(www\.|es\.)?trustpilot\.com\//.test(url)) {
    redirect("/admin/trustpilot?error=url");
  }

  const value = parseTrustpilot({ score, reviews, url, visible });

  await prisma.siteSetting.upsert({
    where: { key: TRUSTPILOT_SETTING_KEY },
    create: { key: TRUSTPILOT_SETTING_KEY, value },
    update: { value },
  });

  revalidatePath("/", "layout");
  redirect("/admin/trustpilot?ok=1");
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

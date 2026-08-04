"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  passwordMatches,
  requireAdmin,
  sessionToken,
} from "@/lib/admin-auth";
import type { OrderStatus, RequestStatus } from "@/lib/generated/prisma/enums";

// ------------------------------------------------------------------ Sesión

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    redirect("/admin/login?error=1");
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
  });
  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
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

  const amountEuros = Number(formData.get("amount"));
  const data: {
    amountCents?: number;
    multiplier?: number;
    meta?: object;
  } = {};

  if (Number.isFinite(amountEuros) && amountEuros >= 0) {
    data.amountCents = Math.round(amountEuros * 100);
  }

  const multiplier = Number(formData.get("multiplier"));
  if (Number.isFinite(multiplier) && multiplier > 0) {
    data.multiplier = multiplier;
  }

  // Recargo por carácter extra (solo tamaños).
  const perExtraChar = Number(formData.get("perExtraChar"));
  if (rule.group === "SIZE" && Number.isFinite(perExtraChar) && perExtraChar >= 0) {
    const meta = (rule.meta ?? {}) as Record<string, unknown>;
    data.meta = { ...meta, perExtraCharCents: Math.round(perExtraChar * 100) };
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

import "server-only";

import { prisma } from "@/lib/prisma";
import { getConfiguratorOptions } from "@/lib/catalog";
import {
  calcPrice,
  calcProductPrice,
  DEFAULT_PRODUCT_OPTIONS,
  type PriceBreakdown,
  type ProductPriceBreakdown,
} from "@/lib/pricing";
import {
  DEFAULT_CONFIG,
  NEON_COLORS,
  NEON_FONTS,
  type NeonConfig,
} from "@/lib/neon-options";
import { PRODUCT_SIZES } from "@/lib/products";

/**
 * Revalidación de precios EN SERVIDOR (regla de oro del proyecto: el cliente
 * nunca fija el precio). Recibe el carrito tal cual llega del navegador,
 * ignora los importes que trae y recalcula todo con las reglas de la BD.
 */

/** Lo que manda el navegador (sin confiar en ningún importe). */
export type IncomingItem =
  | { type: "custom"; config: Partial<NeonConfig> }
  | {
      type: "product";
      slug: string;
      color?: string;
      colorId?: string;
      sizeId?: string;
      supportId?: string;
      usageId?: string;
    };

export type PricedItem = {
  kind: "CUSTOM" | "PRODUCT";
  name: string;
  priceCents: number;
  productId?: string;
  customization?: NeonConfig & { colorHex?: string };
  breakdown?: PriceBreakdown | ProductPriceBreakdown;
};

export type ShippingRates = {
  costCents: number;
  freeFromCents: number;
};

export async function getShippingRates(): Promise<ShippingRates> {
  const fallback: ShippingRates = { costCents: 990, freeFromCents: 20000 };
  try {
    const rules = await prisma.pricingRule.findMany({ where: { group: "SHIPPING" } });
    const get = (code: string, def: number) =>
      rules.find((r) => r.code === code)?.amountCents ?? def;
    return {
      costCents: get("cost", fallback.costCents),
      freeFromCents: get("free_from", fallback.freeFromCents),
    };
  } catch {
    return fallback;
  }
}

export function shippingFor(subtotalCents: number, rates: ShippingRates): number {
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= rates.freeFromCents ? 0 : rates.costCents;
}

/** Normaliza una configuración recibida contra las opciones válidas. */
function sanitizeConfig(
  raw: Partial<NeonConfig>,
  valid: { sizes: string[]; supports: string[]; usages: string[]; deliveries: string[] }
): NeonConfig {
  const pick = (value: unknown, allowed: string[], fallback: string) =>
    typeof value === "string" && allowed.includes(value) ? value : fallback;

  return {
    text: String(raw.text ?? "").slice(0, 40),
    fontId: pick(raw.fontId, NEON_FONTS.map((f) => f.id), DEFAULT_CONFIG.fontId),
    colorId: pick(raw.colorId, NEON_COLORS.map((c) => c.id), DEFAULT_CONFIG.colorId),
    sizeId: pick(raw.sizeId, valid.sizes, valid.sizes[0] ?? DEFAULT_CONFIG.sizeId),
    supportId: pick(raw.supportId, valid.supports, valid.supports[0] ?? DEFAULT_CONFIG.supportId),
    usageId: pick(raw.usageId, valid.usages, valid.usages[0] ?? DEFAULT_CONFIG.usageId),
    deliveryId: pick(raw.deliveryId, valid.deliveries, valid.deliveries[0] ?? DEFAULT_CONFIG.deliveryId),
    backdropId: DEFAULT_CONFIG.backdropId, // solo afecta a la vista previa
  };
}

export type PricedCart = {
  items: PricedItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

export async function priceCart(incoming: IncomingItem[]): Promise<PricedCart> {
  const options = await getConfiguratorOptions();
  const valid = {
    sizes: options.sizes.map((s) => s.id),
    supports: options.supports.map((s) => s.id),
    usages: options.usages.map((u) => u.id),
    deliveries: options.deliveries.map((d) => d.id),
  };

  const items: PricedItem[] = [];

  for (const raw of incoming.slice(0, 20)) {
    if (raw?.type === "custom") {
      const config = sanitizeConfig(raw.config ?? {}, valid);
      if (!config.text.trim()) continue; // sin texto no hay neón
      const breakdown = calcPrice(config, options);
      const colorHex = NEON_COLORS.find((c) => c.id === config.colorId)?.hex;
      items.push({
        kind: "CUSTOM",
        name: `Neón personalizado “${config.text.replace(/\n/g, " ").trim()}”`,
        priceCents: breakdown.total * 100,
        customization: { ...config, colorHex },
        breakdown,
      });
      continue;
    }

    if (raw?.type === "product" && typeof raw.slug === "string") {
      const product = await prisma.product.findUnique({ where: { slug: raw.slug } });
      if (!product || !product.active) continue;

      // El precio base sale SIEMPRE de la BD; del navegador solo se aceptan
      // las opciones, y saneadas contra las válidas.
      const pick = (value: unknown, allowed: string[], fallback: string) =>
        typeof value === "string" && allowed.includes(value) ? value : fallback;

      const size = PRODUCT_SIZES.find((s) => s.id === raw.sizeId) ?? PRODUCT_SIZES[1];
      const colorId = pick(
        // Carritos antiguos solo guardaban el hex: se traduce a su id.
        raw.colorId ??
          NEON_COLORS.find((c) => c.hex.toLowerCase() === String(raw.color).toLowerCase())?.id,
        NEON_COLORS.map((c) => c.id),
        DEFAULT_CONFIG.colorId
      );
      const supportId = pick(raw.supportId, valid.supports, DEFAULT_PRODUCT_OPTIONS.supportId);
      const usageId = pick(raw.usageId, valid.usages, DEFAULT_PRODUCT_OPTIONS.usageId);

      const breakdown = calcProductPrice(
        product.priceCents / 100,
        { colorId, sizeId: size.id, supportId, usageId },
        options
      );

      items.push({
        kind: "PRODUCT",
        name: product.name,
        priceCents: Math.round(breakdown.total * 100),
        productId: product.id,
        customization: {
          ...DEFAULT_CONFIG,
          text: product.name,
          sizeId: size.id,
          supportId,
          usageId,
          colorId,
          colorHex: NEON_COLORS.find((c) => c.id === colorId)?.hex ?? product.color,
        },
        breakdown,
      });
    }
  }

  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents, 0);
  const rates = await getShippingRates();
  const shippingCents = shippingFor(subtotalCents, rates);

  return {
    items,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}

/** Genera la referencia legible del pedido: NLS-2026-0001. */
export async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
  });
  return `NLS-${year}-${String(count + 1).padStart(4, "0")}`;
}

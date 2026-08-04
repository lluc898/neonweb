/**
 * Motor de precios del neón personalizado.
 * Función PURA: se usa tanto en cliente (preview de precio en vivo) como en
 * servidor (validación real antes de pagar). El cliente nunca fija el precio final.
 *
 * NOTA: de momento las reglas viven aquí como constantes por defecto. Cuando exista
 * el admin, estas mismas reglas se cargarán desde la BD (tabla PricingRule) y esta
 * función recibirá esos valores como parámetro.
 */

import {
  NEON_SIZES,
  NEON_SUPPORTS,
  NEON_USAGES,
  type NeonConfig,
  type NeonSize,
  type NeonSupport,
  type NeonUsage,
} from "@/lib/neon-options";

/** Reglas de precio activas (por defecto las constantes; en producción, la BD). */
export type PricingOptions = {
  sizes: NeonSize[];
  supports: NeonSupport[];
  usages: NeonUsage[];
};

export const DEFAULT_PRICING: PricingOptions = {
  sizes: NEON_SIZES,
  supports: NEON_SUPPORTS,
  usages: NEON_USAGES,
};

export type PriceBreakdown = {
  base: number;
  charsExtra: number;
  extraChars: number;
  support: number;
  subtotal: number;
  usageMultiplier: number;
  /** Precio final con IVA incluido (redondeado). */
  total: number;
};

/** Cuenta caracteres significativos (sin espacios ni saltos de línea). */
export function countChars(text: string): number {
  return text.replace(/\s/g, "").length;
}

export function calcPrice(
  config: Pick<NeonConfig, "text" | "sizeId" | "supportId" | "usageId">,
  options: PricingOptions = DEFAULT_PRICING
): PriceBreakdown {
  const size = options.sizes.find((s) => s.id === config.sizeId) ?? options.sizes[0];
  const support =
    options.supports.find((s) => s.id === config.supportId) ?? options.supports[0];
  const usage = options.usages.find((u) => u.id === config.usageId) ?? options.usages[0];

  const chars = countChars(config.text);
  const extraChars = Math.max(0, chars - size.includedChars);
  const charsExtra = extraChars * size.perExtraChar;

  const subtotal = size.basePrice + charsExtra + support.extraPrice;
  const total = Math.round(subtotal * usage.multiplier);

  return {
    base: size.basePrice,
    charsExtra,
    extraChars,
    support: support.extraPrice,
    subtotal,
    usageMultiplier: usage.multiplier,
    total,
  };
}

/** Formatea un importe en euros (es-ES). */
export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

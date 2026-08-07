/**
 * Motor de precios del neón personalizado (v2 — fórmula del fabricante).
 * Función PURA: se usa tanto en cliente (preview de precio en vivo) como en
 * servidor (validación real antes de pagar). El cliente nunca fija el precio final.
 *
 * Cálculo según indicaciones del fabricante:
 *   precio = metros de tubo × €/m  +  m² de material × €/m²  (+ RGB, soporte)
 *            × uso (exterior)  × entrega (express 24/48 h con plus)
 *   con pedido mínimo. La potencia (W) se estima de los metros de tubo.
 *
 * Las tarifas por defecto viven en lib/neon-options.ts; en producción se
 * cargan de la BD (PricingRule, editables desde el admin) vía lib/catalog.ts.
 */

import {
  NEON_DELIVERIES,
  NEON_RATES,
  NEON_SIZES,
  NEON_SUPPORTS,
  NEON_USAGES,
  type NeonConfig,
  type NeonDelivery,
  type NeonRates,
  type NeonSize,
  type NeonSupport,
  type NeonUsage,
} from "@/lib/neon-options";

/** Reglas de precio activas (por defecto las constantes; en producción, la BD). */
export type PricingOptions = {
  sizes: NeonSize[];
  supports: NeonSupport[];
  usages: NeonUsage[];
  deliveries: NeonDelivery[];
  rates: NeonRates;
};

export const DEFAULT_PRICING: PricingOptions = {
  sizes: NEON_SIZES,
  supports: NEON_SUPPORTS,
  usages: NEON_USAGES,
  deliveries: NEON_DELIVERIES,
  rates: NEON_RATES,
};

export type PriceBreakdown = {
  /** Metros de tubo de neón estimados. */
  tubeM: number;
  /** m² de material (metacrilato) estimados. */
  areaM2: number;
  /** Potencia estimada en vatios. */
  watts: number;
  tubeCost: number;
  materialCost: number;
  rgbExtra: number;
  support: number;
  subtotal: number;
  usageMultiplier: number;
  deliveryMultiplier: number;
  /** true si se aplicó el pedido mínimo. */
  minApplied: boolean;
  /** Precio final con IVA incluido (redondeado). */
  total: number;
};

/** Cuenta caracteres significativos (sin espacios ni saltos de línea). */
export function countChars(text: string): number {
  return text.replace(/\s/g, "").length;
}

export function calcPrice(
  config: Pick<NeonConfig, "text" | "colorId" | "sizeId" | "supportId" | "usageId" | "deliveryId">,
  options: PricingOptions = DEFAULT_PRICING
): PriceBreakdown {
  const size = options.sizes.find((s) => s.id === config.sizeId) ?? options.sizes[0];
  const support =
    options.supports.find((s) => s.id === config.supportId) ?? options.supports[0];
  const usage = options.usages.find((u) => u.id === config.usageId) ?? options.usages[0];
  const delivery =
    options.deliveries.find((d) => d.id === config.deliveryId) ?? options.deliveries[0];
  const { rates } = options;
  const isRgb = config.colorId === "rgb";

  // Geometría estimada a partir del texto
  const lines = config.text.split("\n").filter((l) => l.trim().length > 0);
  const lineChars = lines.map((l) => l.replace(/\s/g, "").length);
  const totalChars = lineChars.reduce((a, b) => a + b, 0);
  const maxLineChars = Math.max(0, ...lineChars);

  const tubeM = totalChars * size.tubePerCharM;
  const widthCm = maxLineChars * size.charWidthCm;
  const heightCm = Math.max(1, lines.length) * size.heightCm;
  const areaM2 = (widthCm * heightCm) / 10_000;

  // Costes según la fórmula del fabricante
  const tubeCost = tubeM * rates.perMeter;
  const materialCost = areaM2 * rates.perM2;
  const rgbExtra = isRgb ? rates.rgbExtra : 0;

  const subtotal = tubeCost + materialCost + rgbExtra + support.extraPrice;
  let total = Math.round(subtotal * usage.multiplier * delivery.multiplier);

  const minApplied = totalChars > 0 && total < rates.minTotal;
  if (minApplied) total = rates.minTotal;

  const watts = Math.round(tubeM * (isRgb ? rates.wattsPerMRgb : rates.wattsPerM));

  return {
    tubeM: Math.round(tubeM * 100) / 100,
    areaM2: Math.round(areaM2 * 1000) / 1000,
    watts,
    tubeCost: Math.round(tubeCost),
    materialCost: Math.round(materialCost),
    rgbExtra,
    support: support.extraPrice,
    subtotal: Math.round(subtotal),
    usageMultiplier: usage.multiplier,
    deliveryMultiplier: delivery.multiplier,
    minApplied,
    total,
  };
}

/** Precio "desde" de un tamaño (texto corto de referencia, sin extras). */
export function minPriceForSize(sizeId: string, options: PricingOptions = DEFAULT_PRICING): number {
  return calcPrice(
    {
      text: "neones",
      colorId: "rosa",
      sizeId,
      supportId: options.supports[0]?.id ?? "contorno",
      usageId: options.usages[0]?.id ?? "interior",
      deliveryId: options.deliveries[0]?.id ?? "standard",
    },
    options
  ).total;
}

/** Formatea un importe en euros (es-ES). */
export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

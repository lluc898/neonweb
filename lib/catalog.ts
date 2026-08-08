/**
 * Consultas de catálogo y configurador contra la BD (solo servidor).
 * Mapea las filas de Prisma a los tipos que ya usan los componentes,
 * para que la UI no dependa del esquema de la BD.
 * Si la BD está vacía o no disponible, cae a los datos semilla del código.
 */
import { prisma } from "@/lib/prisma";
import {
  PRODUCTS as SEED_PRODUCTS,
  CATEGORIES as SEED_CATEGORIES,
  type Product,
  type ProductCategory,
} from "@/lib/products";
import {
  NEON_DELIVERIES,
  NEON_RATES,
  NEON_SIZES,
  NEON_SUPPORTS,
  NEON_USAGES,
  type NeonDelivery,
  type NeonSize,
  type NeonSupport,
  type NeonUsage,
} from "@/lib/neon-options";
import type { PricingOptions } from "@/lib/pricing";

/** Campos de diseño de una fila de Product, normalizados al tipo de la UI. */
function designOf(p: {
  design: string;
  designText: string | null;
  fontId: string | null;
  svgMarkup: string | null;
  svgStroke: number | null;
}) {
  return {
    design: p.design === "SVG" ? ("SVG" as const) : ("TEXT" as const),
    designText: p.designText ?? undefined,
    fontId: p.fontId ?? undefined,
    svgMarkup: p.svgMarkup ?? undefined,
    svgStroke: p.svgStroke ?? undefined,
  };
}

export async function getCategories(): Promise<ProductCategory[]> {
  try {
    const rows = await prisma.category.findMany({ orderBy: { position: "asc" } });
    if (!rows.length) return SEED_CATEGORIES;
    return rows.map((c) => ({ id: c.slug, label: c.label }));
  } catch {
    return SEED_CATEGORIES;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });
    if (!rows.length) return SEED_PRODUCTS;
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category.slug,
      price: Math.round(p.priceCents / 100),
      color: p.color,
      symbol: p.symbol ?? undefined,
      description: p.description,
      ...designOf(p),
    }));
  } catch {
    return SEED_PRODUCTS;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const p = await prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!p || !p.active) return SEED_PRODUCTS.find((sp) => sp.slug === slug);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category.slug,
      price: Math.round(p.priceCents / 100),
      color: p.color,
      symbol: p.symbol ?? undefined,
      description: p.description,
      ...designOf(p),
    };
  } catch {
    return SEED_PRODUCTS.find((sp) => sp.slug === slug);
  }
}

/** Opciones del configurador (tarifas + tamaños/soportes/usos/entrega) desde PricingRule. */
type SizeMeta = {
  dimension?: string;
  heightCm?: number;
  maxWidthCm?: number;
  charWidthCm?: number;
  tubePerCharM?: number;
};
type DescMeta = { description?: string };
type WattsMeta = { wattsPerM?: number; wattsPerMRgb?: number };
type EtaMeta = { eta?: string };

export async function getConfiguratorOptions(): Promise<PricingOptions> {
  const fallback: PricingOptions = {
    sizes: NEON_SIZES,
    supports: NEON_SUPPORTS,
    usages: NEON_USAGES,
    deliveries: NEON_DELIVERIES,
    rates: NEON_RATES,
  };
  try {
    const rules = await prisma.pricingRule.findMany();
    if (!rules.length) return fallback;

    const sizes: NeonSize[] = rules
      .filter((r) => r.group === "SIZE")
      .map((r) => {
        const meta = (r.meta ?? {}) as SizeMeta;
        const def = NEON_SIZES.find((s) => s.id === r.code);
        return {
          id: r.code,
          label: r.label,
          dimension: meta.dimension ?? def?.dimension ?? "",
          heightCm: meta.heightCm ?? def?.heightCm ?? 20,
          maxWidthCm: meta.maxWidthCm ?? def?.maxWidthCm ?? 80,
          charWidthCm: meta.charWidthCm ?? def?.charWidthCm ?? 7,
          tubePerCharM: meta.tubePerCharM ?? def?.tubePerCharM ?? 0.35,
        };
      })
      .sort((a, b) => a.heightCm - b.heightCm);

    const supports: NeonSupport[] = rules
      .filter((r) => r.group === "SUPPORT")
      .map((r) => ({
        id: r.code,
        label: r.label,
        description: ((r.meta ?? {}) as DescMeta).description ?? "",
        extraPrice: Math.round(r.amountCents / 100),
      }))
      .sort((a, b) => a.extraPrice - b.extraPrice);

    const usages: NeonUsage[] = rules
      .filter((r) => r.group === "USAGE")
      .map((r) => ({
        id: r.code,
        label: r.label,
        description: ((r.meta ?? {}) as DescMeta).description ?? "",
        multiplier: r.multiplier ?? 1,
      }))
      .sort((a, b) => a.multiplier - b.multiplier);

    const deliveries: NeonDelivery[] = rules
      .filter((r) => r.group === "DELIVERY")
      .map((r) => ({
        id: r.code,
        label: r.label,
        eta: ((r.meta ?? {}) as EtaMeta).eta ?? "",
        multiplier: r.multiplier ?? 1,
      }))
      .sort((a, b) => a.multiplier - b.multiplier);

    const rate = (code: string, def: number) => {
      const r = rules.find((x) => x.group === "RATE" && x.code === code);
      return r ? r.amountCents / 100 : def;
    };
    const wattsRule = rules.find((x) => x.group === "RATE" && x.code === "watts");
    const wattsMeta = (wattsRule?.meta ?? {}) as WattsMeta;

    const rates = {
      perMeter: rate("meter", NEON_RATES.perMeter),
      perM2: rate("m2", NEON_RATES.perM2),
      rgbExtra: rate("rgb", NEON_RATES.rgbExtra),
      minTotal: rate("min", NEON_RATES.minTotal),
      wattsPerM: wattsMeta.wattsPerM ?? NEON_RATES.wattsPerM,
      wattsPerMRgb: wattsMeta.wattsPerMRgb ?? NEON_RATES.wattsPerMRgb,
    };

    if (!sizes.length) return fallback;
    return {
      sizes,
      supports: supports.length ? supports : NEON_SUPPORTS,
      usages: usages.length ? usages : NEON_USAGES,
      deliveries: deliveries.length ? deliveries : NEON_DELIVERIES,
      rates,
    };
  } catch {
    return fallback;
  }
}

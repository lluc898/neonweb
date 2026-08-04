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
  NEON_SIZES,
  NEON_SUPPORTS,
  NEON_USAGES,
  type NeonSize,
  type NeonSupport,
  type NeonUsage,
} from "@/lib/neon-options";

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
    };
  } catch {
    return SEED_PRODUCTS.find((sp) => sp.slug === slug);
  }
}

/** Opciones del configurador (tamaños/soportes/usos) leídas de PricingRule. */
export type ConfiguratorOptions = {
  sizes: NeonSize[];
  supports: NeonSupport[];
  usages: NeonUsage[];
};

type SizeMeta = { dimension?: string; includedChars?: number; perExtraCharCents?: number };
type DescMeta = { description?: string };

export async function getConfiguratorOptions(): Promise<ConfiguratorOptions> {
  const fallback: ConfiguratorOptions = {
    sizes: NEON_SIZES,
    supports: NEON_SUPPORTS,
    usages: NEON_USAGES,
  };
  try {
    const rules = await prisma.pricingRule.findMany();
    if (!rules.length) return fallback;

    const sizes: NeonSize[] = rules
      .filter((r) => r.group === "SIZE")
      .map((r) => {
        const meta = (r.meta ?? {}) as SizeMeta;
        return {
          id: r.code,
          label: r.label,
          dimension: meta.dimension ?? "",
          basePrice: Math.round(r.amountCents / 100),
          includedChars: meta.includedChars ?? 10,
          perExtraChar: Math.round((meta.perExtraCharCents ?? 900) / 100),
        };
      })
      .sort((a, b) => a.basePrice - b.basePrice);

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

    if (!sizes.length) return fallback;
    return { sizes, supports, usages };
  } catch {
    return fallback;
  }
}

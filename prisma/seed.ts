/**
 * Seed de la base de datos con los datos semilla actuales del código.
 * Ejecutar tras aplicar el esquema:  npx prisma db seed
 * Es idempotente (usa upsert), así que se puede correr varias veces.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PRODUCTS, CATEGORIES } from "../lib/products";
import {
  NEON_DELIVERIES,
  NEON_RATES,
  NEON_SIZES,
  NEON_SUPPORTS,
  NEON_USAGES,
} from "../lib/neon-options";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Categorías ---
  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: c.id },
      update: { label: c.label, position: i },
      create: { slug: c.id, label: c.label, position: i },
    });
  }
  console.log(`✓ ${CATEGORIES.length} categorías`);

  // --- Productos ---
  for (const p of PRODUCTS) {
    const cat = await prisma.category.findUnique({ where: { slug: p.category } });
    if (!cat) continue;
    const data = {
      name: p.name,
      description: p.description,
      categoryId: cat.id,
      priceCents: p.price * 100,
      color: p.color,
      symbol: p.symbol ?? null,
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });
  }
  console.log(`✓ ${PRODUCTS.length} productos`);

  // --- Reglas de precio del configurador ---
  // Tamaños: geometría para estimar tubo/material (fórmula del fabricante).
  for (const s of NEON_SIZES) {
    const meta = {
      dimension: s.dimension,
      heightCm: s.heightCm,
      charWidthCm: s.charWidthCm,
      tubePerCharM: s.tubePerCharM,
    };
    await prisma.pricingRule.upsert({
      where: { group_code: { group: "SIZE", code: s.id } },
      update: { label: s.label, meta },
      create: { group: "SIZE", code: s.id, label: s.label, amountCents: 0, meta },
    });
  }

  // Tarifas de fabricación: €/m de tubo, €/m² de material, RGB, mínimo, W/m.
  const rateRows = [
    { code: "meter", label: "€ por metro de tubo", amountCents: Math.round(NEON_RATES.perMeter * 100) },
    { code: "m2", label: "€ por m² de material", amountCents: Math.round(NEON_RATES.perM2 * 100) },
    { code: "rgb", label: "Suplemento RGB multicolor", amountCents: Math.round(NEON_RATES.rgbExtra * 100) },
    { code: "min", label: "Pedido mínimo", amountCents: Math.round(NEON_RATES.minTotal * 100) },
  ];
  for (const r of rateRows) {
    await prisma.pricingRule.upsert({
      where: { group_code: { group: "RATE", code: r.code } },
      update: { label: r.label, amountCents: r.amountCents },
      create: { group: "RATE", code: r.code, label: r.label, amountCents: r.amountCents },
    });
  }
  await prisma.pricingRule.upsert({
    where: { group_code: { group: "RATE", code: "watts" } },
    update: {
      label: "Potencia (W por metro)",
      meta: { wattsPerM: NEON_RATES.wattsPerM, wattsPerMRgb: NEON_RATES.wattsPerMRgb },
    },
    create: {
      group: "RATE",
      code: "watts",
      label: "Potencia (W por metro)",
      meta: { wattsPerM: NEON_RATES.wattsPerM, wattsPerMRgb: NEON_RATES.wattsPerMRgb },
    },
  });

  // Entrega: estándar 3-5 días / express 24-48 h con plus.
  for (const d of NEON_DELIVERIES) {
    await prisma.pricingRule.upsert({
      where: { group_code: { group: "DELIVERY", code: d.id } },
      update: { label: d.label, multiplier: d.multiplier, meta: { eta: d.eta } },
      create: {
        group: "DELIVERY",
        code: d.id,
        label: d.label,
        multiplier: d.multiplier,
        meta: { eta: d.eta },
      },
    });
  }
  for (const s of NEON_SUPPORTS) {
    await prisma.pricingRule.upsert({
      where: { group_code: { group: "SUPPORT", code: s.id } },
      update: { label: s.label, amountCents: s.extraPrice * 100, meta: { description: s.description } },
      create: { group: "SUPPORT", code: s.id, label: s.label, amountCents: s.extraPrice * 100, meta: { description: s.description } },
    });
  }
  for (const u of NEON_USAGES) {
    await prisma.pricingRule.upsert({
      where: { group_code: { group: "USAGE", code: u.id } },
      update: { label: u.label, multiplier: u.multiplier, meta: { description: u.description } },
      create: { group: "USAGE", code: u.id, label: u.label, multiplier: u.multiplier, meta: { description: u.description } },
    });
  }
  console.log(`✓ reglas de precio (tamaños, soportes, usos)`);

  // --- Superadmin del panel (usuario "admin") ---
  // Contraseña inicial: el hash de ADMIN_PASSWORD_HASH (.env). Solo se crea si
  // no existe; nunca sobreescribe una contraseña ya cambiada.
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (adminHash) {
    const existing = await prisma.adminUser.findUnique({ where: { username: "admin" } });
    if (!existing) {
      await prisma.adminUser.create({
        data: { username: "admin", passwordHash: adminHash, isSuperadmin: true },
      });
      console.log(`✓ usuario superadmin "admin" creado`);
    } else {
      console.log(`✓ usuario "admin" ya existe`);
    }
  } else {
    console.warn("⚠ ADMIN_PASSWORD_HASH no definido: no se crea el usuario admin");
  }
}

main()
  .then(() => console.log("Seed completado."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Seed de la base de datos con los datos semilla actuales del código.
 * Ejecutar tras aplicar el esquema:  npx prisma db seed
 * Es idempotente (usa upsert), así que se puede correr varias veces.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PRODUCTS, CATEGORIES } from "../lib/products";
import { NEON_SIZES, NEON_SUPPORTS, NEON_USAGES } from "../lib/neon-options";

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
  for (const s of NEON_SIZES) {
    await prisma.pricingRule.upsert({
      where: { group_code: { group: "SIZE", code: s.id } },
      update: {
        label: s.label,
        amountCents: s.basePrice * 100,
        meta: { dimension: s.dimension, includedChars: s.includedChars, perExtraCharCents: s.perExtraChar * 100 },
      },
      create: {
        group: "SIZE",
        code: s.id,
        label: s.label,
        amountCents: s.basePrice * 100,
        meta: { dimension: s.dimension, includedChars: s.includedChars, perExtraCharCents: s.perExtraChar * 100 },
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

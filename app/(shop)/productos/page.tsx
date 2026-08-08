import type { Metadata } from "next";
import Link from "next/link";
import { ProductCatalog } from "@/components/shop/product-catalog";
import { getCategories, getProducts } from "@/lib/catalog";
import { configuratorFontVars } from "@/lib/neon-fonts";

export const metadata: Metadata = {
  title: "Catálogo de neones LED",
  description:
    "Explora nuestros neones LED para bodas, cumpleaños, frases, iconos y negocios. O diseña el tuyo a medida.",
};

// Catálogo desde la BD; el admin lo refresca con revalidatePath al editar.
export const revalidate = 300;

export default async function ProductosPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    // Las fuentes del configurador: un producto puede estar diseñado con una.
    // Van con `preload: false`, así que solo se descargan si se usan.
    <main className={`${configuratorFontVars} mx-auto w-full max-w-6xl flex-1 px-6 py-10`}>
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">
          Catálogo
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          Diseños listos para brillar. ¿No encuentras el tuyo?{" "}
          <Link href="/personalizar" className="text-neon-cyan hover:underline">
            Créalo a medida
          </Link>
          .
        </p>
      </header>

      <ProductCatalog products={products} categories={categories} />
    </main>
  );
}

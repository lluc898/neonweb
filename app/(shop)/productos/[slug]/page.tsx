import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/shop/product-detail";
import { getConfiguratorOptions, getProductBySlug } from "@/lib/catalog";

// Fichas desde la BD, cacheadas y regeneradas bajo demanda (ISR).
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, options] = await Promise.all([
    getProductBySlug(slug),
    // Mismas reglas que el configurador: soportes, usos y suplemento RGB
    // salen de la BD, así el admin los cambia sin tocar código.
    getConfiguratorOptions(),
  ]);
  if (!product) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <Link href="/productos" className="text-sm text-muted transition-colors hover:text-text">
        ← Volver al catálogo
      </Link>
      <div className="mt-6">
        <ProductDetail product={product} options={options} />
      </div>
    </main>
  );
}

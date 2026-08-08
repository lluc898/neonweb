import Link from "next/link";
import { formatEUR } from "@/lib/pricing";
import { getCategoryLabel, type Product } from "@/lib/products";
import { NeonStage } from "@/components/shop/neon-stage";
import { ProductArtwork } from "@/components/shop/product-artwork";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-neon-cyan/50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
    >
      {/* Preview: el neón "colgado" en una pared real */}
      <NeonStage color={product.color} className="h-44 p-5">
        <ProductArtwork
          product={product}
          sizeRem={product.symbol ? 3.75 : 1.9}
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </NeonStage>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs uppercase tracking-wider text-muted">
          {getCategoryLabel(product.category)}
        </span>
        <h3 className="mt-1 font-semibold text-text">{product.name}</h3>
        <span className="mt-2 text-sm text-muted">
          desde <span className="font-semibold text-text">{formatEUR(product.price - 40)}</span>
        </span>
      </div>
    </Link>
  );
}

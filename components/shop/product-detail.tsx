"use client";

import { useState } from "react";
import { cn, neonTextGlow } from "@/lib/utils";
import { formatEUR } from "@/lib/pricing";
import { NEON_COLORS } from "@/lib/neon-options";
import { PRODUCT_SIZES, getCategoryLabel, type Product } from "@/lib/products";
import { NeonStage } from "@/components/shop/neon-stage";
import { addToCart } from "@/lib/cart";

export function ProductDetail({ product }: { product: Product }) {
  const [hex, setHex] = useState(product.color);
  const [sizeId, setSizeId] = useState("m");
  const [added, setAdded] = useState(false);

  const size = PRODUCT_SIZES.find((s) => s.id === sizeId) ?? PRODUCT_SIZES[1];
  const price = product.price + size.delta;

  const handleAdd = () => {
    addToCart(
      {
        type: "product",
        slug: product.slug,
        name: product.name,
        color: hex,
        sizeId,
        price,
        addedAt: Date.now(),
      },
      product.name
    );
    setAdded(true);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Preview: el neón en su pared */}
      <NeonStage
        color={hex}
        className="group min-h-[320px] rounded-2xl border border-border p-8"
      >
        {product.symbol ? (
          <span className="text-8xl" style={{ filter: `drop-shadow(0 0 22px ${hex})` }}>
            {product.symbol}
          </span>
        ) : (
          <span
            className="animate-flicker text-center font-[family-name:var(--font-script)] text-5xl leading-tight"
            style={{ color: hex, textShadow: neonTextGlow(hex) }}
          >
            {product.name}
          </span>
        )}
      </NeonStage>

      {/* Info + opciones */}
      <div>
        <span className="text-xs uppercase tracking-wider text-muted">
          {getCategoryLabel(product.category)}
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold">
          {product.name}
        </h1>
        <p className="mt-3 text-muted">{product.description}</p>

        {/* Color */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-text">Color</p>
          <div className="flex flex-wrap gap-2.5">
            {NEON_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setHex(c.hex)}
                aria-label={c.label}
                title={c.label}
                className={cn(
                  "h-9 w-9 rounded-full transition-transform hover:scale-110",
                  hex === c.hex && "ring-2 ring-white ring-offset-2 ring-offset-bg"
                )}
                style={{ backgroundColor: c.hex, boxShadow: `0 0 10px ${c.hex}` }}
              />
            ))}
          </div>
        </div>

        {/* Tamaño */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-text">Tamaño</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {PRODUCT_SIZES.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSizeId(s.id);
                  setAdded(false);
                }}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  sizeId === s.id
                    ? "border-neon-magenta bg-neon-magenta/10"
                    : "border-border bg-surface hover:border-muted"
                )}
              >
                <span className="block text-sm font-medium text-text">{s.label}</span>
                <span className="block text-xs text-muted">{s.dimension}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Precio + CTA */}
        <div className="mt-8 flex items-center gap-5">
          <span className="text-4xl font-bold">{formatEUR(price)}</span>
          <span className="text-sm text-muted">IVA incl.</span>
        </div>
        <button
          onClick={handleAdd}
          className={cn(
            "mt-4 h-12 w-full rounded-full text-sm font-semibold transition-all sm:w-auto sm:px-10",
            added
              ? "bg-neon-cyan/20 text-neon-cyan neon-box-cyan"
              : "bg-neon-magenta text-white shadow-[0_0_16px_rgba(236,30,140,0.5)] hover:shadow-[0_0_28px_rgba(236,30,140,0.85)]"
          )}
        >
          {added ? "✓ Añadido al carrito" : "Añadir al carrito"}
        </button>
      </div>
    </div>
  );
}

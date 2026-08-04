"use client";

import { useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory } from "@/lib/products";

export function ProductCatalog({
  products,
  categories,
}: {
  products: Product[];
  categories: ProductCategory[];
}) {
  const PAGE_SIZE = 12;
  const [active, setActive] = useState<string>("todos");
  const [page, setPage] = useState(1);

  const filtered =
    active === "todos" ? products : products.filter((p) => p.category === active);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectCategory = (id: string) => {
    setActive(id);
    setPage(1); // al cambiar de categoría, volver a la primera página
  };

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tabs = [{ id: "todos", label: "Todos" }, ...categories];

  return (
    <div>
      {/* Filtros */}
      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => selectCategory(t.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              active === t.id
                ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                : "border-border text-muted hover:text-text"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cuadrícula */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {paged.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <nav
          className="mt-8 flex items-center justify-center gap-4 text-sm"
          aria-label="Paginación del catálogo"
        >
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="text-neon-cyan hover:underline disabled:pointer-events-none disabled:text-muted/40"
          >
            ← Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                p === page
                  ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                  : "border-border text-muted hover:text-text"
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="text-neon-cyan hover:underline disabled:pointer-events-none disabled:text-muted/40"
          >
            Siguiente →
          </button>
        </nav>
      )}
    </div>
  );
}

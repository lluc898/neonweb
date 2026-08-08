"use client";

import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/products";

/**
 * Carrusel horizontal de productos con desplazamiento por "páginas".
 * Usa scroll nativo con scroll-snap (arrastre y swipe funcionan solos) y
 * añade flechas que se desactivan al llegar a los extremos.
 */
export function ProductSlider({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      setAtStart(track.scrollLeft <= 4);
      setAtEnd(track.scrollLeft >= max - 4);
    };
    update();

    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    // Se desplaza casi una pantalla, dejando una tarjeta de referencia.
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow =
    "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text transition-all hover:border-neon-cyan hover:text-neon-cyan disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="relative">
      {/* Flechas (ocultas en móvil: allí se desliza con el dedo) */}
      <div className="mb-4 hidden justify-end gap-2 sm:flex">
        <button onClick={() => scrollByPage(-1)} disabled={atStart} aria-label="Anterior" className={arrow}>
          ←
        </button>
        <button onClick={() => scrollByPage(1)} disabled={atEnd} aria-label="Siguiente" className={arrow}>
          →
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Diseños destacados"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="w-[70%] shrink-0 snap-start sm:w-[45%] lg:w-[31%] xl:w-[23.5%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {/* Difuminado lateral para insinuar que hay más contenido */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-bg to-transparent transition-opacity sm:block",
          atEnd && "opacity-0"
        )}
        aria-hidden
      />
    </div>
  );
}

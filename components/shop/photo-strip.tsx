"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Tira horizontal de fotografías de neones ya fabricados.
 *
 * A propósito NO es un banner a pantalla completa: son fotos en formato tarjeta
 * (3:2, la proporción nativa de los archivos, así no se recortan) que se leen
 * como fotos reales del taller. Se desliza con el dedo o con las flechas y, al
 * pulsar una, se abre a tamaño completo.
 */

const PHOTOS = Array.from({ length: 10 }, (_, i) => `/galeria/neon-${i + 1}.webp`);
const ALT = "Rótulo de neón iluminado";

export function PhotoStrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

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
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  const step = useCallback((delta: number) => {
    setOpen((i) => (i === null ? i : (i + delta + PHOTOS.length) % PHOTOS.length));
  }, []);

  // Con la foto abierta: Escape cierra, flechas navegan y la página no scrollea.
  useEffect(() => {
    if (open === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, step]);

  const arrow =
    "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text transition-all hover:border-neon-cyan hover:text-neon-cyan disabled:pointer-events-none disabled:opacity-30";

  return (
    <>
      <div className="relative">
        <div className="mx-auto mb-4 flex w-full max-w-6xl items-end justify-between gap-4 px-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted">
              Nuestro taller
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-extrabold sm:text-2xl">
              Neones que hemos <span className="neon-cyan">fabricado</span>
            </h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button onClick={() => scrollByPage(-1)} disabled={atStart} aria-label="Fotos anteriores" className={arrow}>
              ←
            </button>
            <button onClick={() => scrollByPage(1)} disabled={atEnd} aria-label="Más fotos" className={arrow}>
              →
            </button>
          </div>
        </div>

        {/*
          La tira sangra hasta el borde de la pantalla, pero la primera foto se
          alinea con el contenido (max-w-6xl = 72rem). Así se ve que hay más.
        */}
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingInline: "max(1.5rem, calc((100vw - 72rem) / 2))" }}
          role="region"
          aria-label="Galería de neones fabricados"
        >
          {PHOTOS.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Ver foto ${i + 1} de ${PHOTOS.length} a tamaño completo`}
              className="group relative aspect-[3/2] w-[230px] shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-surface transition-all hover:border-neon-cyan/60 hover:shadow-[0_0_24px_-4px_rgba(41,171,226,0.45)] focus-visible:border-neon-cyan focus-visible:outline-none sm:w-[280px] lg:w-[320px]"
            >
              <Image
                src={src}
                alt={ALT}
                fill
                sizes="(max-width: 640px) 230px, (max-width: 1024px) 280px, 320px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              />
              {/* Sombra inferior: separa la foto del borde y da profundidad. */}
              <span
                className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
                aria-hidden
              />
              <span
                className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white/85 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                aria-hidden
              >
                Ampliar
              </span>
            </button>
          ))}
        </div>

        {/* Difuminado en el borde derecho mientras quede recorrido. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 hidden w-20 bg-gradient-to-l from-bg to-transparent transition-opacity sm:block",
            atEnd && "opacity-0"
          )}
          aria-hidden
        />
      </div>

      {/* Visor a tamaño completo */}
      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${ALT} — foto ${open + 1} de ${PHOTOS.length}`}
            onClick={() => setOpen(null)}
          >
            <div className="flex items-center justify-between px-6 py-4 text-sm text-white/70">
              <span>
                {open + 1} / {PHOTOS.length}
              </span>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-neon-cyan hover:text-neon-cyan"
              >
                ✕
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-4 pb-8">
              <motion.div
                key={open}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="relative h-full w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={PHOTOS[open]}
                  alt={ALT}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </motion.div>

              {(["prev", "next"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(dir === "next" ? 1 : -1);
                  }}
                  aria-label={dir === "next" ? "Foto siguiente" : "Foto anterior"}
                  className={cn(
                    "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:border-neon-cyan hover:text-neon-cyan",
                    dir === "next" ? "right-3" : "left-3"
                  )}
                >
                  {dir === "next" ? "→" : "←"}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

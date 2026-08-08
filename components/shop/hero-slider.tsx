"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Carrusel de portada: fotografías de neones a pantalla ancha con el mensaje
 * principal encima. Avanza solo (se pausa al pasar el ratón o con el teclado)
 * y respeta `prefers-reduced-motion`.
 */

const SLIDES = Array.from({ length: 10 }, (_, i) => ({
  src: `/galeria/neon-${i + 1}.webp`,
  alt: `Rótulo de neón iluminado (${i + 1} de 10)`,
}));

const INTERVAL = 5500;

export function HeroSlider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion.current) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(timer);
  }, [paused]);

  const arrow =
    "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors hover:border-neon-cyan hover:text-neon-cyan";

  return (
    <section
      className="relative isolate overflow-hidden border-b border-border"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carrusel"
      aria-label="Neones iluminados"
    >
      {/* Imágenes superpuestas con fundido */}
      <div className="absolute inset-0 -z-10">
        {SLIDES.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={i === index ? slide.alt : ""}
            fill
            sizes="100vw"
            priority={i === 0}
            aria-hidden={i !== index}
            className={cn(
              "object-cover transition-opacity duration-1000 ease-in-out",
              i === index ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
        {/* Velo oscuro para que el texto siempre sea legible */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-bg/60"
          aria-hidden
        />
        <div className="absolute inset-0 bg-bg/30" aria-hidden />
      </div>

      {/* Contenido (hero) */}
      <div className="relative mx-auto w-full max-w-6xl px-6 py-14 sm:py-20">{children}</div>

      {/* Controles */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 mx-auto flex w-full max-w-6xl items-center justify-between px-6">
        <div className="pointer-events-auto flex gap-1.5" role="tablist" aria-label="Ir a la imagen">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Imagen ${i + 1}`}
              onClick={() => go(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-neon-cyan shadow-[0_0_8px_rgba(41,171,226,0.8)]" : "w-1.5 bg-white/35 hover:bg-white/60"
              )}
            />
          ))}
        </div>

        <div className="hidden gap-2 sm:flex">
          <button onClick={() => go(index - 1)} aria-label="Imagen anterior" className={arrow}>
            ←
          </button>
          <button onClick={() => go(index + 1)} aria-label="Imagen siguiente" className={arrow}>
            →
          </button>
        </div>
      </div>
    </section>
  );
}

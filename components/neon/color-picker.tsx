"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatEUR } from "@/lib/pricing";
import { NEON_COLORS } from "@/lib/neon-options";

/**
 * Selector de color en dos modos:
 *  - Color fijo  → despliega la paleta de colores LED disponibles.
 *  - RGB multicolor → un solo tubo que cambia de color con mando (suplemento).
 * Recuerda el último color fijo elegido para poder volver a él desde RGB.
 */

const RGB_GRADIENT =
  "conic-gradient(#ff0040, #ff8c1a, #ffe600, #39ff14, #29abe2, #b026ff, #ff0040)";

const FIXED_COLORS = NEON_COLORS.filter((c) => !c.rgb);

export function ColorPicker({
  value,
  onChange,
  rgbExtra,
}: {
  value: string;
  onChange: (id: string) => void;
  rgbExtra: number;
}) {
  const isRgb = value === "rgb";
  const [lastFixed, setLastFixed] = useState(isRgb ? FIXED_COLORS[2].id : value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = FIXED_COLORS.find((c) => c.id === (isRgb ? lastFixed : value)) ?? FIXED_COLORS[0];

  // Cerrar el desplegable al hacer clic fuera o pulsar Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pickFixedMode = () => {
    if (isRgb) {
      onChange(lastFixed);
      setOpen(true); // invita a elegir color al cambiar de modo
    } else {
      setOpen((v) => !v);
    }
  };

  const pickColor = (id: string) => {
    setLastFixed(id);
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={wrapRef}>
      {/* Modos */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={pickFixedMode}
          aria-pressed={!isRgb}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
            !isRgb
              ? "border-neon-cyan bg-neon-cyan/10"
              : "border-border bg-bg hover:border-muted"
          )}
        >
          <span
            className="h-8 w-8 shrink-0 rounded-full"
            style={{ backgroundColor: selected.hex, boxShadow: `0 0 10px ${selected.hex}` }}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-text">Color fijo</span>
            <span className="block truncate text-xs text-muted">{selected.label}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onChange("rgb");
            setOpen(false);
          }}
          aria-pressed={isRgb}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
            isRgb
              ? "border-neon-cyan bg-neon-cyan/10"
              : "border-border bg-bg hover:border-muted"
          )}
        >
          <span
            className={cn("h-8 w-8 shrink-0 rounded-full", isRgb && "animate-rgb")}
            style={{ background: RGB_GRADIENT, boxShadow: "0 0 10px rgba(255,255,255,0.4)" }}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-text">RGB multicolor</span>
            <span className="block truncate text-xs text-muted">
              {rgbExtra > 0 ? `+${formatEUR(rgbExtra)}` : "incluido"}
            </span>
          </span>
        </button>
      </div>

      {/* Desplegable de colores (solo en modo fijo) */}
      {!isRgb && (
        <div className="relative mt-2.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-bg px-4 py-2.5 text-left transition-colors hover:border-muted"
          >
            <span
              className="h-5 w-5 shrink-0 rounded-full"
              style={{ backgroundColor: selected.hex, boxShadow: `0 0 8px ${selected.hex}` }}
              aria-hidden
            />
            <span className="flex-1 text-sm text-text">{selected.label}</span>
            <span
              className={cn(
                "text-xs text-muted transition-transform duration-200",
                open && "rotate-180"
              )}
              aria-hidden
            >
              ▾
            </span>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                role="listbox"
                className="absolute z-30 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
              >
                <div className="grid grid-cols-2 gap-1">
                  {FIXED_COLORS.map((c) => {
                    const active = !isRgb && c.id === value;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => pickColor(c.id)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                          active ? "bg-neon-cyan/15" : "hover:bg-surface-2"
                        )}
                      >
                        <span
                          className="h-5 w-5 shrink-0 rounded-full transition-transform"
                          style={{ backgroundColor: c.hex, boxShadow: `0 0 8px ${c.hex}` }}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "truncate text-xs",
                            active ? "text-neon-cyan" : "text-text"
                          )}
                        >
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {isRgb && (
        <p className="mt-2 text-xs text-muted">
          Un solo tubo que cambia de color y de efecto con mando a distancia (incluido).
        </p>
      )}
    </div>
  );
}

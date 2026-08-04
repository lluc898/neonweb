"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Toast global de "añadido al carrito". Se monta una vez en el layout raíz y
 * escucha el evento `cart-added` (emitido por lib/cart.ts). Entra con un
 * muelle desde abajo, dibuja el check y se autodescarta.
 */
export function CartToastHost() {
  const [toast, setToast] = useState<{ label: string; id: number } | null>(null);

  useEffect(() => {
    const onAdded = (e: Event) => {
      const label = (e as CustomEvent<{ label?: string }>).detail?.label ?? "Artículo";
      setToast({ label, id: Date.now() });
    };
    window.addEventListener("cart-added", onAdded);
    return () => window.removeEventListener("cart-added", onAdded);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4 sm:justify-end sm:pr-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: 28, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-neon-cyan/40 bg-surface/95 py-3 pl-3 pr-4 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_18px_rgba(41,171,226,0.25)] backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            {/* Check que se dibuja */}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neon-cyan/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <motion.path
                  d="M4.5 12.5l5 5L19.5 7"
                  stroke="#29abe2"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.15, duration: 0.35, ease: "easeOut" }}
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">
                “{toast.label}” añadido al carrito
              </p>
              <Link
                href="/carrito"
                onClick={() => setToast(null)}
                className="text-xs font-medium text-neon-cyan hover:underline"
              >
                Ver carrito →
              </Link>
            </div>
            <button
              onClick={() => setToast(null)}
              aria-label="Cerrar aviso"
              className="ml-2 text-muted transition-colors hover:text-text"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

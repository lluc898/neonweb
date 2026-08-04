"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { neonTextGlow } from "@/lib/utils";
import { formatEUR } from "@/lib/pricing";
import { findColor } from "@/lib/neon-options";
import { readCart, removeFromCart, type CartItem } from "@/lib/cart";

export function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  const remove = (index: number) => {
    setItems(removeFromCart(index));
  };

  const total = items.reduce((sum, it) => sum + it.price, 0);

  if (!ready) return null;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <p className="text-lg text-muted">Tu carrito está vacío.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/personalizar"
            className="rounded-full bg-neon-magenta px-6 py-3 text-sm font-semibold text-white shadow-[0_0_16px_rgba(236,30,140,0.5)]"
          >
            Diseña tu neón
          </Link>
          <Link
            href="/productos"
            className="rounded-full border border-border px-6 py-3 text-sm text-text hover:border-neon-cyan"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-3">
        {items.map((it, i) => {
          const label = it.type === "custom" ? it.config.text || "Neón personalizado" : it.name;
          const hex = it.type === "custom" ? findColor(it.config.colorId).hex : it.color;
          return (
            <li
              key={it.addedAt + "-" + i}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-center text-sm"
                style={{
                  background: "#0a0a0f",
                  color: hex,
                  textShadow: neonTextGlow(hex, 0.9),
                }}
              >
                {it.type === "custom" ? "abc" : label.slice(0, 3)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text">{label}</p>
                <p className="text-xs uppercase tracking-wide text-muted">
                  {it.type === "custom" ? "Personalizado" : "Catálogo"}
                </p>
              </div>
              <span className="font-semibold text-text">{formatEUR(it.price)}</span>
              <button
                onClick={() => remove(i)}
                aria-label="Quitar"
                className="text-muted transition-colors hover:text-neon-magenta"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-24">
        <div className="flex justify-between text-lg">
          <span className="text-muted">Total</span>
          <span className="font-bold text-text">{formatEUR(total)}</span>
        </div>
        <p className="mt-1 text-xs text-muted">IVA incluido. Envío calculado al finalizar.</p>
        <button
          className="mt-5 h-12 w-full rounded-full bg-neon-magenta text-sm font-semibold text-white shadow-[0_0_16px_rgba(236,30,140,0.5)] transition-shadow hover:shadow-[0_0_28px_rgba(236,30,140,0.85)]"
          disabled
        >
          Finalizar compra
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          El pago se habilitará en la última fase del proyecto.
        </p>
      </aside>
    </div>
  );
}

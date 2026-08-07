"use client";

import type { NeonConfig } from "@/lib/neon-options";

/**
 * Carrito v1 en localStorage (clave `neon_cart`).
 * Única fuente de verdad de lectura/escritura: emite eventos para que la UI
 * reaccione (`cart-updated` → contador del header; `cart-added` → toast).
 */

export type CartItem =
  | {
      type: "custom";
      config: NeonConfig;
      price: number;
      /** Estimaciones de fabricación (tubo, material, potencia). */
      specs?: { tubeM: number; areaM2: number; watts: number };
      addedAt: number;
    }
  | {
      type: "product";
      slug: string;
      name: string;
      color: string;
      sizeId: string;
      price: number;
      addedAt: number;
    };

const KEY = "neon_cart";

export function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

/** Añade un artículo y notifica a la UI (badge + toast con el nombre). */
export function addToCart(item: CartItem, label: string) {
  persist([...readCart(), item]);
  window.dispatchEvent(new CustomEvent("cart-added", { detail: { label } }));
}

export function removeFromCart(index: number): CartItem[] {
  const next = readCart().filter((_, i) => i !== index);
  persist(next);
  return next;
}

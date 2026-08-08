"use client";

import type { NeonConfig } from "@/lib/neon-options";
import type { PriceBreakdown } from "@/lib/pricing";

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
      /**
       * Desglose completo tal como se lo mostramos al cliente al añadirlo
       * (incluye metros de tubo, m², potencia y multiplicadores).
       * El precio real se revalida en servidor antes de cobrar.
       */
      breakdown?: PriceBreakdown;
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

// --- Suscripción para useSyncExternalStore (carrito = almacén externo) ---

const EMPTY: CartItem[] = [];
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

/** Snapshot estable: solo re-parsea si el JSON guardado cambió. */
export function getCartSnapshot(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedItems = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY;
    } catch {
      cachedItems = EMPTY;
    }
  }
  return cachedItems;
}

/** En servidor no hay carrito: siempre vacío (evita desajustes de hidratación). */
export function getCartServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function subscribeCart(onChange: () => void): () => void {
  window.addEventListener("cart-updated", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("cart-updated", onChange);
    window.removeEventListener("storage", onChange);
  };
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

export function removeFromCart(index: number): void {
  persist(readCart().filter((_, i) => i !== index));
}

/** Vacía el carrito (tras registrar el pedido). */
export function clearCart(): void {
  persist([]);
}
